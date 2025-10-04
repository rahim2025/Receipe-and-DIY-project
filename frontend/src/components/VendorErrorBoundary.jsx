import React from 'react';

class VendorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VendorCard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-red-200">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="font-medium text-gray-900 mb-1">Vendor Display Error</h3>
            <p className="text-sm text-gray-600">Unable to display this vendor</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VendorErrorBoundary;