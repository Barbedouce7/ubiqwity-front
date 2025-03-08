import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.log('ErrorBoundary: Caught error in getDerivedStateFromError:', error);
    return { hasError: true, error }; // Conserver l'erreur dans l'état
  }

  componentDidCatch(error, errorInfo) {
    console.log('ErrorBoundary: componentDidCatch - error:', error, 'errorInfo:', errorInfo);
    this.setState({ error, errorInfo }); // Mettre à jour l'état avec l'erreur et les infos
  }

  render() {
    if (this.state.hasError) {
      console.log('ErrorBoundary: Rendering error state - error:', this.state.error);
      const errorMessage = this.state.error
        ? typeof this.state.error === 'object' && '@value' in this.state.error
          ? String(this.state.error['@value'])
          : String(this.state.error)
        : 'Unknown error';
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {errorMessage}
            <br />
            {this.state.errorInfo?.componentStack || 'No stack trace available'}
          </details>
        </div>
      );
    }
    //console.log('ErrorBoundary: Rendering children');
    return this.props.children;
  }
}

export default ErrorBoundary;