import { PrismaClient, PublishingTemplate } from '@prisma/client';

// Type that doesn't exist in schema anymore - defining locally
type TemplateType = 'DOCUMENT' | 'EMAIL' | 'CERTIFICATE' | 'REPORT' | 'FORM';
import { StorageService } from './StorageService';
import winston from 'winston';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

interface CreateTemplateInput {
  name: string;
  description?: string;
  templateType: TemplateType;
  formatting: TemplateFormatting;
  layout: TemplateLayout;
  metadata: TemplateMetadata;
  requiresCoverPage?: boolean;
  requiresApprovalPage?: boolean;
  includeQRCode?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
}

interface TemplateFormatting {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  colors?: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  headerFooter?: {
    includeHeader: boolean;
    includeFooter: boolean;
    headerHeight: number;
    footerHeight: number;
  };
}

interface TemplateLayout {
  pageSize?: string; // A4, Letter, etc.
  orientation?: string; // portrait, landscape
  columns?: number;
  spacing?: {
    paragraph: number;
    section: number;
    line: number;
  };
  sections?: {
    titlePage?: boolean;
    tableOfContents?: boolean;
    approvalPage?: boolean;
    appendices?: boolean;
  };
}

interface TemplateMetadata {
  author?: string;
  company?: string;
  department?: string;
  classification?: string;
  version?: string;
  customFields?: Record<string, any>;
}

interface ApplyTemplateInput {
  documentId: string;
  templateId: string;
  customMetadata?: Record<string, any>;
  approvalChain?: {
    approver: string;
    role: string;
    date?: Date;
    signature?: string;
  }[];
}

