import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la UI alternativa.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 min-h-screen flex flex-col items-center justify-center">
          <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-500">⚠️</span> Algo ha fallado
            </h1>
            <p className="mb-4 text-neutral-700">La aplicación se encontró con un error inesperado:</p>
            <pre className="bg-red-100 p-4 rounded-lg overflow-auto text-sm mb-4 border border-red-200">
              {this.state.error?.toString()}
            </pre>
            <details className="whitespace-pre-wrap text-xs text-neutral-600 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <summary className="font-bold cursor-pointer mb-2 text-neutral-800">Ver traza completa</summary>
              {this.state.errorInfo?.componentStack}
            </details>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
