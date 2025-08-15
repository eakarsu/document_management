'use client';

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            An unexpected error has occurred. We apologize for the inconvenience.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={retry}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Try again
          </button>

          <button
            onClick={() => window.location.href = '/dashboard'}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        {isDevelopment && (
          <details className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-red-800">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 text-xs text-red-700">
              <p><strong>Error:</strong> {error.message}</p>
              {error.stack && (
                <pre className="mt-2 whitespace-pre-wrap overflow-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Specific error boundaries for different sections
export const AuthErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center space-y-4">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">Authentication Error</h2>
            <p className="text-gray-600">There was a problem with authentication.</p>
            <div className="space-y-2">
              <button onClick={retry} className="btn btn-primary w-full">
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="btn btn-secondary w-full"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export const DashboardErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="p-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Dashboard Error
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to load dashboard components.
          </p>
          <button onClick={retry} className="btn btn-primary">
            Reload Dashboard
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export const DocumentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="card">
          <div className="card-content text-center py-8">
            <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Document Error
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load document information.
            </p>
            <div className="space-x-2">
              <button onClick={retry} className="btn btn-primary btn-sm">
                Retry
              </button>
              <button 
                onClick={() => window.location.href = '/documents'}
                className="btn btn-secondary btn-sm"
              >
                Back to Documents
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};