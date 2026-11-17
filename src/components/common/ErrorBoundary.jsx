import { Component } from 'react';

// Error boundaries can only be class components.
// Wrap any widget so one crash doesn't take down the whole dashboard.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Widget crashed:', error, info); // TODO: send to a logging service
  }

  render() {
    if (this.state.hasError) return <div className="card state state--error">This widget failed to load.</div>;
    return this.props.children;
  }
}
