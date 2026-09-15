import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-rose-400">⚠️ એપ્લિકેશનમાં ક્ષતિ (Runtime Error) આવી છે</h2>
            <p className="text-xs text-neutral-300 font-mono bg-neutral-900 p-3 rounded-xl overflow-auto max-h-40">
              {this.state.error && this.state.error.toString()}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2 px-4 rounded-xl text-xs cursor-pointer transition-all shadow"
              >
                🔄 પેજ રિફ્રેશ કરો (Reload)
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-black py-2 px-4 rounded-xl text-xs cursor-pointer transition-all"
              >
                🧹 કેશ રીસેટ કરો (Clear Cache & Reload)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
