import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-amber-900 mb-2">發生錯誤</h2>
              <p className="text-amber-700 mb-4">頁面遇到問題，請重新整理後再試。</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                重新整理
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
