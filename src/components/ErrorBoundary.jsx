import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F1E6' }}>
          <div className="bg-white rounded-[20px] p-10 max-w-md text-center shadow-lg border border-[#E7E2D8]">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-[#2B2B2B] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#9C9C9C] mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="px-6 py-3 rounded-xl bg-[#2B2B2B] text-white text-sm font-semibold hover:scale-105 transition-transform">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

// Loading component
export const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-[#E7E2D8] border-t-[#F3CC4D] rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: '3px' }} />
      <p className="text-sm text-[#9C9C9C]">Loading...</p>
    </div>
  </div>
);

// Empty state
export const EmptyState = ({ message = 'No data found', action, actionLabel }) => (
  <div className="card text-center py-12">
    <p className="text-[#9C9C9C] mb-4">{message}</p>
    {action && <button onClick={action} className="btn btn-primary">{actionLabel || 'Add New'}</button>}
  </div>
);
