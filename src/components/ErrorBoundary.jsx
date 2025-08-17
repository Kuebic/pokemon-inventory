import { Component } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
                Oops! Something went wrong
              </h1>
              
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe in your browser's storage.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Error details (development only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-x-auto">
                    <p className="text-red-600 dark:text-red-400 mb-2">
                      {this.state.error.toString()}
                    </p>
                    <pre className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;