export class TemplateService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private logger: winston.Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = new StorageService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * Create a new publishing template
   */
  async createTemplate(
    input: CreateTemplateInput,
    organizationId: string,
    userId: string
  ): Promise<PublishingTemplate> {
    try {
      this.logger.info('Creating publishing template', {
        name: input.name,
        templateType: input.templateType,
        organizationId
      });

      const template = await this.prisma.publishingTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          templateType: input.templateType,
          formatting: input.formatting as any,
          layout: input.layout as any,
          metadata: input.metadata as any,
          requiresCoverPage: input.requiresCoverPage || false,
          requiresApprovalPage: input.requiresApprovalPage || false,
          includeQRCode: input.includeQRCode !== false, // default true
          includeWatermark: input.includeWatermark || false,
          watermarkText: input.watermarkText,
          organizationId,
          isActive: true,
          usageCount: 0
        }
      });

      this.logger.info('Publishing template created successfully', {
        templateId: template.id,
        name: template.name
      });

      return template;

    } catch (error: any) {
      this.logger.error('Failed to create publishing template:', error);
      throw error;
    }
  }

  /**
   * Get all templates for organization
   */
  async getTemplates(
    organizationId: string,
    templateType?: TemplateType
  ): Promise<PublishingTemplate[]> {
    try {
      const where: any = {
        organizationId,
        isActive: true
      };

      if (templateType) {
        where.templateType = templateType;
      }

      const templates = await this.prisma.publishingTemplate.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { name: 'asc' }
        ]
      });

      return templates;

    } catch (error: any) {
      this.logger.error('Failed to get templates:', error);
      throw error;
    }
  }

  /**
   * Apply template to document and generate formatted version
   */
  async applyTemplate(
    input: ApplyTemplateInput,
    userId: string,
    organizationId: string
  ): Promise<{
    formattedDocumentPath: string;
    previewUrl?: string;
  }> {
    try {
      this.logger.info('Applying template to document', {
        documentId: input.documentId,
        templateId: input.templateId,
        userId
      });

      // Get template
      const template = await this.prisma.publishingTemplate.findFirst({
        where: {
          id: input.templateId,
          organizationId,
          isActive: true
        }
      });

      if (!template) {
        throw new Error('Template not found or inactive');
      }

      // Get document content
      const documentService = new (await import('./DocumentService')).DocumentService();
      const document = await documentService.getDocumentById(input.documentId, userId, organizationId);
      
      if (!document) {
        throw new Error('Document not found or access denied');
      }

      const documentContent = await documentService.getDocumentContent(input.documentId);
      
      if (!documentContent) {
        throw new Error('Could not retrieve document content');
      }

      // Generate formatted document
      const formattedDocument = await this.generateFormattedDocument(
        document,
        template,
        documentContent,
        input.customMetadata,
        input.approvalChain
      );

      // Save formatted document
      const formattedPath = await this.saveFormattedDocument(
        formattedDocument,
        document,
        template,
        organizationId,
        userId
      );

      // Update template usage count
      await this.prisma.publishingTemplate.update({
        where: { id: template.id },
        data: {
          usageCount: (template.usageCount || 0) + 1
        }
      });

      this.logger.info('Template applied successfully', {
        documentId: input.documentId,
        templateId: input.templateId,
        formattedPath
      });

      return {
        formattedDocumentPath: formattedPath
      };

    } catch (error: any) {
      this.logger.error('Failed to apply template:', error);
      throw error;
    }
  }

  /**
   * Preview template with sample content
   */
  async previewTemplate(
    templateId: string,
    organizationId: string
  ): Promise<Buffer> {
    try {
      const template = await this.prisma.publishingTemplate.findFirst({
        where: {
          id: templateId,
          organizationId,
          isActive: true
        }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Generate preview with sample content
      const previewDocument = await this.generateTemplatePreview(template);

      return previewDocument;

    } catch (error: any) {
      this.logger.error('Failed to generate template preview:', error);
      throw error;
    }
  }

  /**
   * Generate formatted document using template
   */
  private async generateFormattedDocument(
    document: any,
    template: PublishingTemplate,
    originalContent: Buffer,
    customMetadata?: Record<string, any>,
    approvalChain?: any[]
  ): Promise<Buffer> {
    const formatting = template.formatting as any as TemplateFormatting;
    const layout = template.layout as any as TemplateLayout;
    const metadata = template.metadata as any as TemplateMetadata;

    // Create PDF document
    const doc = new PDFDocument({
      size: layout.pageSize || 'A4',
      layout: (layout.orientation as 'portrait' | 'landscape') || 'portrait',
      margins: formatting.margins || { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise(async (resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      try {
        // Add cover page if required
        if (template.requiresCoverPage) {
          await this.addCoverPage(doc, document, template, metadata, customMetadata);
          doc.addPage();
        }

        // Add document header/footer
        if (formatting.headerFooter?.includeHeader) {
          await this.addHeader(doc, document, template);
        }

        if (formatting.headerFooter?.includeFooter) {
          await this.addFooter(doc, document, template);
        }

        // Add watermark if required
        if (template.includeWatermark && template.watermarkText) {
          await this.addWatermark(doc, template.watermarkText);
        }

        // Add main content
        await this.addMainContent(doc, document, originalContent, formatting);

        // Add approval page if required
        if (template.requiresApprovalPage && approvalChain) {
          doc.addPage();
          await this.addApprovalPage(doc, document, template, approvalChain);
        }

        // Add QR code if required
        if (template.includeQRCode && document.documentNumber) {
          await this.addQRCode(doc, document.documentNumber);
        }

        doc.end();

      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * Generate template preview with sample content
   */
  private async generateTemplatePreview(template: PublishingTemplate): Promise<Buffer> {
    const sampleDocument = {
      id: 'sample-doc-id',
      title: 'Sample Document Title',
      documentNumber: 'DOC-2024-000001',
      fileName: 'sample-document.pdf',
      createdAt: new Date(),
      createdBy: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      }
    };

    const sampleContent = Buffer.from('This is sample document content for template preview.');
    
    const sampleApprovalChain = [
      { approver: 'Jane Smith', role: 'Manager', date: new Date() },
      { approver: 'Bob Johnson', role: 'Director', date: new Date() }
    ];

    return this.generateFormattedDocument(
      sampleDocument,
      template,
      sampleContent,
      { previewMode: true },
      sampleApprovalChain
    );
  }

  /**
   * Save formatted document to storage
   */
  private async saveFormattedDocument(
    formattedDocument: Buffer,
    originalDocument: any,
    template: PublishingTemplate,
    organizationId: string,
    userId: string
  ): Promise<string> {
    const fileName = `formatted_${originalDocument.fileName}_${template.name.replace(/\s+/g, '_')}.pdf`;
    
    const uploadResult = await this.storageService.uploadDocument(
      formattedDocument,
      {
        filename: fileName,
        originalName: fileName,
        mimeType: 'application/pdf',
        size: formattedDocument.length,
        checksum: require('crypto').createHash('sha256').update(formattedDocument).digest('hex')
      },
      organizationId,
      userId
    );

    if (!uploadResult.success) {
      throw new Error(`Failed to save formatted document: ${uploadResult.error}`);
    }

    return uploadResult.storagePath!;
  }

  /**
   * Document generation helper methods
   */
  private async addCoverPage(
    doc: any,
    document: any,
    template: PublishingTemplate,
    metadata: TemplateMetadata,
    customMetadata?: Record<string, any>
  ): Promise<void> {
    const formatting = template.formatting as any as TemplateFormatting;
    
    // Title
    doc.fontSize(24)
       .fillColor(formatting.colors?.primary || '#000000')
       .text(document.title, 50, 100, { align: 'center' });

    // Document number
    if (document.documentNumber) {
      doc.fontSize(12)
         .fillColor(formatting.colors?.text || '#000000')
         .text(`Document Number: ${document.documentNumber}`, 50, 150, { align: 'center' });
    }

    // Metadata
    let yPosition = 200;
    
    if (metadata.company) {
      doc.text(`Company: ${metadata.company}`, 50, yPosition);
      yPosition += 20;
    }
    
    if (metadata.department) {
      doc.text(`Department: ${metadata.department}`, 50, yPosition);
      yPosition += 20;
    }
    
    if (document.createdBy) {
      doc.text(`Author: ${document.createdBy.firstName} ${document.createdBy.lastName}`, 50, yPosition);
      yPosition += 20;
    }
    
    doc.text(`Created: ${document.createdAt.toLocaleDateString()}`, 50, yPosition);
    
    // Custom metadata
    if (customMetadata) {
      yPosition += 40;
      doc.text('Additional Information:', 50, yPosition);
      yPosition += 20;
      
      Object.entries(customMetadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 50, yPosition);
        yPosition += 15;
      });
    }
  }

  private async addHeader(doc: any, document: any, template: PublishingTemplate): Promise<void> {
    const formatting = template.formatting as any as TemplateFormatting;
    
    doc.fontSize(10)
       .fillColor(formatting.colors?.secondary || '#666666')
       .text(document.title, 50, 20, { 
         width: doc.page.width - 100,
         align: 'left'
       })
       .text(`Page ${doc.pageNumber}`, doc.page.width - 100, 20, { 
         width: 50,
         align: 'right'
       });
  }

  private async addFooter(doc: any, document: any, template: PublishingTemplate): Promise<void> {
    const formatting = template.formatting as any as TemplateFormatting;
    
    doc.fontSize(8)
       .fillColor(formatting.colors?.secondary || '#666666')
       .text(`Document Number: ${document.documentNumber || 'N/A'}`, 50, doc.page.height - 30)
       .text(`Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 150, doc.page.height - 30, {
         width: 100,
         align: 'right'
       });
  }

  private async addWatermark(doc: any, watermarkText: string): Promise<void> {
    doc.save()
       .rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
       .fontSize(60)
       .fillColor('#CCCCCC')
       .fillOpacity(0.3)
       .text(watermarkText, 0, doc.page.height / 2 - 30, {
         width: doc.page.width,
         align: 'center'
       })
       .restore();
  }

  private async addMainContent(
    doc: any,
    document: any,
    originalContent: Buffer,
    formatting: TemplateFormatting
  ): Promise<void> {
    // For now, add a placeholder for the original content
    // In a real implementation, you'd parse the original document format
    doc.fontSize(formatting.fontSize || 12)
       .fillColor(formatting.colors?.text || '#000000')
       .text('Original document content would be processed and inserted here.', 50, 100)
       .text(`Original file: ${document.fileName}`, 50, 120)
       .text(`File size: ${originalContent.length} bytes`, 50, 140);
  }

  private async addApprovalPage(
    doc: any,
    document: any,
    template: PublishingTemplate,
    approvalChain: any[]
  ): Promise<void> {
    doc.fontSize(18)
       .text('Document Approval', 50, 50);

    doc.fontSize(12)
       .text('This document has been reviewed and approved by the following:', 50, 100);

    let yPosition = 130;
    
    approvalChain.forEach((approval, index) => {
      doc.text(`${index + 1}. ${approval.approver}`, 50, yPosition)
         .text(`   Role: ${approval.role}`, 50, yPosition + 15)
         .text(`   Date: ${approval.date ? approval.date.toLocaleDateString() : 'Pending'}`, 50, yPosition + 30);
      
      yPosition += 80;
    });
  }

  private async addQRCode(doc: any, documentNumber: string): Promise<void> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(documentNumber);
      const qrCodeImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
      
      doc.image(qrCodeImage, doc.page.width - 100, doc.page.height - 100, {
        fit: [80, 80]
      });
    } catch (error: any) {
      this.logger.warn('Failed to add QR code to document:', error);
    }
  }

  /**
   * Create default templates for organization
   */
  async createDefaultTemplates(organizationId: string): Promise<PublishingTemplate[]> {
    const defaultTemplates = [
      {
        name: 'Standard Document',
        description: 'Basic template for general documents',
        templateType: 'STANDARD',
        formatting: {
          fontFamily: 'Helvetica',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          colors: {
            primary: '#000000',
            secondary: '#666666',
            text: '#333333',
            background: '#FFFFFF'
          },
          headerFooter: {
            includeHeader: true,
            includeFooter: true,
            headerHeight: 30,
            footerHeight: 30
          }
        },
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          columns: 1,
          spacing: { paragraph: 12, section: 24, line: 1.5 }
        },
        metadata: {
          version: '1.0'
        },
        requiresCoverPage: false,
        requiresApprovalPage: false,
        includeQRCode: true,
        includeWatermark: false
      },
      {
        name: 'Executive Report',
        description: 'Formal template for executive reports',
        templateType: 'EXECUTIVE',
        formatting: {
          fontFamily: 'Times-Roman',
          fontSize: 11,
          lineHeight: 1.6,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          colors: {
            primary: '#1a365d',
            secondary: '#4a5568',
            text: '#2d3748',
            background: '#FFFFFF'
          },
          headerFooter: {
            includeHeader: true,
            includeFooter: true,
            headerHeight: 40,
            footerHeight: 40
          }
        },
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          columns: 1,
          spacing: { paragraph: 14, section: 28, line: 1.6 }
        },
        metadata: {
          classification: 'Confidential',
          version: '1.0'
        },
        requiresCoverPage: true,
        requiresApprovalPage: true,
        includeQRCode: true,
        includeWatermark: true,
        watermarkText: 'CONFIDENTIAL'
      }
    ];

    const createdTemplates: PublishingTemplate[] = [];

    for (const templateData of defaultTemplates) {
      const template = await this.prisma.publishingTemplate.create({
        data: {
          ...templateData,
          organizationId,
          isActive: true,
          usageCount: 0
        }
      });
      createdTemplates.push(template);
    }

    this.logger.info('Default templates created', {
      organizationId,
      count: createdTemplates.length
    });

    return createdTemplates;
  }
}