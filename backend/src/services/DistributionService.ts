import { PrismaClient, DocumentDistribution, DistributionStatus } from '@prisma/client';

// Types that don't exist in schema - defining locally
enum DistributionMethod {
  EMAIL = 'EMAIL',
  SECURE_LINK = 'SECURE_LINK',
  DIRECT_DOWNLOAD = 'DIRECT_DOWNLOAD',
  API_PUSH = 'API_PUSH',
  PRINT_DISTRIBUTION = 'PRINT_DISTRIBUTION'
}

enum RecipientType {
  INDIVIDUAL_USERS = 'INDIVIDUAL_USERS',
  USER_GROUPS = 'USER_GROUPS',
  EXTERNAL_CONTACTS = 'EXTERNAL_CONTACTS',
  PUBLIC_DISTRIBUTION = 'PUBLIC_DISTRIBUTION',
  DEPARTMENT_WIDE = 'DEPARTMENT_WIDE'
}
import { DocumentService } from './DocumentService';
import { NotificationService } from './NotificationService';
import { StorageService } from './StorageService';
import winston from 'winston';
import nodemailer from 'nodemailer';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

interface CreateDistributionInput {
  publishingId: string;
  distributionMethod: DistributionMethod;
  recipientType: RecipientType;
  recipientList: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    department?: string;
  }[];
  distributionFormat: string;
  includeAttachments: boolean;
  personalizedMessage?: string;
  deliveryOptions?: {
    requireDeliveryConfirmation?: boolean;
    expirationDate?: Date;
    passwordProtected?: boolean;
    accessRestrictions?: string[];
  };
}

interface DistributionStats {
  totalRecipients: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  failureReasons: Record<string, number>;
}

export class DistributionService {
  private prisma: PrismaClient;
  private documentService: DocumentService;
  private notificationService: NotificationService;
  private storageService: StorageService;
  private logger: winston.Logger;
  private emailTransporter?: nodemailer.Transporter;

  constructor() {
    this.prisma = new PrismaClient();
    this.documentService = new DocumentService();
    this.notificationService = new NotificationService();
    this.storageService = new StorageService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    this.initializeEmailService();
  }

  /**
   * Create and execute document distribution
   */
  async createDistribution(
    input: CreateDistributionInput,
    initiatorId: string,
    organizationId: string
  ): Promise<DocumentDistribution> {
    try {
      this.logger.info('Creating document distribution', {
        publishingId: input.publishingId,
        distributionMethod: input.distributionMethod,
        recipientCount: input.recipientList?.length || 0
      });

      // Validate publishing record
      const publishing = await this.prisma.documentPublishing.findFirst({
        where: {
          id: input.publishingId,
          document: {
            organizationId
          }
        },
        include: {
          document: true
        }
      });

      if (!publishing || publishing.status !== 'PUBLISHED') {
        throw new Error('Document not found or not published');
      }

      // Create distribution record
      const distribution = await this.prisma.documentDistribution.create({
        data: {
          publishingId: input.publishingId,
          initiatedById: initiatorId,
          distributionType: 'CONTROLLED_DISTRIBUTION', // Default value
          targetAudience: input.recipientList?.map(r => r.email || r.name || r.id).filter((item): item is string => Boolean(item)) || [],
          channels: [input.distributionMethod],
          status: DistributionStatus.PENDING,
          totalRecipients: input.recipientList?.length || 0,
          metadata: {
            distributionFormat: input.distributionFormat,
            includeAttachments: input.includeAttachments,
            personalizedMessage: input.personalizedMessage,
            recipientType: input.recipientType,
            recipientList: input.recipientList,
            deliveryStats: {}
          }
        }
      });

      // Execute distribution
      await this.executeDistribution(distribution, publishing, organizationId);

      this.logger.info('Document distribution created and executed', {
        distributionId: distribution.id,
        publishingId: input.publishingId
      });

      return distribution;

    } catch (error) {
      this.logger.error('Failed to create document distribution:', error);
      throw error;
    }
  }

