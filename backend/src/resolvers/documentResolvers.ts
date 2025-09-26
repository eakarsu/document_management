import { GraphQLScalarType } from 'graphql';

// Create a simple upload scalar since graphql-upload has export issues
const GraphQLUpload = new GraphQLScalarType({
  name: 'Upload',
  description: 'The `Upload` scalar type represents a file upload.',
});
import { DocumentService } from '../services/DocumentService';
import { StorageService } from '../services/StorageService';

// Export Context interface explicitly
export interface Context {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: {
      permissions: string[];
    };
  };
  services: {
    document: DocumentService;
    storage: StorageService;
  };
}

// Use explicit typing to avoid export name issues
export const documentResolvers: any = {
  Upload: GraphQLUpload,

  Query: {
    async document(
      _: any,
      { id }: { id: string },
      { user, services }: Context
    ) {
      if (!user) throw new Error('Authentication required');

      return await services.document.getDocumentById(
        id,
        user.id,
        user.organizationId
      );
    },

    async documents(
      _: any,
      { input }: { input: any },
      { user, services }: Context
    ) {
      if (!user) throw new Error('Authentication required');

      return await services.document.searchDocuments({
        ...input,
        organizationId: user.organizationId
      });
    },

    async searchDocuments(
      _: any,
      { input }: { input: any },
      { user, services }: Context
    ) {
      if (!user) throw new Error('Authentication required');

      return await services.document.searchDocuments({
        ...input,
        organizationId: user.organizationId
      });
    }
  },

  Mutation: {
    async createDocument(
      _: any,
      { input }: { input: any },
      { user, services }: Context
    ) {
      try {
        if (!user) throw new Error('Authentication required');

        const { file, ...documentData } = input;
        const { createReadStream, filename, mimetype } = await file;

        // Read file buffer
        const stream = createReadStream();
        const chunks: Buffer[] = [];
        
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        
        const fileBuffer = Buffer.concat(chunks);

        // Create document
        const document = await services.document.createDocument(
          {
            ...documentData,
            fileName: filename,
            originalName: filename,
            mimeType: mimetype,
            fileBuffer
          },
          user.id,
          user.organizationId
        );

        return {
          success: true,
          document
        };

      } catch (error: any) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    },

    async updateDocument(
      _: any,
      { id, input }: { id: string; input: any },
      { user, services }: Context
    ) {
      if (!user) throw new Error('Authentication required');

      return await services.document.updateDocument(
        id,
        input,
        user.id,
        user.organizationId
      );
    },

    async deleteDocument(
      _: any,
      { id, permanent = false }: { id: string; permanent?: boolean },
      { user, services }: Context
    ) {
      try {
        if (!user) throw new Error('Authentication required');

        const success = await services.document.deleteDocument(
          id,
          user.id,
          user.organizationId,
          permanent
        );

        return { success };

      } catch (error: any) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Delete failed'
        };
      }
    }
  },

  Document: {
    async downloadUrl(
      parent: any,
      _: any,
      { services }: Context
    ) {
      return await services.storage.getDocumentUrl(parent.storagePath);
    },

    async thumbnailUrl(
      parent: any,
      _: any,
      { services }: Context
    ) {
      return await services.storage.getThumbnailUrl(parent.storagePath);
    },

    versionsCount(parent: any) {
      return parent._count?.versions || parent.versions?.length || 0;
    },

    commentsCount(parent: any) {
      return parent._count?.comments || parent.comments?.length || 0;
    }
  },

  DocumentVersion: {
    async downloadUrl(
      parent: any,
      _: any,
      { services }: Context
    ) {
      return await services.storage.getDocumentUrl(parent.storagePath);
    }
  }
};