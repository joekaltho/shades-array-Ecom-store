import { Component, type ReactNode } from 'react';

interface State {
  failed: boolean;
}

/** Last line of defence: a render crash shows a message instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-neutral-600">Please reload the page. If it keeps happening, message us on WhatsApp.</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Reload
        </button>
      </div>
    );
  }
}