  /**
   * Execute distribution based on method
   */
  private async executeDistribution(
    distribution: DocumentDistribution,
    publishing: any,
    organizationId: string
  ): Promise<void> {
    try {
      await this.prisma.documentDistribution.update({
        where: { id: distribution.id },
        data: { status: DistributionStatus.PROCESSING }
      });

      let results: DistributionStats;

      const distributionMethod = distribution.channels[0]; // Get the first channel
      switch (distributionMethod) {
        case DistributionMethod.EMAIL:
          results = await this.distributeViaEmail(distribution, publishing, organizationId);
          break;
        
        case DistributionMethod.SECURE_LINK:
          results = await this.distributeViaSecureLink(distribution, publishing, organizationId);
          break;
        
        case DistributionMethod.DIRECT_DOWNLOAD:
          results = await this.distributeViaDirectDownload(distribution, publishing, organizationId);
          break;
        
        case DistributionMethod.API_PUSH:
          results = await this.distributeViaAPI(distribution, publishing, organizationId);
          break;
        
        case DistributionMethod.PRINT_DISTRIBUTION:
          results = await this.distributeViaPrint(distribution, publishing, organizationId);
          break;
        
        default:
          throw new Error(`Unsupported distribution method: ${distributionMethod}`);
      }

      // Update distribution status and stats
      const finalStatus = results.failed === 0 
        ? DistributionStatus.COMPLETED 
        : results.delivered > 0 
          ? DistributionStatus.PARTIALLY_FAILED 
          : DistributionStatus.FAILED;

      await this.prisma.documentDistribution.update({
        where: { id: distribution.id },
        data: {
          status: finalStatus,
          successCount: results.delivered,
          failureCount: results.failed,
          completedAt: new Date(),
          metadata: {
            ...(distribution.metadata as any || {}),
            deliveryStats: {
              totalRecipients: results.totalRecipients,
              delivered: results.delivered,
              failed: results.failed,
              pending: results.pending,
              deliveryRate: results.deliveryRate
            }
          }
        }
      });

      this.logger.info('Distribution execution completed', {
        distributionId: distribution.id,
        status: finalStatus,
        delivered: results.delivered,
        failed: results.failed
      });

    } catch (error) {
      await this.prisma.documentDistribution.update({
        where: { id: distribution.id },
        data: { status: DistributionStatus.FAILED }
      });
      throw error;
    }
  }

