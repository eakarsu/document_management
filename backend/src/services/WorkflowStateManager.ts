import { PrismaClient } from '@prisma/client';
import { IWorkflowState } from '../types/workflow.types';
import Redis from 'ioredis';

export class WorkflowStateManager {
  private prisma: PrismaClient;
  private redis: Redis | null = null;
  private cache: Map<string, IWorkflowState>;

  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new Map();

    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: () => null
      });

      this.redis.on('error', (err: Error) => {
        console.warn('Redis connection error, falling back to in-memory cache:', err.message);
        this.redis = null;
      });
    } catch (error: any) {
      console.warn('Redis not available, using in-memory cache');
    }
  }

  // Create new workflow state using Prisma ORM
  async createState(documentId: string, state: IWorkflowState): Promise<void> {
    try {
      // Use upsert to handle existing states gracefully
      await this.prisma.workflowState.upsert({
        where: { documentId },
        create: {
          documentId,
          workflowId: state.workflowId,
          currentStage: state.currentStage,
          previousStage: state.previousStage || null,
          status: state.status,
          startedAt: state.startedAt,
          updatedAt: state.updatedAt,
          completedAt: state.completedAt || null,
          data: state.data || {},
          history: (state.history || []) as any
        },
        update: {
          workflowId: state.workflowId,
          currentStage: state.currentStage,
          previousStage: state.previousStage || null,
          status: state.status,
          startedAt: state.startedAt,
          updatedAt: state.updatedAt,
          completedAt: state.completedAt || null,
          data: state.data || {},
          history: (state.history || []) as any
        }
      });

      // Cache the state
      await this.cacheState(documentId, state);

      console.log(`✅ Workflow state created for document ${documentId}`);
    } catch (error: any) {
      console.error('Failed to create workflow state:', error);
      console.error('Full error details:', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
      // Still cache it even if DB fails
      this.cache.set(documentId, state);
      throw error;
    }
  }

  // Get workflow state
  async getState(documentId: string): Promise<IWorkflowState | null> {
    try {
      // Check cache first
      const cachedState = await this.getCachedState(documentId);
      if (cachedState) return cachedState;

      // Query database using Prisma
      const result = await this.prisma.workflowState.findUnique({
        where: { documentId }
      });

      if (!result) {
        return this.cache.get(documentId) || null;
      }

      const state: IWorkflowState = {
        workflowId: result.workflowId,
        documentId: result.documentId,
        currentStage: result.currentStage,
        previousStage: result.previousStage || undefined,
        status: result.status as any,
        startedAt: result.startedAt,
        updatedAt: result.updatedAt,
        completedAt: result.completedAt || undefined,
        data: result.data as any || {},
        history: result.history as any[] || []
      };

      // Cache the state
      await this.cacheState(documentId, state);

      return state;
    } catch (error: any) {
      console.error('Error getting workflow state:', error);
      // Fallback to cache
      return this.cache.get(documentId) || null;
    }
  }

  // Update workflow state
  async updateState(documentId: string, state: IWorkflowState): Promise<void> {
    try {
      // Update database using Prisma
      await this.prisma.workflowState.update({
        where: { documentId },
        data: {
          currentStage: state.currentStage,
          previousStage: state.previousStage || null,
          status: state.status,
          updatedAt: state.updatedAt,
          completedAt: state.completedAt || null,
          data: state.data || {},
          history: (state.history || []) as any
        }
      });

      // Update cache
      await this.cacheState(documentId, state);

      console.log(`✅ Workflow state updated for document ${documentId}`);
    } catch (error: any) {
      console.error('Error updating workflow state:', error);
      // Still update cache even if DB fails
      this.cache.set(documentId, state);
      throw error;
    }
  }

  // Delete workflow state
  async deleteState(documentId: string): Promise<void> {
    try {
      // Delete from database using Prisma
      await this.prisma.workflowState.delete({
        where: { documentId }
      });

      // Remove from cache
      this.cache.delete(documentId);
      if (this.redis) {
        await this.redis.del(`workflow:${documentId}`);
      }

      console.log(`✅ Workflow state deleted for document ${documentId}`);
    } catch (error: any) {
      console.error('Error deleting workflow state:', error);
      throw error;
    }
  }

  // Get all states for a workflow
  async getStatesByWorkflow(workflowId: string): Promise<IWorkflowState[]> {
    try {
      const results = await this.prisma.workflowState.findMany({
        where: { workflowId },
        orderBy: { updatedAt: 'desc' }
      });

      return results.map(row => ({
        workflowId: row.workflowId,
        documentId: row.documentId,
        currentStage: row.currentStage,
        previousStage: row.previousStage || undefined,
        status: row.status as any,
        startedAt: row.startedAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt || undefined,
        data: row.data as any || {},
        history: row.history as any[] || []
      }));
    } catch (error: any) {
      console.error('Error getting states by workflow:', error);
      return [];
    }
  }

  // Get all states at a specific stage
  async getStatesByStage(stage: string): Promise<IWorkflowState[]> {
    try {
      const results = await this.prisma.workflowState.findMany({
        where: { currentStage: stage },
        orderBy: { updatedAt: 'desc' }
      });

      return results.map(row => ({
        workflowId: row.workflowId,
        documentId: row.documentId,
        currentStage: row.currentStage,
        previousStage: row.previousStage || undefined,
        status: row.status as any,
        startedAt: row.startedAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt || undefined,
        data: row.data as any || {},
        history: row.history as any[] || []
      }));
    } catch (error: any) {
      console.error('Error getting states by stage:', error);
      return [];
    }
  }

  // Get all states with a specific status
  async getStatesByStatus(status: string): Promise<IWorkflowState[]> {
    try {
      const results = await this.prisma.workflowState.findMany({
        where: { status },
        orderBy: { updatedAt: 'desc' }
      });

      return results.map(row => ({
        workflowId: row.workflowId,
        documentId: row.documentId,
        currentStage: row.currentStage,
        previousStage: row.previousStage || undefined,
        status: row.status as any,
        startedAt: row.startedAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt || undefined,
        data: row.data as any || {},
        history: row.history as any[] || []
      }));
    } catch (error: any) {
      console.error('Error getting states by status:', error);
      return [];
    }
  }

  // Check if document has active workflow
  async hasActiveWorkflow(documentId: string): Promise<boolean> {
    const state = await this.getState(documentId);
    return state !== null && state.status !== 'completed' && state.status !== 'cancelled';
  }

  // Private: Cache state
  private async cacheState(documentId: string, state: IWorkflowState): Promise<void> {
    // Cache in memory
    this.cache.set(documentId, state);

    // Cache in Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(
          `workflow:${documentId}`,
          3600, // 1 hour TTL
          JSON.stringify(state)
        );
      } catch (error: any) {
        console.warn('Failed to cache in Redis:', error.message);
      }
    }
  }

  // Private: Get cached state
  private async getCachedState(documentId: string): Promise<IWorkflowState | null> {
    // Check memory cache first
    if (this.cache.has(documentId)) {
      return this.cache.get(documentId)!;
    }

    // Check Redis if available
    if (this.redis) {
      try {
        const cached = await this.redis.get(`workflow:${documentId}`);
        if (cached) {
          const state = JSON.parse(cached);
          // Also update memory cache
          this.cache.set(documentId, state);
          return state;
        }
      } catch (error: any) {
        console.warn('Failed to get from Redis:', error.message);
      }
    }

    return null;
  }

  // Cleanup old workflow states
  async cleanupOldStates(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.workflowState.deleteMany({
        where: {
          AND: [
            { status: { in: ['completed', 'cancelled'] } },
            { updatedAt: { lt: cutoffDate } }
          ]
        }
      });

      console.log(`✅ Cleaned up ${result.count} old workflow states`);
      return result.count;
    } catch (error: any) {
      console.error('Error cleaning up old states:', error);
      return 0;
    }
  }
}