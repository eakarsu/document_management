import { IWorkflowState } from '../types/workflow.types';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

export class WorkflowStateManager {
  private prisma: PrismaClient;
  private redis: Redis | null = null;
  private cache: Map<string, IWorkflowState> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    
    // Try to connect to Redis for caching
    try {
      this.redis = new Redis({
        host: 'localhost',
        port: 6379,
        retryStrategy: () => null // Don't retry if Redis is not available
      });
      
      this.redis.on('error', (err: Error) => {
        console.warn('Redis connection error, falling back to in-memory cache:', err.message);
        this.redis = null;
      });
    } catch (error) {
      console.warn('Redis not available, using in-memory cache');
    }
  }

  // Create new workflow state
  async createState(documentId: string, state: IWorkflowState): Promise<void> {
    try {
      // Save to database
      await this.prisma.$executeRaw`
        INSERT INTO workflow_states (
          document_id, 
          workflow_id, 
          current_stage, 
          previous_stage,
          status, 
          started_at, 
          updated_at,
          data,
          history
        )
        VALUES (
          ${documentId},
          ${state.workflowId},
          ${state.currentStage},
          ${state.previousStage || null},
          ${state.status},
          ${state.startedAt},
          ${state.updatedAt},
          ${JSON.stringify(state.data || {})}::jsonb,
          ${JSON.stringify(state.history || [])}::jsonb
        )
      `;

      // Cache the state
      await this.cacheState(documentId, state);
      
      console.log(`✅ Workflow state created for document ${documentId}`);
    } catch (error) {
      console.error('Failed to create workflow state:', error);
      // Still cache it even if DB fails
      this.cache.set(documentId, state);
      throw error;
    }
  }

  // Get workflow state
  async getState(documentId: string): Promise<IWorkflowState | null> {
    try {
      // Try cache first
      const cached = await this.getCachedState(documentId);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          workflow_id,
          current_stage,
          previous_stage,
          status,
          started_at,
          updated_at,
          completed_at,
          data,
          history
        FROM workflow_states
        WHERE document_id = ${documentId}
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      const state: IWorkflowState = {
        workflowId: row.workflow_id,
        documentId: documentId,
        currentStage: row.current_stage,
        previousStage: row.previous_stage,
        status: row.status,
        startedAt: new Date(row.started_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        data: row.data || {},
        history: row.history || []
      };

      // Cache the state
      await this.cacheState(documentId, state);

      return state;
    } catch (error) {
      console.error('Failed to get workflow state:', error);
      
      // Fallback to cache
      return this.cache.get(documentId) || null;
    }
  }

  // Update workflow state
  async updateState(documentId: string, state: IWorkflowState): Promise<void> {
    try {
      // Update in database
      await this.prisma.$executeRaw`
        UPDATE workflow_states
        SET 
          current_stage = ${state.currentStage},
          previous_stage = ${state.previousStage || null},
          status = ${state.status},
          updated_at = ${state.updatedAt},
          completed_at = ${state.completedAt || null},
          data = ${JSON.stringify(state.data || {})}::jsonb,
          history = ${JSON.stringify(state.history || [])}::jsonb
        WHERE document_id = ${documentId}
      `;

      // Update cache
      await this.cacheState(documentId, state);
      
      console.log(`✅ Workflow state updated for document ${documentId}`);
    } catch (error) {
      console.error('Failed to update workflow state:', error);
      
      // Still update cache even if DB fails
      this.cache.set(documentId, state);
      throw error;
    }
  }

  // Delete workflow state
  async deleteState(documentId: string): Promise<void> {
    try {
      // Delete from database
      await this.prisma.$executeRaw`
        DELETE FROM workflow_states
        WHERE document_id = ${documentId}
      `;

      // Remove from cache
      await this.removeCachedState(documentId);
      
      console.log(`✅ Workflow state deleted for document ${documentId}`);
    } catch (error) {
      console.error('Failed to delete workflow state:', error);
      throw error;
    }
  }

  // Get states by workflow ID
  async getStatesByWorkflow(workflowId: string): Promise<IWorkflowState[]> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT 
          document_id,
          workflow_id,
          current_stage,
          previous_stage,
          status,
          started_at,
          updated_at,
          completed_at,
          data,
          history
        FROM workflow_states
        WHERE workflow_id = ${workflowId}
        ORDER BY updated_at DESC
      `;

      return results.map(row => ({
        workflowId: row.workflow_id,
        documentId: row.document_id,
        currentStage: row.current_stage,
        previousStage: row.previous_stage,
        status: row.status,
        startedAt: new Date(row.started_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        data: row.data || {},
        history: row.history || []
      }));
    } catch (error) {
      console.error('Failed to get states by workflow:', error);
      return [];
    }
  }

  // Get states by status
  async getStatesByStatus(status: string): Promise<IWorkflowState[]> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT 
          document_id,
          workflow_id,
          current_stage,
          previous_stage,
          status,
          started_at,
          updated_at,
          completed_at,
          data,
          history
        FROM workflow_states
        WHERE status = ${status}
        ORDER BY updated_at DESC
      `;

      return results.map(row => ({
        workflowId: row.workflow_id,
        documentId: row.document_id,
        currentStage: row.current_stage,
        previousStage: row.previous_stage,
        status: row.status,
        startedAt: new Date(row.started_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        data: row.data || {},
        history: row.history || []
      }));
    } catch (error) {
      console.error('Failed to get states by status:', error);
      return [];
    }
  }

  // Get overdue workflows
  async getOverdueWorkflows(hoursOverdue: number = 24): Promise<IWorkflowState[]> {
    try {
      const cutoffTime = new Date(Date.now() - hoursOverdue * 60 * 60 * 1000);
      
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT 
          document_id,
          workflow_id,
          current_stage,
          previous_stage,
          status,
          started_at,
          updated_at,
          completed_at,
          data,
          history
        FROM workflow_states
        WHERE status = 'active'
          AND updated_at < ${cutoffTime}
        ORDER BY updated_at ASC
      `;

      return results.map(row => ({
        workflowId: row.workflow_id,
        documentId: row.document_id,
        currentStage: row.current_stage,
        previousStage: row.previous_stage,
        status: row.status,
        startedAt: new Date(row.started_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        data: row.data || {},
        history: row.history || []
      }));
    } catch (error) {
      console.error('Failed to get overdue workflows:', error);
      return [];
    }
  }

  // Get workflow statistics
  async getStatistics(): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    suspended: number;
    averageCompletionTime: number;
  }> {
    try {
      const stats = await this.prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended,
          AVG(
            CASE 
              WHEN status = 'completed' AND completed_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (completed_at - started_at))
              ELSE NULL 
            END
          ) as avg_completion_time
        FROM workflow_states
      `;

      const result = stats[0];
      return {
        total: parseInt(result.total),
        active: parseInt(result.active),
        completed: parseInt(result.completed),
        cancelled: parseInt(result.cancelled),
        suspended: parseInt(result.suspended),
        averageCompletionTime: parseFloat(result.avg_completion_time) || 0
      };
    } catch (error) {
      console.error('Failed to get workflow statistics:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        suspended: 0,
        averageCompletionTime: 0
      };
    }
  }

  // Cache management methods
  private async cacheState(documentId: string, state: IWorkflowState): Promise<void> {
    // In-memory cache
    this.cache.set(documentId, state);

    // Redis cache if available
    if (this.redis) {
      try {
        await this.redis.setex(
          `workflow:state:${documentId}`,
          3600, // 1 hour TTL
          JSON.stringify(state)
        );
      } catch (error) {
        console.warn('Failed to cache state in Redis:', error);
      }
    }
  }

  private async getCachedState(documentId: string): Promise<IWorkflowState | null> {
    // Check in-memory cache first
    const memCached = this.cache.get(documentId);
    if (memCached) {
      return memCached;
    }

    // Check Redis if available
    if (this.redis) {
      try {
        const cached = await this.redis.get(`workflow:state:${documentId}`);
        if (cached) {
          const state = JSON.parse(cached);
          // Update in-memory cache
          this.cache.set(documentId, state);
          return state;
        }
      } catch (error) {
        console.warn('Failed to get cached state from Redis:', error);
      }
    }

    return null;
  }

  private async removeCachedState(documentId: string): Promise<void> {
    // Remove from in-memory cache
    this.cache.delete(documentId);

    // Remove from Redis if available
    if (this.redis) {
      try {
        await this.redis.del(`workflow:state:${documentId}`);
      } catch (error) {
        console.warn('Failed to remove cached state from Redis:', error);
      }
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.cache.clear();
    await this.prisma.$disconnect();
  }
}