import { Response } from 'express';
import { AuthenticatedRequest, DocumentGenerationRequest, ValidTemplate } from '../../types/ai-document';
import { AIGeneratorService, DatabaseService } from '../../services/ai-document';

/**
 * Controller class for AI document generation endpoints
 */
export class GeneratorController {
  private aiGeneratorService: AIGeneratorService;
  private databaseService: DatabaseService;

  constructor() {
    this.aiGeneratorService = new AIGeneratorService();
    this.databaseService = new DatabaseService();
  }

  /**
   * Handles POST request to generate AI document
   * @param req - Authenticated request with generation parameters
   * @param res - Express response object
   */
  async generateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        template,
        pages,
        feedbackCount,
        sealImage,
        headerData
      }: DocumentGenerationRequest = req.body;

      console.log(`🚀 Generating AI document: template=${template}, pages=${pages}, feedback=${feedbackCount}`);

      // Generate the document using the AI service
      const result = await this.aiGeneratorService.generateDocument(
        template as ValidTemplate,
        pages,
        feedbackCount,
        sealImage,
        headerData
      );

      // Save the document to the database
      const document = await this.databaseService.saveDocument(result, template as ValidTemplate, req.user);

      console.log(`✅ Document saved to database with ID: ${document.id}`);

      // Send successful response
      res.json({
        success: true,
        documentId: document.id,
        title: document.title,
        feedbackCount: result.feedback.length,
        message: `Document generated successfully with ${pages} pages and ${result.feedback.length} feedback items`
      });

    } catch (error: any) {
      console.error('Error in GeneratorController.generateDocument:', error);

      // Send error response
      res.status(500).json({
        error: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handles GET request for generation status/health check
   * @param req - Authenticated request
   * @param res - Express response object
   */
  async getGenerationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if API key is configured
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
      const isConfigured = !!(OPENROUTER_API_KEY && OPENROUTER_API_KEY.trim() !== '');

      res.json({
        status: 'healthy',
        aiServiceConfigured: isConfigured,
        supportedTemplates: [
          'technical', 'policy', 'training', 'sop',
          'af-manual', 'afi', 'afpd', 'afman', 'afjqs', 'afto', 'afva', 'afh', 'afgm', 'afmd',
          'dafi', 'dafman', 'dafpd',
          'army', 'navy', 'marine', 'spaceforce',
          'dodd', 'dodi', 'cjcs',
          'oplan', 'opord', 'conops', 'ttp'
        ],
        limits: {
          maxPages: 20,
          maxFeedbackCount: 50,
          maxRequestSize: '1MB'
        }
      });
    } catch (error: any) {
      console.error('Error in GeneratorController.getGenerationStatus:', error);

      res.status(500).json({
        status: 'error',
        error: 'Failed to check generation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handles GET request for available templates
   * @param req - Authenticated request
   * @param res - Express response object
   */
  async getAvailableTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templates = [
        {
          id: 'technical',
          name: 'Technical Documentation',
          description: 'Software/system architecture documentation',
          category: 'Technical'
        },
        {
          id: 'policy',
          name: 'Organizational Policy',
          description: 'Policy documents with compliance requirements',
          category: 'Policy'
        },
        {
          id: 'training',
          name: 'Training Manual',
          description: 'Training materials with learning objectives',
          category: 'Training'
        },
        {
          id: 'sop',
          name: 'Standard Operating Procedure',
          description: 'Operational procedures and guidelines',
          category: 'Operations'
        },
        {
          id: 'af-manual',
          name: 'Air Force Manual',
          description: 'Official Air Force technical manual',
          category: 'Military - Air Force'
        },
        {
          id: 'afi',
          name: 'Air Force Instruction',
          description: 'Air Force regulatory guidance',
          category: 'Military - Air Force'
        },
        {
          id: 'afpd',
          name: 'Air Force Policy Directive',
          description: 'High-level Air Force policy',
          category: 'Military - Air Force'
        },
        {
          id: 'afman',
          name: 'Air Force Manual',
          description: 'Air Force procedural guidance',
          category: 'Military - Air Force'
        },
        {
          id: 'dafi',
          name: 'Department of Air Force Instruction',
          description: 'Department-wide instructions',
          category: 'Military - Air Force'
        },
        {
          id: 'dodd',
          name: 'DoD Directive',
          description: 'Department of Defense policy',
          category: 'Military - DoD'
        },
        {
          id: 'dodi',
          name: 'DoD Instruction',
          description: 'Department of Defense procedures',
          category: 'Military - DoD'
        },
        {
          id: 'oplan',
          name: 'Operation Plan',
          description: 'Strategic operation planning document',
          category: 'Military - Operations'
        },
        {
          id: 'opord',
          name: 'Operation Order',
          description: 'Tactical operation order',
          category: 'Military - Operations'
        }
      ];

      res.json({
        success: true,
        templates: templates,
        totalCount: templates.length
      });
    } catch (error: any) {
      console.error('Error in GeneratorController.getAvailableTemplates:', error);

      res.status(500).json({
        error: 'Failed to get available templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clean up resources when controller is destroyed
   */
  async cleanup(): Promise<void> {
    try {
      await this.databaseService.disconnect();
    } catch (error: any) {
      console.error('Error during controller cleanup:', error);
    }
  }
}
