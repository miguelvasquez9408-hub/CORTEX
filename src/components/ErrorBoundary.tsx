import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono p-10">
                    <div className="border border-red-500 p-6 rounded bg-red-900/10 max-w-2xl">
                        <h1 className="text-2xl font-bold mb-4">SYSTEM FAILURE (Runtime Error)</h1>
                        <pre className="whitespace-pre-wrap break-words bg-black/50 p-4 rounded text-sm">
                            {this.state.error?.message}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 border border-red-500 hover:bg-red-500 hover:text-black transition-colors"
                        >
                            REBOOT SYSTEM
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
