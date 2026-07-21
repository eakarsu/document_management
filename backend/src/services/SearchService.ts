import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ExcelJS from 'exceljs';
import { LibreOfficeService } from './LibreOfficeService';

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  metadata: {
    category?: string;
    tags: string[];
    mimeType: string;
    customFields?: Record<string, any>;
    fileName?: string;
    originalName?: string;
  };
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SearchResult {
  documents: Array<{
    id: string;
    title: string;
    content: string;
    metadata: any;
    score: number;
    highlights?: Record<string, string[]>;
  }>;
  total: number;
  aggregations?: Record<string, any>;
}

interface SearchOptions {
  query?: string;
  filters?: Record<string, any>;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  from?: number;
  size?: number;
  highlight?: boolean;
  aggregations?: Record<string, any>;
}

export class SearchService {
  private elasticsearch: ElasticsearchClient;
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private libreOfficeService: LibreOfficeService;
  private indexName: string = 'dms-documents';
  private esAvailable: boolean | null = null; // null = unknown, true/false = checked
  private esLastChecked: number = 0;
  private readonly ES_CHECK_INTERVAL_MS = 30_000; // recheck every 30s

  constructor() {
    this.elasticsearch = new ElasticsearchClient({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });

    this.prisma = new PrismaClient();
    this.libreOfficeService = new LibreOfficeService();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    // this.initializeIndex() // DISABLED;
  }

  /** Check if Elasticsearch is reachable; result is cached for 30s */
  private async isElasticsearchAvailable(): Promise<boolean> {
    const now = Date.now();
    if (this.esAvailable !== null && now - this.esLastChecked < this.ES_CHECK_INTERVAL_MS) {
      return this.esAvailable;
    }
    try {
      await Promise.race([
        this.elasticsearch.cluster.health({} as any),
        new Promise((_, reject) => setTimeout(() => reject(new Error('ES ping timeout')), 3000))
      ]);
      if (!this.esAvailable) {
        this.logger.info('Elasticsearch is now available — resuming ES-backed search');
      }
      this.esAvailable = true;
    } catch {
      if (this.esAvailable !== false) {
        this.logger.warn('Elasticsearch is unavailable — falling back to PostgreSQL search');
      }
      this.esAvailable = false;
    }
    this.esLastChecked = now;
    return this.esAvailable;
  }

  /** PostgreSQL fallback search — returns the same SearchResult shape */
  private async postgresSearch(
    organizationId: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const { query, filters = {} } = options;
    const from = Math.max(0, Math.trunc(Number(options.from) || 0));
    const size = Math.min(100, Math.max(1, Math.trunc(Number(options.size) || 20)));

    // Build a simple ILIKE query across title, fileName and ocrText
    const conditions: string[] = ['"organizationId" = $1'];
    const params: any[] = [organizationId];
    let paramIdx = 2;

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      params.push(q);
      conditions.push(
        `(title ILIKE $${paramIdx} OR "fileName" ILIKE $${paramIdx} OR "originalName" ILIKE $${paramIdx} OR "ocrText" ILIKE $${paramIdx})`
      );
      paramIdx++;
    }

    if (filters.category) {
      params.push(filters.category);
      conditions.push(`category = $${paramIdx++}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text as count FROM documents ${whereClause}`,
      ...params
    );
    const total = parseInt(countResult[0]?.count || '0');

    params.push(size, from);
    const limitParameter = `$${paramIdx++}`;
    const offsetParameter = `$${paramIdx++}`;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, title, "fileName", "originalName", "mimeType", category, tags,
              "ocrText", "organizationId", "createdAt", "updatedAt"
       FROM documents ${whereClause}
       ORDER BY "updatedAt" DESC
       LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
      ...params
    );

