import { PrismaClient, PublishingNotification, NotificationType, DeliveryMethod } from '@prisma/client';
import winston from 'winston';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

interface NotificationConfig {
  email?: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
  };
  sms?: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    from: string;
  };
  push?: {
    enabled: boolean;
    apiKey: string;
    endpoint: string;
  };
}

interface SendNotificationInput {
  publishingId: string;
  recipientId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  deliveryMethods: DeliveryMethod[];
  urgentDelivery?: boolean;
  customData?: Record<string, any>;
}

interface BulkNotificationInput {
  publishingId: string;
  recipientIds: string[];
  notificationType: NotificationType;
  title: string;
  message: string;
  deliveryMethod: DeliveryMethod;
  templateData?: Record<string, any>;
}

export class NotificationService {
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private emailTransporter?: nodemailer.Transporter;
  private smsClient?: any;
  private config: NotificationConfig;

  constructor(config?: NotificationConfig) {
    this.prisma = new PrismaClient();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    this.config = config || this.getDefaultConfig();
    this.initializeServices();
  }

  /**
   * Send notification to a single recipient
   */
  async sendNotification(input: SendNotificationInput): Promise<PublishingNotification[]> {
    try {
      this.logger.info('Sending notification', {
        publishingId: input.publishingId,
        recipientId: input.recipientId,
        notificationType: input.notificationType,
        deliveryMethods: input.deliveryMethods
      });

      const notifications: PublishingNotification[] = [];

      // Get recipient information
      const recipient = await this.prisma.user.findUnique({
        where: { id: input.recipientId },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          timezone: true,
          language: true
        }
      });

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Send notifications via each requested delivery method
      for (const deliveryMethod of input.deliveryMethods) {
        try {
          const notification = await this.createNotificationRecord(
            input,
            deliveryMethod
          );

          const success = await this.deliverNotification(
            notification,
            recipient,
            input
          );

          if (success) {
            await this.markNotificationSent(notification.id, deliveryMethod);
          }

          notifications.push(notification);

        } catch (error) {
          this.logger.error(`Failed to send notification via ${deliveryMethod}:`, {
            publishingId: input.publishingId,
            recipientId: input.recipientId,
            deliveryMethod,
            error
          });
        }
      }

      return notifications;

    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple recipients
   */
  async sendBulkNotification(input: BulkNotificationInput): Promise<{
    successful: number;
    failed: number;
    notifications: PublishingNotification[];
  }> {
    try {
      this.logger.info('Sending bulk notification', {
        publishingId: input.publishingId,
        recipientCount: input.recipientIds.length,
        notificationType: input.notificationType,
        deliveryMethod: input.deliveryMethod
      });

      let successful = 0;
      let failed = 0;
      const notifications: PublishingNotification[] = [];

      // Get all recipients
      const recipients = await this.prisma.user.findMany({
        where: {
          id: { in: input.recipientIds }
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          timezone: true,
          language: true
        }
      });

      // Send to each recipient
      for (const recipient of recipients) {
        try {
          const personalizedMessage = this.personalizeMessage(
            input.message,
            recipient,
            input.templateData
          );

          const notification = await this.createNotificationRecord(
            {
              publishingId: input.publishingId,
              recipientId: recipient.id,
              notificationType: input.notificationType,
              title: input.title,
              message: personalizedMessage,
              deliveryMethods: [input.deliveryMethod]
            },
            input.deliveryMethod
          );

          const success = await this.deliverNotification(
            notification,
            recipient,
            {
              publishingId: input.publishingId,
              recipientId: recipient.id,
              notificationType: input.notificationType,
              title: input.title,
              message: personalizedMessage,
              deliveryMethods: [input.deliveryMethod]
            }
          );

          if (success) {
            await this.markNotificationSent(notification.id, input.deliveryMethod);
            successful++;
          } else {
            failed++;
          }

          notifications.push(notification);

        } catch (error) {
          this.logger.error('Failed to send bulk notification to recipient:', {
            recipientId: recipient.id,
            error
          });
          failed++;
        }
      }

      this.logger.info('Bulk notification completed', {
        publishingId: input.publishingId,
        successful,
        failed,
        total: input.recipientIds.length
      });

      return { successful, failed, notifications };

    } catch (error) {
      this.logger.error('Failed to send bulk notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      notificationType?: NotificationType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    notifications: PublishingNotification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const where: any = {
        recipientId: userId
      };

      if (options.unreadOnly) {
        where.isRead = false;
      }

      if (options.notificationType) {
        where.notificationType = options.notificationType;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.publishingNotification.findMany({
          where,
          include: {
            documentPublishing: {
              include: {
                document: {
                  select: {
                    id: true,
                    title: true,
                    fileName: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: options.limit || 50,
          skip: options.offset || 0
        }),
        this.prisma.publishingNotification.count({ where }),
        this.prisma.publishingNotification.count({
          where: {
            recipientId: userId,
            isRead: false
          }
        })
      ]);

      return {
        notifications,
        total,
        unreadCount
      };

    } catch (error) {
      this.logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const updated = await this.prisma.publishingNotification.updateMany({
        where: {
          id: notificationId,
          recipientId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return updated.count > 0;

    } catch (error) {
      this.logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const updated = await this.prisma.publishingNotification.updateMany({
        where: {
          recipientId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return updated.count;

    } catch (error) {
      this.logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Send notification digest (daily/weekly summary)
   */
  async sendNotificationDigest(
    userId: string,
    digestType: 'daily' | 'weekly'
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          timezone: true
        }
      });

      if (!user || !user.email) {
        return false;
      }

      // Calculate date range for digest
      const now = new Date();
      const startDate = new Date();
      
      if (digestType === 'daily') {
        startDate.setDate(now.getDate() - 1);
      } else {
        startDate.setDate(now.getDate() - 7);
      }

      // Get notifications in the date range
      const notifications = await this.prisma.publishingNotification.findMany({
        where: {
          recipientId: userId,
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        include: {
          documentPublishing: {
            include: {
              document: {
                select: {
                  title: true,
                  fileName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (notifications.length === 0) {
        return true; // No notifications to digest
      }

      // Generate digest content
      const digestContent = this.generateDigestContent(notifications, digestType);

      // Send digest email
      const success = await this.sendDigestEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        digestType,
        digestContent
      );

      this.logger.info('Notification digest sent', {
        userId,
        digestType,
        notificationCount: notifications.length,
        success
      });

      return success;

    } catch (error) {
      this.logger.error('Failed to send notification digest:', error);
      return false;
    }
  }

  /**
   * Initialize notification delivery services
   */
  private initializeServices(): void {
    // Initialize email service
    if (this.config.email?.enabled) {
      this.emailTransporter = nodemailer.createTransport(this.config.email.smtp);
    }

    // Initialize SMS service
    if (this.config.sms?.enabled) {
      this.smsClient = twilio(this.config.sms.accountSid, this.config.sms.authToken);
    }

    this.logger.info('Notification services initialized', {
      email: this.config.email?.enabled || false,
      sms: this.config.sms?.enabled || false,
      push: this.config.push?.enabled || false
    });
  }

  /**
   * Create notification record in database
   */
  private async createNotificationRecord(
    input: SendNotificationInput,
    deliveryMethod: DeliveryMethod
  ): Promise<PublishingNotification> {
    return this.prisma.publishingNotification.create({
      data: {
        publishingId: input.publishingId,
        recipientId: input.recipientId,
        notificationType: input.notificationType,
        title: input.title,
        message: input.message,
        deliveryMethod,
        isRead: false,
        emailSent: false,
        smsSent: false
      }
    });
  }

  /**
   * Deliver notification via specified method
   */
  private async deliverNotification(
    notification: PublishingNotification,
    recipient: any,
    input: SendNotificationInput
  ): Promise<boolean> {
    switch (notification.deliveryMethod) {
      case DeliveryMethod.EMAIL:
        return this.sendEmailNotification(notification, recipient);
      
      case DeliveryMethod.SMS:
        return this.sendSMSNotification(notification, recipient);
      
      case DeliveryMethod.PUSH_NOTIFICATION:
        return this.sendPushNotification(notification, recipient);
      
      case DeliveryMethod.IN_APP:
        return true; // In-app notifications are already stored in database
      
      default:
        this.logger.warn('Unknown delivery method:', notification.deliveryMethod);
        return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: PublishingNotification,
    recipient: any
  ): Promise<boolean> {
    if (!this.emailTransporter || !recipient.email) {
      return false;
    }

    try {
      const mailOptions = {
        from: this.config.email!.from,
        to: recipient.email,
        subject: notification.title,
        html: this.generateEmailTemplate(notification, recipient)
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;

    } catch (error) {
      this.logger.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    notification: PublishingNotification,
    recipient: any
  ): Promise<boolean> {
    if (!this.smsClient || !recipient.phone) {
      return false;
    }

    try {
      await this.smsClient.messages.create({
        body: `${notification.title}\n\n${notification.message}`,
        from: this.config.sms!.from,
        to: recipient.phone
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to send SMS notification:', error);
      return false;
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    notification: PublishingNotification,
    recipient: any
  ): Promise<boolean> {
    if (!this.config.push?.enabled) {
      return false;
    }

    try {
      // Implement push notification logic here
      // This would integrate with services like Firebase, Apple Push Notifications, etc.
      this.logger.info('Push notification would be sent here', {
        notificationId: notification.id,
        recipientId: recipient.id
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Mark notification as sent via specific delivery method
   */
  private async markNotificationSent(
    notificationId: string,
    deliveryMethod: DeliveryMethod
  ): Promise<void> {
    const updateData: any = {
      sentAt: new Date()
    };

    if (deliveryMethod === DeliveryMethod.EMAIL) {
      updateData.emailSent = true;
    } else if (deliveryMethod === DeliveryMethod.SMS) {
      updateData.smsSent = true;
    }

    await this.prisma.publishingNotification.update({
      where: { id: notificationId },
      data: updateData
    });
  }

  /**
   * Personalize message with recipient data
   */
  private personalizeMessage(
    template: string,
    recipient: any,
    templateData?: Record<string, any>
  ): string {
    let message = template;

    // Replace recipient placeholders
    message = message.replace(/\{firstName\}/g, recipient.firstName || '');
    message = message.replace(/\{lastName\}/g, recipient.lastName || '');
    message = message.replace(/\{fullName\}/g, `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim());

    // Replace custom template data
    if (templateData) {
      Object.entries(templateData).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g');
        message = message.replace(placeholder, String(value));
      });
    }

    return message;
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(
    notification: PublishingNotification,
    recipient: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f8f9fa; padding: 10px 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Management System</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>Hello ${recipient.firstName},</p>
              <p>${notification.message}</p>
              <p>Please log in to the document management system to take action.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from the Document Management System.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate digest content
   */
  private generateDigestContent(
    notifications: any[],
    digestType: 'daily' | 'weekly'
  ): string {
    const groupedNotifications = notifications.reduce((acc, notification) => {
      const type = notification.notificationType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    }, {} as Record<string, any[]>);

    let content = `<h2>${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Notification Digest</h2>`;
    content += `<p>You have ${notifications.length} notifications from the past ${digestType === 'daily' ? 'day' : 'week'}.</p>`;

    Object.entries(groupedNotifications).forEach(([type, typeNotifications]) => {
      content += `<h3>${type.replace(/_/g, ' ')} (${(typeNotifications as any[]).length})</h3>`;
      content += '<ul>';
      
      (typeNotifications as any[]).forEach((notification: any) => {
        content += `<li><strong>${notification.title}</strong> - ${notification.message}</li>`;
      });
      
      content += '</ul>';
    });

    return content;
  }

  /**
   * Send digest email
   */
  private async sendDigestEmail(
    email: string,
    name: string,
    digestType: string,
    content: string
  ): Promise<boolean> {
    if (!this.emailTransporter) {
      return false;
    }

    try {
      const mailOptions = {
        from: this.config.email!.from,
        to: email,
        subject: `${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Notification Digest`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Notification Digest</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto;">
                <h1>Hello ${name},</h1>
                ${content}
                <p>Visit the document management system to view all notifications and take action.</p>
                <hr>
                <small>This is an automated digest from the Document Management System.</small>
              </div>
            </body>
          </html>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;

    } catch (error) {
      this.logger.error('Failed to send digest email:', error);
      return false;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): NotificationConfig {
    return {
      email: {
        enabled: false,
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        },
        from: process.env.SMTP_FROM || 'noreply@example.com'
      },
      sms: {
        enabled: false,
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        from: process.env.TWILIO_FROM || ''
      },
      push: {
        enabled: false,
        apiKey: process.env.PUSH_API_KEY || '',
        endpoint: process.env.PUSH_ENDPOINT || ''
      }
    };
  }
}