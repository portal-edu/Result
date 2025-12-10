import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlassCard, GlassButton } from './GlassUI';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <GlassCard className="max-w-md w-full text-center border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              The application encountered an unexpected error. Please try reloading to resolve the issue.
            </p>
            <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg text-xs font-mono text-red-500 text-left mb-6 overflow-auto max-h-32 border border-slate-200 dark:border-slate-800">
                {this.state.error?.message || 'Unknown Error'}
            </div>
            <GlassButton onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20">
              <RefreshCw className="w-4 h-4"/> Reload Application
            </GlassButton>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;