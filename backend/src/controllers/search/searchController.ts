import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticateToken';
import { SearchService } from '../../services/SearchService';

const searchService = new SearchService();

export class SearchController {
  async suggest(req: AuthenticatedRequest, res: Response) {
    try {
      const { q: query, field = 'title' } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      if (!['title', 'tags', 'category'].includes(field as string)) {
        return res.status(400).json({
          success: false,
          error: 'Field must be one of: title, tags, category'
        });
      }

      const suggestions = await searchService.suggest(
        req.user.organizationId,
        query.trim(),
        field as 'title' | 'tags' | 'category'
      );

      res.json({
        success: true,
        suggestions,
        query: query.trim(),
        field
      });

    } catch (error: any) {
      console.error('Search suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get search suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await searchService.getSearchStats(req.user.organizationId);

      res.json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('Search stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get search statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async healthCheck(req: AuthenticatedRequest, res: Response) {
    try {
      const isHealthy = await searchService.healthCheck();

      res.status(isHealthy ? 200 : 503).json({
        success: true,
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'elasticsearch',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Search health check error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        service: 'elasticsearch',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async reindex(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user has admin permissions (optional - you can add role check here)
      // For now, any authenticated user can trigger reindexing

      const { organizationOnly = true } = req.body;

      // Start reindexing in the background
      const organizationId = organizationOnly ? req.user.organizationId : undefined;

      // Run reindexing asynchronously
      searchService.reindexAllDocuments(organizationId)
        .then(() => {
          console.log('Document reindexing completed successfully');
        })
        .catch((error: any) => {
          console.error('Document reindexing failed:', error);
        });

      res.json({
        success: true,
        message: 'Document reindexing started',
        organizationOnly,
        organizationId: organizationId || 'all'
      });

    } catch (error: any) {
      console.error('Reindex initiation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start document reindexing',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const searchController = new SearchController();