import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

// Create HTTP link
const httpLink = createHttpLink({
  uri: '/graphql',
  credentials: 'include',
});

// Authentication is carried only by HttpOnly cookies.
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'UNAUTHORIZED') {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    
    // Handle network errors
    if ('statusCode' in networkError) {
      const { statusCode } = networkError as any;
      
      if (statusCode === 401) {
        // Try to refresh token
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
  }
});

// Retry link for failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => !!error,
  },
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([
    errorLink,
    retryLink,
    authLink,
    httpLink,
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          documents: {
            keyArgs: ['input', ['query', 'category', 'tags', 'status', 'folderId']],
            merge(existing, incoming, { args }) {
              if (!existing || args?.input?.page === 1) {
                return incoming;
              }
              
              return {
                ...incoming,
                documents: [...existing.documents, ...incoming.documents],
              };
            },
          },
        },
      },
      Document: {
        fields: {
          downloadUrl: {
            // Don't cache download URLs as they expire
            merge: false,
          },
          thumbnailUrl: {
            // Don't cache thumbnail URLs as they expire
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

// Helper function to clear cache
export const clearApolloCache = () => {
  apolloClient.clearStore();
};
