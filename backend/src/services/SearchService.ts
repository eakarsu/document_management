import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

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
  private indexName: string = 'dms-documents';

  constructor() {
    this.elasticsearch = new ElasticsearchClient({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });

    this.prisma = new PrismaClient();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
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

    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch index:', error);
      throw error;
    }
  }

  async indexDocument(document: SearchDocument): Promise<void> {
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

    } catch (error) {
      this.logger.error('Failed to index document:', error);
      throw error;
    }
  }

  async indexDocumentWithExtraction(documentId: string, organizationId: string): Promise<void> {
    try {
      this.logger.info('Indexing single document with text extraction', { documentId });

      // Get document from database
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: { createdBy: true }
      });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Extract text content from the file
      const extractedContent = await this.extractTextContent(document.storagePath, document.mimeType);
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

    } catch (error) {
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

    } catch (error) {
      this.logger.error('Failed to update document in index:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.elasticsearch.delete({
        index: this.indexName,
        id: documentId
      });

      this.logger.info('Document deleted from index', { documentId });

    } catch (error) {
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
            operator: 'and'
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

      // Add default aggregations
      esAggs.categories = {
        terms: { field: 'metadata.category', size: 20 }
      };
      esAggs.tags = {
        terms: { field: 'metadata.tags', size: 50 }
      };
      esAggs.mimeTypes = {
        terms: { field: 'metadata.mimeType', size: 20 }
      };

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

    } catch (error) {
      this.logger.error('Search failed:', error);
      throw error;
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
    } catch (error) {
      this.logger.error('Suggest failed:', error);
      return [];
    }
  }

  async reindexAllDocuments(organizationId?: string): Promise<void> {
    try {
      this.logger.info('Starting document reindexing', { organizationId });

      const where: any = {};
      if (organizationId) {
        where.organizationId = organizationId;
      }

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
          const extractedContent = await this.extractTextContent(doc.storagePath, doc.mimeType);
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

    } catch (error) {
      this.logger.error('Document reindexing failed:', error);
      throw error;
    }
  }

  async getSearchStats(organizationId: string): Promise<any> {
    try {
      // Simplified implementation to avoid Elasticsearch typing issues
      // Return basic mock data for now
      return {
        total_documents: { value: 0 },
        categories: { buckets: [] },
        mime_types: { buckets: [] },
        tags: { buckets: [] },
        documents_per_month: { buckets: [] }
      };
    } catch (error) {
      this.logger.error('Failed to get search stats:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.elasticsearch.ping();
      return response === true || (typeof response === 'object' && response !== null);
    } catch (error) {
      this.logger.error('Elasticsearch health check failed:', error);
      return false;
    }
  }

  // Extract text content from files
  private async extractTextContent(filePath: string, mimeType: string): Promise<string> {
    try {
      this.logger.info('🔍 Starting text extraction', { filePath, mimeType });
      
      // Check if it's a local file path first
      if (fs.existsSync(filePath)) {
        return await this.extractTextFromLocalFile(filePath, mimeType);
      }
      
      // If not a local file, try to download from storage (MinIO)
      this.logger.info('🌐 File not found locally, attempting to download from MinIO storage', { filePath });
      
      try {
        const { StorageService } = require('./StorageService');
        const storageService = new StorageService();
        const fileBuffer = await storageService.downloadDocument(filePath);
        
        if (!fileBuffer) {
          this.logger.warn('File not found in storage:', filePath);
          return '';
        }
        
        // Create temporary file to extract text from
        const tempFilePath = `/tmp/temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Add appropriate file extension based on MIME type
        let extension = '';
        if (mimeType === 'application/pdf') extension = '.pdf';
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') extension = '.docx';
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') extension = '.xlsx';
        else if (mimeType === 'application/vnd.ms-excel') extension = '.xls';
        else if (mimeType === 'text/plain') extension = '.txt';
        else if (mimeType === 'text/csv') extension = '.csv';
        
        const tempFilePathWithExt = tempFilePath + extension;
        fs.writeFileSync(tempFilePathWithExt, fileBuffer);
        
        this.logger.info('📁 Downloaded file to temporary location for text extraction', { 
          tempFilePath: tempFilePathWithExt,
          fileSize: fileBuffer.length 
        });
        
        // Extract text from temporary file
        const extractedText = await this.extractTextFromLocalFile(tempFilePathWithExt, mimeType);
        
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePathWithExt);
        } catch (cleanupError) {
          this.logger.warn('Failed to cleanup temporary file:', tempFilePathWithExt);
        }
        
        return extractedText;
        
      } catch (storageError) {
        this.logger.error('Failed to download file from storage:', { filePath, error: storageError });
        return '';
      }
    } catch (error) {
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
        return content.substring(0, 10000); // Limit to 10KB for indexing
      }

      // Handle CSV files  
      if (mimeType === 'text/csv') {
        const content = fs.readFileSync(filePath, 'utf8');
        this.logger.info('✅ CSV file extracted', { filePath, contentLength: content.length });
        return content.substring(0, 10000);
      }

      // Handle Excel files with XLSX library (primary method)
      if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          mimeType === 'application/vnd.ms-excel') {
        this.logger.info('🔄 Attempting XLSX extraction (primary method for Excel)', { filePath });
        
        try {
          const workbook = XLSX.readFile(filePath);
          let extractedText = '';
          
          this.logger.info('📊 XLSX workbook loaded', { 
            sheetNames: workbook.SheetNames,
            sheetCount: workbook.SheetNames.length
          });
          
          // Process all sheets
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_csv(sheet);
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
          
          return extractedText.substring(0, 10000); // Limit to 10KB
          
        } catch (xlsxError) {
          this.logger.warn('❌ XLSX extraction failed, trying LibreOffice fallback:', { 
            filePath, 
            error: xlsxError instanceof Error ? xlsxError.message : xlsxError
          });
        }
      }

      // Handle LibreOffice-supported documents (DOCX, PDF, PPT, ODT, etc.) - EXCEPT Excel
      const isLibreOfficeDocument = 
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||  // .docx
        mimeType === 'application/msword' ||                                                        // .doc
        mimeType === 'application/pdf' ||                                                           // .pdf
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
        
        this.logger.info('🔄 Attempting LibreOffice extraction for document type', { filePath, mimeType });
        
        try {
          const { execSync } = require('child_process');
          const tempDir = '/tmp';
          
          // Use proper LibreOffice syntax with headless mode: soffice --headless --convert-to txt filename --outdir "/tmp/"
          this.logger.info('🔧 Running LibreOffice conversion with headless mode', { filePath, tempDir });
          const command = `/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to txt "${filePath}" --outdir "${tempDir}"`;
          this.logger.info('⚡ LibreOffice command:', command);
          
          const output = execSync(command, {
            timeout: 30000, // 30 second timeout
            encoding: 'utf8'
          });
          
          this.logger.info('✅ LibreOffice conversion completed', { output });
          
          // Check for the expected output file (.txt)
          const baseFileName = path.basename(filePath, path.extname(filePath));
          const extractedFilePath = path.join(tempDir, baseFileName + '.txt');
          
          this.logger.info('🔍 Looking for extracted file', { extractedFilePath });
          
          if (fs.existsSync(extractedFilePath)) {
            const content = fs.readFileSync(extractedFilePath, 'utf8');
            this.logger.info('✅ LibreOffice extracted content successfully', { 
              filePath,
              extractedFilePath,
              contentLength: content.length,
              contentPreview: content.substring(0, 200) + '...'
            });
            
            // Clean up temporary file
            fs.unlinkSync(extractedFilePath);
            return content.substring(0, 10000); // Limit to 10KB
          } else {
            this.logger.warn('❌ LibreOffice conversion succeeded but no output file found');
            
            // List all files in temp directory to see what was created
            const tempFiles = fs.readdirSync(tempDir).filter(f => f.includes(baseFileName));
            this.logger.info('🗂️ Files in temp dir matching document:', tempFiles);
          }
          
        } catch (libreOfficeError) {
          this.logger.warn('❌ Failed to extract content using LibreOffice:', { 
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

    } catch (error) {
      this.logger.error('❌ Local text extraction failed:', { 
        filePath, 
        error: error instanceof Error ? error.message : error
      });
      return '';
    }
  }
}