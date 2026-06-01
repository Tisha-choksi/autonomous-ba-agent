"use client";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div style={{
                    padding: "40px", textAlign: "center", color: "#EF4444",
                    background: "rgba(239,68,68,0.05)", borderRadius: 12,
                    border: "1px solid rgba(239,68,68,0.2)", margin: 20
                }}>
                    <h2 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h2>
                    <p style={{ color: "#94A3B8", fontSize: 13 }}>
                        {this.state.error?.message || "An unexpected error occurred"}
                    </p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            marginTop: 16, padding: "8px 20px", borderRadius: 8,
                            border: "1px solid rgba(239,68,68,0.3)", background: "transparent",
                            color: "#EF4444", cursor: "pointer", fontSize: 13
                        }}>
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
