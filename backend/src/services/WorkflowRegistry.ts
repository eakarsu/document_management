import { 
  IWorkflowPlugin, 
  IWorkflowConfig, 
  IPluginMetadata,
  IWorkflowDocument 
} from '../types/workflow.types';
import { PrismaClient } from '@prisma/client';

export class WorkflowRegistry {
  private static instance: WorkflowRegistry;
  private plugins: Map<string, IWorkflowPlugin> = new Map();
  private activeWorkflows: Map<string, string> = new Map(); // documentType -> pluginId
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): WorkflowRegistry {
    if (!WorkflowRegistry.instance) {
      WorkflowRegistry.instance = new WorkflowRegistry();
    }
    return WorkflowRegistry.instance;
  }

  // Register a new workflow plugin
  async register(plugin: IWorkflowPlugin): Promise<void> {
    try {
      // Validate plugin structure
      await this.validatePlugin(plugin);
      
      // Check for duplicate
      if (this.plugins.has(plugin.id)) {
        throw new Error(`Plugin with id ${plugin.id} already exists`);
      }
      
      // Store plugin in memory
      this.plugins.set(plugin.id, plugin);
      
      // Run installation hook if exists
      if (plugin.onInstall) {
        await plugin.onInstall();
      }
      
      // Persist plugin configuration to database
      await this.persistPlugin(plugin);
      
      console.log(`✅ Workflow plugin '${plugin.name}' v${plugin.version} registered successfully`);
    } catch (error: any) {
      console.error(`Failed to register plugin ${plugin.id}:`, error);
      throw error;
    }
  }

  // Unregister a workflow plugin
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Run uninstall hook if exists
    if (plugin.onUninstall) {
      await plugin.onUninstall();
    }

    // Remove from active workflows
    for (const [docType, activePluginId] of this.activeWorkflows) {
      if (activePluginId === pluginId) {
        this.activeWorkflows.delete(docType);
      }
    }

    // Remove from registry
    this.plugins.delete(pluginId);

    // Remove from database
    await this.removePlugin(pluginId);

    console.log(`✅ Workflow plugin '${plugin.name}' unregistered`);
  }

  // Activate workflow for specific document type
  async activateForDocumentType(
    pluginId: string, 
    documentType: string
  ): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    // Deactivate current workflow if exists
    const currentPluginId = this.activeWorkflows.get(documentType);
    if (currentPluginId) {
      const currentPlugin = this.plugins.get(currentPluginId);
      if (currentPlugin?.onDisable) {
        await currentPlugin.onDisable();
      }
    }
    
    // Activate new workflow
    this.activeWorkflows.set(documentType, pluginId);
    
    if (plugin.onEnable) {
      await plugin.onEnable();
    }
    
    // Persist activation to database
    await this.persistActivation(documentType, pluginId);
    
    console.log(`✅ Workflow '${plugin.name}' activated for document type '${documentType}'`);
  }

  // Deactivate workflow for document type
  async deactivateForDocumentType(documentType: string): Promise<void> {
    const pluginId = this.activeWorkflows.get(documentType);
    if (!pluginId) {
      return;
    }

    const plugin = this.plugins.get(pluginId);
    if (plugin?.onDisable) {
      await plugin.onDisable();
    }

    this.activeWorkflows.delete(documentType);
    await this.removeActivation(documentType);
    
    console.log(`✅ Workflow deactivated for document type '${documentType}'`);
  }

  // Get workflow for document
  getWorkflowForDocument(document: IWorkflowDocument): IWorkflowPlugin | null {
    const pluginId = this.activeWorkflows.get(document.type);
    return pluginId ? this.plugins.get(pluginId) || null : null;
  }

  // Get workflow by ID
  getWorkflow(pluginId: string): IWorkflowPlugin | null {
    return this.plugins.get(pluginId) || null;
  }

  // List all registered workflows
  listAll(): IPluginMetadata[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      organization: plugin.organization
    }));
  }

  // List active workflows
  listActive(): Map<string, string> {
    return new Map(this.activeWorkflows);
  }

  // Validate plugin structure
  private async validatePlugin(plugin: IWorkflowPlugin): Promise<void> {
    // Check required fields
    if (!plugin.id || !plugin.name || !plugin.version) {
      throw new Error('Plugin missing required metadata (id, name, version)');
    }

    if (!plugin.config) {
      throw new Error('Plugin missing configuration');
    }

    if (!plugin.config.stages || plugin.config.stages.length === 0) {
      throw new Error('Plugin must have at least one stage');
    }

    // Validate stage IDs are unique
    const stageIds = new Set<string>();
    for (const stage of plugin.config.stages) {
      if (stageIds.has(stage.id)) {
        throw new Error(`Duplicate stage ID: ${stage.id}`);
      }
      stageIds.add(stage.id);
    }

    // Validate transitions reference existing stages
    if (plugin.config.transitions) {
      for (const transition of plugin.config.transitions) {
        if (!stageIds.has(transition.from) || !stageIds.has(transition.to)) {
          throw new Error(`Invalid transition: ${transition.from} -> ${transition.to}`);
        }
      }
    }

    // Check required methods
    if (typeof plugin.getStages !== 'function') {
      throw new Error('Plugin must implement getStages method');
    }

    if (typeof plugin.validateTransition !== 'function') {
      throw new Error('Plugin must implement validateTransition method');
    }

    if (typeof plugin.executeStage !== 'function') {
      throw new Error('Plugin must implement executeStage method');
    }
  }

  // Persist plugin to database (disabled until workflow_plugins table is added to schema)
  private async persistPlugin(plugin: IWorkflowPlugin): Promise<void> {
    try {
      // TODO: Add workflow_plugins table to Prisma schema
      // await this.prisma.$executeRaw`
      //   INSERT INTO workflow_plugins (id, name, version, description, organization, config, created_at)
      //   VALUES (${plugin.id}, ${plugin.name}, ${plugin.version}, ${plugin.description}, 
      //           ${plugin.organization}, ${JSON.stringify(plugin.config)}::jsonb, NOW())
      //   ON CONFLICT (id) 
      //   DO UPDATE SET 
      //     name = EXCLUDED.name,
      //     version = EXCLUDED.version,
      //     description = EXCLUDED.description,
      //     config = EXCLUDED.config,
      //     updated_at = NOW()
      // `;
    } catch (error: any) {
      console.error('Failed to persist plugin:', error);
      // Continue even if persistence fails (memory-only operation)
    }
  }

  // Remove plugin from database (disabled until workflow_plugins table is added to schema)
  private async removePlugin(pluginId: string): Promise<void> {
    try {
      // TODO: Add workflow_plugins table to Prisma schema
      // await this.prisma.$executeRaw`
      //   DELETE FROM workflow_plugins WHERE id = ${pluginId}
      // `;
    } catch (error: any) {
      console.error('Failed to remove plugin from database:', error);
    }
  }

  // Persist workflow activation (disabled until workflow_activations table is added to schema)
  private async persistActivation(documentType: string, pluginId: string): Promise<void> {
    try {
      // TODO: Add workflow_activations table to Prisma schema
      // await this.prisma.$executeRaw`
      //   INSERT INTO workflow_activations (document_type, plugin_id, activated_at)
      //   VALUES (${documentType}, ${pluginId}, NOW())
      //   ON CONFLICT (document_type)
      //   DO UPDATE SET 
      //     plugin_id = EXCLUDED.plugin_id,
      //     activated_at = NOW()
      // `;
    } catch (error: any) {
      console.error('Failed to persist activation:', error);
    }
  }

  // Remove workflow activation (disabled until workflow_activations table is added to schema)
  private async removeActivation(documentType: string): Promise<void> {
    try {
      // TODO: Add workflow_activations table to Prisma schema
      // await this.prisma.$executeRaw`
      //   DELETE FROM workflow_activations WHERE document_type = ${documentType}
      // `;
    } catch (error: any) {
      console.error('Failed to remove activation:', error);
    }
  }

  // Load plugins from database on startup
  async loadFromDatabase(): Promise<void> {
    try {
      // This would load persisted plugin configurations
      // For now, we'll load pre-built plugins
      console.log('Loading workflow plugins from database...');
    } catch (error: any) {
      console.error('Failed to load plugins from database:', error);
    }
  }

  // Export plugin configuration
  exportPlugin(pluginId: string): IWorkflowConfig | null {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.config : null;
  }

  // Import plugin configuration
  async importPlugin(config: IWorkflowConfig, metadata: Partial<IPluginMetadata>): Promise<string> {
    const pluginId = metadata.id || `imported-${Date.now()}`;
    
    // Create a basic plugin wrapper
    const plugin: IWorkflowPlugin = {
      id: pluginId,
      name: metadata.name || 'Imported Workflow',
      version: metadata.version || '1.0.0',
      description: metadata.description || 'Imported workflow configuration',
      organization: metadata.organization || 'Custom',
      config,
      
      getStages: () => config.stages,
      
      validateTransition: (from, to, context) => {
        const transition = config.transitions.find(t => 
          t.from === from && t.to === to
        );
        return !!transition;
      },
      
      executeStage: async (stageId, context) => {
        const stage = config.stages.find(s => s.id === stageId);
        if (!stage) {
          return { success: false, errors: [`Stage ${stageId} not found`] };
        }
        
        // Basic execution logic
        const nextTransition = config.transitions.find(t => t.from === stageId);
        return {
          success: true,
          nextStage: nextTransition?.to,
          newState: {
            currentStage: nextTransition?.to || stageId,
            previousStage: stageId,
            updatedAt: new Date()
          }
        };
      }
    };
    
    await this.register(plugin);
    return pluginId;
  }
}