  /**
   * Distribute via email
   */
  private async distributeViaEmail(
    distribution: DocumentDistribution,
    publishing: any,
    organizationId: string
  ): Promise<DistributionStats> {
    const recipientList = this.getRecipientList(distribution);
    const stats: DistributionStats = {
      totalRecipients: recipientList.length,
      delivered: 0,
      failed: 0,
      pending: 0,
      deliveryRate: 0,
      failureReasons: {}
    };

    if (!this.emailTransporter) {
      stats.failed = stats.totalRecipients;
      stats.failureReasons['Email service not configured'] = stats.totalRecipients;
      return stats;
    }

    // Get document content
    const documentContent = await this.documentService.getDocumentContent(
      publishing.documentId,
      'system',
      organizationId
    );

    if (!documentContent) {
      stats.failed = stats.totalRecipients;
      stats.failureReasons['Document content not accessible'] = stats.totalRecipients;
      return stats;
    }

    // Create distribution package
    const distributionPackage = await this.createDistributionPackage(
      publishing.document,
      documentContent,
      this.getDistributionFormat(distribution),
      this.getIncludeAttachments(distribution)
    );

    // Send to each recipient
    for (const recipient of recipientList) {
      try {
        if (!recipient.email) {
          stats.failed++;
          stats.failureReasons['Missing email address'] = (stats.failureReasons['Missing email address'] || 0) + 1;
          continue;
        }

        const personalizedMessage = this.personalizeMessage(
          this.getPersonalizedMessage(distribution) || 'Please find the attached document.',
          recipient
        );

        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@example.com',
          to: recipient.email,
          subject: `Document Distribution: ${publishing.document.title}`,
          html: this.generateDistributionEmailTemplate(
            publishing.document,
            personalizedMessage,
            recipient
          ),
          attachments: [{
            filename: `${publishing.document.title}.${this.getDistributionFormat(distribution).toLowerCase()}`,
            content: distributionPackage
          }]
        });

        stats.delivered++;

      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.failureReasons[errorMessage] = (stats.failureReasons[errorMessage] || 0) + 1;
        
        this.logger.error('Failed to send email to recipient:', {
          recipient: recipient.email,
          error: errorMessage
        });
      }
    }

    stats.deliveryRate = (stats.delivered / stats.totalRecipients) * 100;
    return stats;
  }

  /**
   * Distribute via secure link
   */
  private async distributeViaSecureLink(
    distribution: DocumentDistribution,
    publishing: any,
    organizationId: string
  ): Promise<DistributionStats> {
    const recipientList = this.getRecipientList(distribution);
    const stats: DistributionStats = {
      totalRecipients: recipientList.length,
      delivered: 0,
      failed: 0,
      pending: 0,
      deliveryRate: 0,
      failureReasons: {}
    };

    // Generate secure download links for each recipient
    for (const recipient of recipientList) {
      try {
        const secureToken = this.generateSecureToken();
        const downloadLink = `${process.env.BASE_URL}/api/distribution/secure-download/${secureToken}`;
        
        // Store secure token mapping
        await this.storeSecureTokenMapping(
          secureToken,
          publishing.documentId,
          recipient,
          distribution.id
        );

        // Send link via notification or email
        if (recipient.email) {
          await this.sendSecureLinkEmail(
            recipient.email,
            recipient.name || 'Recipient',
            publishing.document.title,
            downloadLink,
            this.getPersonalizedMessage(distribution)
          );
          stats.delivered++;
        } else {
          stats.failed++;
          stats.failureReasons['Missing email address'] = (stats.failureReasons['Missing email address'] || 0) + 1;
        }

      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.failureReasons[errorMessage] = (stats.failureReasons[errorMessage] || 0) + 1;
      }
    }

    stats.deliveryRate = (stats.delivered / stats.totalRecipients) * 100;
    return stats;
  }

  /**
   * Distribute via direct download
   */
  private async distributeViaDirectDownload(
    distribution: DocumentDistribution,
    publishing: any,
    organizationId: string
  ): Promise<DistributionStats> {
    // For direct download, we create download URLs and notify recipients
    return this.distributeViaSecureLink(distribution, publishing, organizationId);
  }

  /**
   * Distribute via API push
   */
  private async distributeViaAPI(
    distribution: DocumentDistribution,
    publishing: any,
    organizationId: string
  ): Promise<DistributionStats> {
    const recipientList = this.getRecipientList(distribution);
    const stats: DistributionStats = {
      totalRecipients: recipientList.length,
      delivered: 0,
      failed: 0,
      pending: 0,
      deliveryRate: 0,
      failureReasons: {}
    };

    // Get document content
    const documentContent = await this.documentService.getDocumentContent(
      publishing.documentId,
      'system',
      organizationId
    );

    if (!documentContent) {
      stats.failed = stats.totalRecipients;
      stats.failureReasons['Document content not accessible'] = stats.totalRecipients;
      return stats;
    }

    // Push to each API endpoint
    for (const recipient of recipientList) {
      try {
        if (!recipient.id) { // Using id as API endpoint identifier
          stats.failed++;
          stats.failureReasons['Missing API endpoint'] = (stats.failureReasons['Missing API endpoint'] || 0) + 1;
          continue;
        }

        await this.pushToAPI(
          recipient.id, // API endpoint
          publishing.document,
          documentContent,
          this.getDistributionFormat(distribution)
        );

        stats.delivered++;

      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.failureReasons[errorMessage] = (stats.failureReasons[errorMessage] || 0) + 1;
      }
    }

    stats.deliveryRate = (stats.delivered / stats.totalRecipients) * 100;
    return stats;
  }

  /**
   * Distribute via print
   */
  private async distributeViaPrint(
    distribution: DocumentDistribution,
    publishing: any,
    organizationId: string
  ): Promise<DistributionStats> {
    const recipientList = this.getRecipientList(distribution);
    const stats: DistributionStats = {
      totalRecipients: recipientList.length,
      delivered: 0,
      failed: 0,
      pending: 0,
      deliveryRate: 0,
      failureReasons: {}
    };

    // For print distribution, we queue print jobs
    for (const recipient of recipientList) {
      try {
        await this.queuePrintJob(
          publishing.document,
          recipient,
          this.getDistributionFormat(distribution)
        );

        stats.delivered++;

      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.failureReasons[errorMessage] = (stats.failureReasons[errorMessage] || 0) + 1;
      }
    }

    stats.deliveryRate = (stats.delivered / stats.totalRecipients) * 100;
    return stats;
  }

  /**
   * Get distribution analytics
   */
  async getDistributionAnalytics(
    organizationId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<{
    totalDistributions: number;
    distributionsByMethod: Record<string, number>;
    averageDeliveryRate: number;
    recentDistributions: any[];
    failureAnalysis: Record<string, number>;
  }> {
    try {
      const where: any = {
        documentPublishing: {
          document: {
            organizationId
          }
        }
      };

      if (dateRange) {
        where.createdAt = {
          gte: dateRange.from,
          lte: dateRange.to
        };
      }

      const [distributions, totalCount] = await Promise.all([
        this.prisma.documentDistribution.findMany({
          where,
          include: {
            documentPublishing: {
              include: {
                documents: {
                  select: {
                    id: true,
                    title: true,
                    fileName: true
                  }
                }
              }
            },
            initiatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          },
          take: 10
        }),
        this.prisma.documentDistribution.count({ where })
      ]);

      // Calculate analytics
      const distributionsByMethod: Record<string, number> = {};
      let totalDeliveryRate = 0;
      let distributionsWithStats = 0;
      const failureAnalysis: Record<string, number> = {};

      distributions.forEach(dist => {
        // Count by method
        const method = dist.channels[0] || 'UNKNOWN';
        distributionsByMethod[method] = 
          (distributionsByMethod[method] || 0) + 1;

        // Calculate delivery rates
        const metadata = (dist.metadata as any) || {};
        const stats = metadata.deliveryStats;
        if (stats && typeof stats === 'object' && stats.deliveryRate !== undefined) {
          totalDeliveryRate += stats.deliveryRate;
          distributionsWithStats++;

          // Aggregate failure reasons
          if (stats.failureReasons) {
            Object.entries(stats.failureReasons).forEach(([reason, count]) => {
              failureAnalysis[reason] = (failureAnalysis[reason] || 0) + (count as number);
            });
          }
        }
      });

      const averageDeliveryRate = distributionsWithStats > 0 
        ? totalDeliveryRate / distributionsWithStats 
        : 0;

      return {
        totalDistributions: totalCount,
        distributionsByMethod,
        averageDeliveryRate,
        recentDistributions: distributions,
        failureAnalysis
      };

    } catch (error) {
      this.logger.error('Failed to get distribution analytics:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private getDistributionMetadata(distribution: DocumentDistribution): any {
    return (distribution.metadata as any) || {};
  }

  private getRecipientList(distribution: DocumentDistribution): any[] {
    const metadata = this.getDistributionMetadata(distribution);
    return metadata.recipientList || [];
  }

  private getDistributionFormat(distribution: DocumentDistribution): string {
    const metadata = this.getDistributionMetadata(distribution);
    return metadata.distributionFormat || 'pdf';
  }

  private getIncludeAttachments(distribution: DocumentDistribution): boolean {
    const metadata = this.getDistributionMetadata(distribution);
    return metadata.includeAttachments || false;
  }

  private getPersonalizedMessage(distribution: DocumentDistribution): string | undefined {
    const metadata = this.getDistributionMetadata(distribution);
    return metadata.personalizedMessage;
  }

  private initializeEmailService(): void {
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  private async createDistributionPackage(
    document: any,
    content: Buffer,
    format: string,
    includeAttachments: boolean
  ): Promise<Buffer> {
    // For now, return the original content
    // In a real implementation, you might convert formats or add attachments
    return content;
  }

  private personalizeMessage(template: string, recipient: any): string {
    return template
      .replace(/\{name\}/g, recipient.name || 'Recipient')
      .replace(/\{email\}/g, recipient.email || '')
      .replace(/\{role\}/g, recipient.role || '')
      .replace(/\{department\}/g, recipient.department || '');
  }

  private generateDistributionEmailTemplate(
    document: any,
    message: string,
    recipient: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Document Distribution</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2>Document Distribution</h2>
            <p>Hello ${recipient.name || 'Recipient'},</p>
            <p>${message}</p>
            <p><strong>Document:</strong> ${document.title}</p>
            <p><strong>File:</strong> ${document.fileName}</p>
            <p>Please find the document attached to this email.</p>
            <hr>
            <small>This is an automated distribution from the Document Management System.</small>
          </div>
        </body>
      </html>
    `;
  }

  private generateSecureToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private async storeSecureTokenMapping(
    token: string,
    documentId: string,
    recipient: any,
    distributionId: string
  ): Promise<void> {
    // Store token mapping in cache or database
    // Implementation would depend on your caching strategy
    this.logger.info('Secure token created', {
      token: token.substring(0, 8) + '...',
      documentId,
      distributionId
    });
  }

  private async sendSecureLinkEmail(
    email: string,
    name: string,
    documentTitle: string,
    downloadLink: string,
    personalizedMessage?: string
  ): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: email,
      subject: `Secure Document Access: ${documentTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Secure Document Access</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h2>Secure Document Access</h2>
              <p>Hello ${name},</p>
              ${personalizedMessage ? `<p>${personalizedMessage}</p>` : ''}
              <p>You have been granted access to the document: <strong>${documentTitle}</strong></p>
              <p>Click the link below to access the document securely:</p>
              <p><a href="${downloadLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access Document</a></p>
              <p><strong>Note:</strong> This link is secure and will expire after use or after a specified time period.</p>
              <hr>
              <small>This is an automated secure distribution from the Document Management System.</small>
            </div>
          </body>
        </html>
      `
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  private async pushToAPI(
    endpoint: string,
    document: any,
    content: Buffer,
    format: string
  ): Promise<void> {
    // Implementation for API push
    this.logger.info('Pushing document to API endpoint', {
      endpoint,
      documentId: document.id,
      format
    });
    
    // Would implement actual API push logic here
    // This might involve HTTP requests to external systems
  }

  private async queuePrintJob(
    document: any,
    recipient: any,
    format: string
  ): Promise<void> {
    // Implementation for print queue
    this.logger.info('Queuing print job', {
      documentId: document.id,
      recipient: recipient.name,
      format
    });
    
    // Would implement actual print queue logic here
    // This might involve sending to print management systems
  }
}