    const documents = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.ocrText || '',
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      metadata: {
        category: row.category,
        tags: row.tags || [],
        mimeType: row.mimeType,
        fileName: row.fileName,
        originalName: row.originalName
      },
      score: 1,
      highlights: undefined,
      _fallback: 'postgresql'
    }));

    this.logger.info('PostgreSQL fallback search completed', { query, total, resultsCount: documents.length });
    return { documents, total };
  }

  private async initializeIndex_DISABLED(): Promise<void> {
    try {
      // Check if index exists
      const indexExists = await this.elasticsearch.indices.exists({
        index: this.indexName
      });

      if (!indexExists) {
        // Create index with mapping
        try {
          await this.elasticsearch.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  content_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball']
                  },
                  filename_analyzer: {
                    type: 'custom',
                    tokenizer: 'keyword',
                    filter: ['lowercase']
                  }
                }
              }
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: { 
                  type: 'text',
                  analyzer: 'content_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                content: { 
                  type: 'text',
                  analyzer: 'content_analyzer'
                },
                organizationId: { type: 'keyword' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                metadata: {
                  properties: {
                    category: { 
                      type: 'keyword',
                      fields: {
                        text: { type: 'text' }
                      }
                    },
                    tags: { type: 'keyword' },
                    mimeType: { type: 'keyword' },
                    fileName: { 
                      type: 'text',
                      analyzer: 'filename_analyzer',
                      fields: {
                        keyword: { type: 'keyword' }
                      }
                    },
                    originalName: { 
                      type: 'text',
                      analyzer: 'filename_analyzer',
                      fields: {
                        keyword: { type: 'keyword' }
                      }
                    },
                    customFields: { type: 'object' }
                  }
                }
              }
            }
          }
        });

          this.logger.info('Elasticsearch index created successfully', { index: this.indexName });
        } catch (createError: any) {
          if (createError.meta?.body?.error?.type === 'resource_already_exists_exception') {
            this.logger.info('Elasticsearch index already exists', { index: this.indexName });
          } else {
            throw createError;
          }
        }
      }

    } catch (error: any) {
      this.logger.error('Failed to initialize Elasticsearch index:', error);
      throw error;
    }
  }

  async indexDocument(document: SearchDocument): Promise<void> {
    const esUp = await this.isElasticsearchAvailable();
    if (!esUp) {
      this.logger.warn('Elasticsearch unavailable — skipping document indexing (will be indexed when ES recovers)', {
        documentId: document.id
      });
      return; // Graceful degradation: document is stored in PG, search falls back to PG
    }

    try {
      await this.elasticsearch.index({
        index: this.indexName,
        id: document.id,
        body: {
          id: document.id,
          title: document.title,
          content: document.content,
          organizationId: document.organizationId,
          createdAt: document.createdAt || new Date(),
          updatedAt: document.updatedAt || new Date(),
          metadata: document.metadata
        }
      });

      // Refresh index to make document searchable immediately
      await this.elasticsearch.indices.refresh({ index: this.indexName });

      this.logger.info('Document indexed successfully', {
        documentId: document.id,
        title: document.title
      });

    } catch (error: any) {
      this.logger.error('Failed to index document (ES may be down):', error);
      this.esAvailable = false;
      this.esLastChecked = Date.now();
      // Non-fatal: document is safe in PostgreSQL
    }
  }

  async indexDocumentWithExtraction(documentId: string, organizationId: string): Promise<void> {
    try {
      this.logger.info('Indexing single document with text extraction', { documentId });

      // Get document from database
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, organizationId },
        include: { createdBy: true }
      });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Extract text content from the file
      const extractedContent = await this.extractTextContent(document.storagePath, document.mimeType, organizationId);
      const content = document.ocrText || extractedContent || '';

      // Index document with extracted content
      await this.elasticsearch.index({
        index: this.indexName,
        id: document.id,
        body: {
          id: document.id,
          title: document.title,
          content: content,
          organizationId: document.organizationId,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          metadata: {
            category: document.category,
            tags: document.tags,
            mimeType: document.mimeType,
            fileName: document.fileName,
            originalName: document.originalName,
            customFields: document.customFields
          }
        }
      });

      // Refresh index to make document searchable immediately
      await this.elasticsearch.indices.refresh({ index: this.indexName });

      this.logger.info('Document indexed with text extraction successfully', { 
        documentId: document.id,
        title: document.title,
        contentLength: content.length
      });

    } catch (error: any) {
      this.logger.error('Failed to index document with extraction:', error);
      throw error;
    }
  }

  async updateDocument(document: Partial<SearchDocument> & { id: string }): Promise<void> {
    try {
      const updateBody: any = {};

      if (document.title) updateBody.title = document.title;
      if (document.content) updateBody.content = document.content;
      if (document.metadata) updateBody.metadata = document.metadata;
      updateBody.updatedAt = new Date();

      await this.elasticsearch.update({
        index: this.indexName,
        id: document.id,
        body: {
          doc: updateBody
        }
      });

      this.logger.info('Document updated in index', { documentId: document.id });

    } catch (error: any) {
      this.logger.error('Failed to update document in index:', error);
      // Don't throw error - Elasticsearch is optional, allow update to succeed even if search index fails
      this.logger.warn('Continuing without search index update - Elasticsearch may not be running');
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.elasticsearch.delete({
        index: this.indexName,
        id: documentId
      });

      this.logger.info('Document deleted from index', { documentId });

    } catch (error: any) {
      this.logger.error('Failed to delete document from index:', error);
      throw error;
    }
  }

  async search(
    organizationId: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    try {
      const {
        query,
        filters = {},
        sort = [],
        from = 0,
        size = 20,
        highlight = true,
        aggregations = {}
      } = options;

      // Build Elasticsearch query
      const esQuery: any = {
        bool: {
          must: [],
          filter: [
            { term: { organizationId } }
          ]
        }
      };

      // Add text search
      if (query && query.trim()) {
        esQuery.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: [
              'title^3',
              'content^2',
              'metadata.fileName^2',
              'metadata.originalName^2',
              'metadata.tags^1.5'
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'or'
          }
        });
      } else {
        esQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            esQuery.bool.filter.push({
              terms: { [field]: value }
            });
          } else {
            esQuery.bool.filter.push({
              term: { [field]: value }
            });
          }
        }
      });

      // Build sort
      const esSort: any[] = [];
      sort.forEach(({ field, order }) => {
        esSort.push({ [field]: { order } });
      });

      // Default sort by relevance score, then by update date
      if (esSort.length === 0) {
        esSort.push({ _score: { order: 'desc' } });
        esSort.push({ updatedAt: { order: 'desc' } });
      }

      // Build aggregations
      const esAggs: any = {};
      Object.entries(aggregations).forEach(([name, config]) => {
        esAggs[name] = config;
      });

      // Temporarily disable aggregations to fix search
      // esAggs.categories = {
      //   terms: { field: 'metadata.category.keyword', size: 20 }
      // };
      // esAggs.tags = {
      //   terms: { field: 'metadata.tags', size: 50 }
      // };
      // esAggs.mimeTypes = {
      //   terms: { field: 'metadata.mimeType', size: 20 }
      // };

      // Build highlight
      const esHighlight = highlight ? {
        fields: {
          title: {},
          content: { fragment_size: 150, number_of_fragments: 3 },
          'metadata.fileName': {},
          'metadata.originalName': {}
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      } : undefined;

      // Check ES availability and fall back to PostgreSQL if needed
      const esUp = await this.isElasticsearchAvailable();
      if (!esUp) {
        return this.postgresSearch(organizationId, options);
      }

      // Execute Elasticsearch search using a simpler approach
      const response: any = await this.elasticsearch.search({
        index: this.indexName,
        body: {
          query: esQuery,
          sort: esSort,
          from,
          size,
          ...(highlight && { highlight: esHighlight }),
          ...(Object.keys(esAggs).length && { aggs: esAggs })
        }
      });

      const documents = (response.body?.hits?.hits || response.hits?.hits || []).map((hit: any) => ({
        id: hit._source.id,
        title: hit._source.title,
        content: hit._source.content,
        organizationId: hit._source.organizationId,
        createdAt: hit._source.createdAt,
        updatedAt: hit._source.updatedAt,
        metadata: hit._source.metadata,
        score: hit._score,
        highlight: hit.highlight
      }));

      const totalValue = response.body?.hits?.total?.value || response.hits?.total?.value || response.body?.hits?.total || response.hits?.total || 0;
      const total = typeof totalValue === 'object' ? totalValue.value : totalValue;
      const processedAggregations = response.body?.aggregations || response.aggregations || {};

      this.logger.info('Search completed', {
        query,
        total,
        resultsCount: documents.length,
        organizationId
      });

      return {
        documents,
        total,
        aggregations: processedAggregations
      };

    } catch (error: any) {
      this.logger.error('Elasticsearch search failed, falling back to PostgreSQL:', error.message);
      this.esAvailable = false;
      this.esLastChecked = Date.now();
      return this.postgresSearch(organizationId, options);
    }
  }

  async suggest(
    organizationId: string,
    query: string,
    field: 'title' | 'tags' | 'category' = 'title'
  ): Promise<string[]> {
    try {
      const response: any = await this.elasticsearch.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    [field]: {
                      query: query,
                      fuzziness: 'AUTO'
                    }
                  }
                }
              ],
              filter: [
                { term: { organizationId } }
              ]
            }
          } as any,
          _source: [field],
          size: 10
        }
      });

      const hits = response.body?.hits?.hits || response.hits?.hits || [];
      const suggestions = hits
        .map((hit: any) => hit._source[field])
        .filter((value: any) => value)
        .filter((value: any, index: number, array: any[]) => array.indexOf(value) === index); // Remove duplicates

      return suggestions;
    } catch (error: any) {
      this.logger.error('Suggest failed:', error);
      return [];
    }
  }

  async reindexAllDocuments(organizationId: string): Promise<void> {
    try {
      this.logger.info('Starting document reindexing', { organizationId });

      if (!organizationId) throw new Error('ORGANIZATION_REQUIRED');
      const where: any = { organizationId };

      // Get documents from database
      const documents = await this.prisma.document.findMany({
        where,
        include: {
          createdBy: true
        }
      });

      // Batch index documents
      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        const operations = [];
        for (const doc of batch) {
          // Extract text content from the file
          const extractedContent = await this.extractTextContent(doc.storagePath, doc.mimeType, doc.organizationId);
          const content = doc.ocrText || extractedContent || '';

          operations.push({ index: { _index: this.indexName, _id: doc.id } });
          operations.push({
            id: doc.id,
            title: doc.title,
            content: content,
            organizationId: doc.organizationId,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            metadata: {
              category: doc.category,
              tags: doc.tags,
              mimeType: doc.mimeType,
              fileName: doc.fileName,
              originalName: doc.originalName,
              customFields: doc.customFields
            }
          });

          this.logger.info('Indexing document with content', {
            documentId: doc.id,
            title: doc.title,
            contentLength: content.length,
            mimeType: doc.mimeType
          });
        }

        await this.elasticsearch.bulk({
          body: operations
        });

        this.logger.info(`Reindexed batch ${Math.floor(i / batchSize) + 1}`, {
          processed: Math.min(i + batchSize, documents.length),
          total: documents.length
        });
      }

      // Refresh index
      await this.elasticsearch.indices.refresh({ index: this.indexName });

      this.logger.info('Document reindexing completed', {
        totalDocuments: documents.length,
        organizationId
      });

    } catch (error: any) {
      this.logger.error('Document reindexing failed:', error);
      throw error;
    }
  }

  async getSearchStats(organizationId: string): Promise<any> {
    try {
      if (!organizationId) throw new Error('ORGANIZATION_REQUIRED');
      const active = { organizationId, status: { not: 'DELETED' as const } };
      const [total, categories, mimeTypes, tags, months] = await Promise.all([
        this.prisma.document.count({ where: active }),
        this.prisma.document.groupBy({ by: ['category'], where: active, _count: { _all: true } }),
        this.prisma.document.groupBy({ by: ['mimeType'], where: active, _count: { _all: true } }),
        this.prisma.document.findMany({ where: active, select: { tags: true } }),
        this.prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
          SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::bigint AS count
          FROM documents
          WHERE "organizationId" = ${organizationId} AND status <> 'DELETED'
          GROUP BY 1 ORDER BY 1
        `
      ]);
      const tagCounts = new Map<string, number>();
      for (const document of tags) for (const tag of document.tags) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      return {
        total_documents: { value: total },
        categories: { buckets: categories.map(value => ({ key: value.category || 'uncategorized', doc_count: value._count._all })) },
        mime_types: { buckets: mimeTypes.map(value => ({ key: value.mimeType, doc_count: value._count._all })) },
        tags: { buckets: [...tagCounts.entries()].map(([key, doc_count]) => ({ key, doc_count })).sort((a, b) => b.doc_count - a.doc_count) },
        documents_per_month: { buckets: months.map(value => ({ key_as_string: value.month.toISOString(), doc_count: Number(value.count) })) }
      };
    } catch (error: any) {
      this.logger.error('Failed to get search stats:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.elasticsearch.ping();
      return response === true || (typeof response === 'object' && response !== null);
    } catch (error: any) {
      this.logger.error('Elasticsearch health check failed:', error);
      return false;
    }
  }

  // Extract text content from files
  private async extractTextContent(filePath: string, mimeType: string, organizationId: string): Promise<string> {
    try {
      this.logger.info('🔍 Starting text extraction', { filePath, mimeType });
      if (!organizationId) throw new Error('ORGANIZATION_REQUIRED');
      let tempDirectory: string | undefined;
      try {
        const { StorageService } = require('./StorageService');
        const storageService = new StorageService();
        const fileBuffer = await storageService.downloadDocument(filePath, organizationId);
        
        if (!fileBuffer) {
          this.logger.warn('File not found in storage:', filePath);
          return '';
        }
        
        tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-extract-'));
        
        // Add appropriate file extension based on MIME type
        let extension = '';
        if (mimeType === 'application/pdf') extension = '.pdf';
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') extension = '.docx';
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') extension = '.xlsx';
        else if (mimeType === 'application/vnd.ms-excel') extension = '.xls';
        else if (mimeType === 'text/plain') extension = '.txt';
        else if (mimeType === 'text/csv') extension = '.csv';
        
        const tempFilePathWithExt = path.join(tempDirectory, `source${extension}`);
        fs.writeFileSync(tempFilePathWithExt, fileBuffer);
        
        this.logger.info('📁 Downloaded file to temporary location for text extraction', { 
          tempFilePath: tempFilePathWithExt,
          fileSize: fileBuffer.length 
        });
        
        // Extract text from temporary file
        const extractedText = await this.extractTextFromLocalFile(tempFilePathWithExt, mimeType);
        
        return extractedText;
        
      } catch (storageError) {
        this.logger.error('Failed to download file from storage:', { filePath, error: storageError });
        return '';
      } finally {
        if (tempDirectory) fs.rmSync(tempDirectory, { recursive: true, force: true });
      }
    } catch (error: any) {
      this.logger.error('❌ Text extraction failed completely:', { 
        filePath, 
        error: error instanceof Error ? error.message : error
      });
      return '';
    }
  }

  // Extract text content from local files
  private async extractTextFromLocalFile(filePath: string, mimeType: string): Promise<string> {
    try {
      this.logger.info('🔍 Starting local file text extraction', { filePath, mimeType });

      // Handle text files
      if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
        const content = fs.readFileSync(filePath, 'utf8');
        this.logger.info('✅ Text file extracted', { filePath, contentLength: content.length });
        return content.substring(0, 50000); // Limit to 50KB for indexing
      }

      // Handle CSV files  
      if (mimeType === 'text/csv') {
        const content = fs.readFileSync(filePath, 'utf8');
        this.logger.info('✅ CSV file extracted', { filePath, contentLength: content.length });
        return content.substring(0, 50000);
      }

      // Handle Excel files with XLSX library (primary method)
      if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          mimeType === 'application/vnd.ms-excel') {
        this.logger.info('🔄 Attempting XLSX extraction (primary method for Excel)', { filePath });
        
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(filePath);
          let extractedText = '';
          
          this.logger.info('📊 XLSX workbook loaded', { 
            sheetNames: workbook.worksheets.map(sheet => sheet.name),
            sheetCount: workbook.worksheets.length
          });
          
          // Process all sheets
          workbook.worksheets.forEach(sheet => {
            const sheetName = sheet.name;
            const rows: string[] = [];
            sheet.eachRow(row => rows.push((row.values as unknown[]).slice(1).map(value => String(value ?? '')).join(',')));
            const sheetData = rows.join('\n');
            extractedText += sheetData + '\n';
            
            this.logger.info('📄 XLSX sheet processed', { 
              sheetName, 
              sheetDataLength: sheetData.length,
              sheetPreview: sheetData.substring(0, 200) + '...'
            });
          });
          
          this.logger.info('✅ XLSX extraction completed successfully', { 
            filePath, 
            totalContentLength: extractedText.length,
            contentPreview: extractedText.substring(0, 300) + '...'
          });
          
          return extractedText.substring(0, 50000); // Limit to 50KB
          
        } catch (xlsxError) {
          this.logger.warn('❌ XLSX extraction failed, trying LibreOffice fallback:', { 
            filePath, 
            error: xlsxError instanceof Error ? xlsxError.message : xlsxError
          });
        }
      }

      // Handle PDF files with pdftotext (more reliable than LibreOffice for PDFs)
      if (mimeType === 'application/pdf') {
        this.logger.info('📄 Processing PDF with pdftotext', { filePath });
        
        try {
          const { execFile } = require('child_process');
          const util = require('util');
          const execFilePromise = util.promisify(execFile);
          
          // Use pdftotext to extract text from PDF
          const { stdout, stderr } = await execFilePromise('pdftotext', [filePath, '-'], { maxBuffer: 2 * 1024 * 1024 });
          
          if (stderr && !stderr.includes('Warning')) {
            this.logger.warn('pdftotext stderr:', stderr);
          }
          
          if (stdout && stdout.length > 0) {
            this.logger.info('✅ PDF text extracted with pdftotext', { 
              filePath,
              contentLength: stdout.length,
              contentPreview: stdout.substring(0, 200) + '...'
            });
            return stdout.substring(0, 50000); // Limit to 50KB
          } else {
            this.logger.warn('⚠️ pdftotext returned empty content', { filePath });
          }
          
        } catch (pdfError) {
          this.logger.warn('❌ pdftotext extraction failed, trying LibreOffice fallback:', { 
            filePath, 
            error: pdfError instanceof Error ? pdfError.message : pdfError
          });
        }
      }

      // Handle LibreOffice-supported documents (DOCX, PPT, ODT, etc.) - EXCEPT Excel and PDF
      const isLibreOfficeDocument = 
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||  // .docx
        mimeType === 'application/msword' ||                                                        // .doc
        mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || // .pptx
        mimeType === 'application/vnd.ms-powerpoint' ||                                            // .ppt
        mimeType === 'application/vnd.oasis.opendocument.text' ||                                  // .odt
        mimeType === 'application/vnd.oasis.opendocument.presentation' ||                          // .odp
        mimeType === 'application/vnd.oasis.opendocument.spreadsheet' ||                           // .ods
        mimeType === 'application/rtf';                                                            // .rtf
      
      const isExcelDocument = 
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel';
      
      if (isLibreOfficeDocument && !isExcelDocument) {
        
        this.logger.info('🔄 Attempting LibreOffice extraction with retry mechanism', { filePath, mimeType });
        
        try {
          const tempDir = '/tmp';
          
          // Use the new LibreOffice service with retry mechanism
          const extractResult = await this.libreOfficeService.extractTextFromDocument(filePath, tempDir);
          
          if (extractResult.success && extractResult.text) {
            this.logger.info('✅ LibreOffice extracted content successfully with retry mechanism', { 
              filePath,
              contentLength: extractResult.text.length,
              contentPreview: extractResult.text.substring(0, 200) + '...'
            });
            
            return extractResult.text.substring(0, 50000); // Limit to 50KB
          } else {
            this.logger.warn('❌ LibreOffice extraction failed with retry mechanism', { 
              filePath, 
              error: extractResult.error
            });
          }
          
        } catch (libreOfficeError) {
          this.logger.warn('❌ Failed to extract content using LibreOffice service:', { 
            filePath, 
            error: libreOfficeError instanceof Error ? libreOfficeError.message : libreOfficeError
          });
        }
        
        this.logger.warn('⚠️ LibreOffice extraction failed, using placeholder', { filePath });
        return `${path.basename(filePath)} document content`;
      }

      // For other file types, return filename
      const filename = path.basename(filePath);
      this.logger.info('📝 Using filename as content for unsupported type', { filePath, mimeType });
      return `${filename} document content`;

    } catch (error: any) {
      this.logger.error('❌ Local text extraction failed:', { 
        filePath, 
        error: error instanceof Error ? error.message : error
      });
      return '';
    }
  }
}
