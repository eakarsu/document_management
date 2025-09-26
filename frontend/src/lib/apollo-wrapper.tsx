'use client';

import { useMemo } from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

function createApolloClient() {
  // Create HTTP link
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/graphql`
      : 'http://localhost:4000/graphql',
    credentials: 'include',
  });

  // Auth link to add JWT token to headers
  const authLink = setContext((_, { headers }) => {
    // Get token from localStorage
    let token: string | null = null;

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken');
    }

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    };
  });

  // Error handling link
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, extensions }) => {
        console.error(`GraphQL error: ${message}`);

        // Handle authentication errors
        if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'UNAUTHORIZED') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
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
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
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
}

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => createApolloClient(), []);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}