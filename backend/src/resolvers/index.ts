import { documentResolvers } from './documentResolvers';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Custom scalar resolvers
const dateScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return null;
      }
    }
    return null;
  },
});

// Combine all resolvers with explicit typing
export const resolvers: any = {
  DateTime: dateScalar,
  JSON: jsonScalar,
  
  // Merge document resolvers
  ...documentResolvers,
  
  // Add other resolvers here as they're created
  Query: {
    ...documentResolvers.Query,
    
    // Add a basic me query for authentication testing
    me(_: any, __: any, { user }: any) {
      if (!user) throw new Error('Authentication required');
      return user;
    },
    
    // Add a dashboard stats query placeholder
    dashboardStats(_: any, __: any, { user }: any) {
      if (!user) throw new Error('Authentication required');
      
      // TODO: Implement actual dashboard stats
      return {
        totalDocuments: 0,
        recentUploads: 0,
        storageUsed: 0,
        pendingTasks: 0
      };
    }
  },
  
  Mutation: {
    ...documentResolvers.Mutation,
    
    // Add authentication mutations placeholder
    async login(_: any, { input }: any, { services, req }: any) {
      try {
        const ipAddress = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
        const userAgent = req?.get('User-Agent') || 'Unknown';
        const result = await services.auth.login(input.email, input.password, ipAddress, userAgent);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed'
        };
      }
    },
    
    async register(_: any, { input }: any, { services }: any) {
      try {
        console.log('🔄 Register mutation called with:', { email: input.email, organizationId: input.organizationId });
        const result = await services.auth.register(input);
        console.log('✅ Registration result:', { success: result.success, hasUser: !!result.user, error: result.error });
        return result;
      } catch (error: any) {
        console.error('❌ Registration error in resolver:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed'
        };
      }
    },
    
    async logout(_: any, __: any, { user }: any) {
      try {
        if (!user) {
          return false;
        }
        // For simplicity, just return true - actual token invalidation would be handled by frontend
        return true;
      } catch (error: any) {
        return false;
      }
    }
  }
};