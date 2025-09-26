import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { typeDefs } from '../resolvers/typeDefs';
import { resolvers } from '../resolvers';
import { graphqlAuthMiddleware } from '../middleware/auth';
import { logger } from '../config/logger';
import { DocumentService } from '../services/DocumentService';
import { AuthService } from '../services/AuthService';
import { SearchService } from '../services/SearchService';
import { StorageService } from '../services/StorageService';

export async function setupGraphQL(app: any, httpServer: any) {
  // Initialize services
  const documentService = new DocumentService();
  const authService = new AuthService();
  const searchService = new SearchService();
  const storageService = new StorageService();

  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    introspection: process.env.NODE_ENV === 'development',
    plugins: [
      {
        async requestDidStart() {
          return {
            async didEncounterErrors(ctx: any) {
              logger.error('GraphQL Error:', ctx.errors);
            },
          };
        },
      },
    ],
  });

  await apolloServer.start();

  // GraphQL endpoint with smart authentication
  app.use('/graphql',
    graphqlAuthMiddleware,
    expressMiddleware(apolloServer, {
      context: async ({ req }: { req: any }) => ({
        user: req.user,
        req: req,
        services: {
          document: documentService,
          auth: authService,
          search: searchService,
          storage: storageService,
        },
      }),
    })
  );

  // WebSocket server for real-time features
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer({ schema }, wsServer);

  return { apolloServer, wsServer };
}