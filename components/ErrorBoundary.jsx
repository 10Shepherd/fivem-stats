import React from "react";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid rgba(224,85,85,0.2)",
            borderRadius: 16,
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              letterSpacing: "0.08em",
              color: "var(--red)",
              marginBottom: 8,
            }}
          >
            COMPONENT ERROR
          </div>
          <p
            style={{
              ...MONO,
              fontSize: 11,
              color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            something went wrong rendering this section
          </p>
          <button
            className="btn"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
