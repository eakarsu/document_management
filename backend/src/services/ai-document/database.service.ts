import { PrismaClient } from '@prisma/client';
import { DocumentGenerationResult, AuthenticatedRequest } from '../../types/ai-document';

/**
 * Service class for database operations related to AI document generation
 */
export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Saves the generated document to the database
   * @param result - Document generation result
   * @param template - Document template type
   * @param user - Authenticated user
   * @returns Promise resolving to created document
   */
  async saveDocument(
    result: DocumentGenerationResult,
    template: string,
    user: AuthenticatedRequest['user']
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const document = await this.prisma.document.create({
      data: {
        title: `${result.title} - ${new Date().toLocaleDateString()}`,
        description: `AI-generated ${template} document with deep hierarchical structure`,
        category: 'AI_GENERATED',
        status: 'DRAFT',
        mimeType: 'text/html',
        fileName: `${template}_${Date.now()}.html`,
        originalName: `${template}_${Date.now()}.html`,
        fileSize: result.content.length,
        checksum: `${Date.now()}`,
        storagePath: `/ai-generated/${template}_${Date.now()}.html`,
        ocrText: result.content,  // Save the generated content to ocrText field for display
        ocrProcessed: true,
        customFields: {
          template: template,
          aiGenerated: true,
          generatedBy: 'AI',
          deepNesting: true,
          maxNestingLevel: 5,
          classification: 'UNCLASSIFIED',
          content: result.content,
          htmlContent: result.content,
          editableContent: this.extractEditableContent(result.content),
          plainText: result.content.replace(/<[^>]*>/g, ''), // Plain text version
          headerHtml: this.extractHeaderHtml(result.content),
          hasCustomHeader: this.hasCustomHeader(result.content),
          documentStyles: this.getDocumentStyles(),
          crmFeedback: result.feedback as any,
          totalComments: result.feedback.length,
          hasCriticalComments: result.feedback.some((f: any) => f.commentType === 'C'),
          lastFeedbackAt: result.feedback.length > 0 ? new Date().toISOString() : null
        },
        createdById: user.id,
        organizationId: user.organizationId,
        currentVersion: 1
      }
    });

    return document;
  }

  /**
   * Extracts editable content (without header and TOC)
   * @param content - Full document content
   * @returns Editable content portion
   */
  private extractEditableContent(content: string): string {
    // Check for Air Force document indicators
    if (content.includes('UNCLASSIFIED') || content.includes('TABLE OF CONTENTS') || content.includes('air-force-document-header')) {
      // Find the end of the TOC - look for page break after TOC
      const tocEndMatch = content.match(/<div style="page-break-after: always;"><\/div>/);
      if (tocEndMatch && tocEndMatch.index !== undefined) {
        // Return content after the TOC page break (includes intro and summary)
        const afterToc = content.substring(tocEndMatch.index + tocEndMatch[0].length);
        console.log('Extracted content after TOC (with intro/summary), length:', afterToc.length);
        return afterToc;
      }

      // Alternative: Look for where actual content starts (after TOC but including intro)
      // Find the introduction section (paragraph 0.1)
      const introPattern = /<div[^>]*>\s*<p[^>]*data-paragraph="0\.1"[^>]*>/;
      const introMatch = content.match(introPattern);
      if (introMatch && introMatch.index !== undefined) {
        // Start from the introduction paragraph
        const extracted = content.substring(introMatch.index);
        console.log('Extracted content from introduction, length:', extracted.length);
        return extracted;
      }

      // Fallback: Look for SUMMARY OF CHANGES
      const summaryPattern = /SUMMARY OF CHANGES/;
      const summaryMatch = content.match(summaryPattern);
      if (summaryMatch && summaryMatch.index !== undefined) {
        // Find the start of the containing div (go back to find it)
        let searchIndex = summaryMatch.index;
        while (searchIndex > 0) {
          searchIndex--;
          if (content.substring(searchIndex, searchIndex + 4) === '<div') {
            const extracted = content.substring(searchIndex);
            console.log('Extracted content from summary section, length:', extracted.length);
            return extracted;
          }
        }
      }

      // Final fallback: extract from first div after TOC
      const divPattern = /<div[^>]*style="margin-bottom: 20px/;
      const divMatch = content.match(divPattern);
      if (divMatch && divMatch.index !== undefined) {
        const extracted = content.substring(divMatch.index);
        console.log('Fallback: extracted from first content div, length:', extracted.length);
        return extracted;
      }
    }
    // If no Air Force header detected, return full content
    return content;
  }

  /**
   * Extracts header HTML (including TOC)
   * @param content - Full document content
   * @returns Header HTML portion
   */
  private extractHeaderHtml(content: string): string {
    // Check for Air Force document indicators
    if (content.includes('UNCLASSIFIED') || content.includes('TABLE OF CONTENTS') || content.includes('air-force-document-header')) {
      // Extract everything up to the end of TOC
      const tocEndMatch = content.match(/<div style="page-break-after: always;"><\/div>/);
      if (tocEndMatch && tocEndMatch.index !== undefined) {
        const header = content.substring(0, tocEndMatch.index + tocEndMatch[0].length);
        console.log('Extracted header with TOC, length:', header.length);
        return header;
      }
      // Fallback: extract up to first h2
      const firstH2 = content.indexOf('<h2');
      if (firstH2 !== -1) {
        const header = content.substring(0, firstH2);
        console.log('Extracted header up to first h2, length:', header.length);
        return header;
      }
    }
    return '';
  }

  /**
   * Checks if content has custom header
   * @param content - Document content
   * @returns Boolean indicating presence of custom header
   */
  private hasCustomHeader(content: string): boolean {
    return content.includes('UNCLASSIFIED') ||
           content.includes('TABLE OF CONTENTS') ||
           content.includes('air-force-document-header');
  }

  /**
   * Gets document styles for consistent formatting
   * @returns CSS styles string
   */
  private getDocumentStyles(): string {
    return `
      <style>
        h2 { font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        h3 { font-size: 13pt; font-weight: bold; margin-top: 15px; margin-bottom: 8px; margin-left: 20px; }
        h4 { font-size: 12pt; font-weight: bold; margin-top: 12px; margin-bottom: 6px; margin-left: 40px; }
        h5 { font-size: 11pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; margin-left: 60px; }
        h6 { font-size: 11pt; font-weight: bold; font-style: italic; margin-top: 8px; margin-bottom: 4px; margin-left: 80px; }
        p { font-size: 11pt; margin-bottom: 10px; text-align: justify; }
      </style>
    `;
  }

  /**
   * Closes the Prisma connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}