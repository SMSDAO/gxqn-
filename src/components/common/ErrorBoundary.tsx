import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorMonitoring } from '../../services/errorMonitoring';
import { GlassCard } from './GlassCard';
import { AlertTriangle, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  reportedId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reportedId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Capture in Sentry/LogRocket Error Monitoring system
    const monitored = errorMonitoring.captureException(error, {
      category: 'CLIENT_UI_ERROR',
      severity: 'ERROR',
      source: 'client',
      handled: true,
      tags: {
        component: this.props.componentName || 'GenericComponent',
        componentStack: errorInfo.componentStack?.slice(0, 300) || '',
      },
    });

    this.setState({ reportedId: monitored.id });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reportedId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto my-8">
          <GlassCard level={3} glow="red" className="p-6 border-red-500/40 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
              {this.props.fallbackTitle || 'Component Execution Recovered'}
            </h3>

            <p className="text-xs text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
              A UI rendering exception was isolated by the GXQ Enterprise Error Boundary. The incident has been recorded in the Sentry telemetry engine.
            </p>

            {this.state.reportedId && (
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[11px] font-mono text-red-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Captured in Sentry: <strong className="text-white">{this.state.reportedId}</strong></span>
              </div>
            )}

            {this.state.error && (
              <div className="mt-5 p-3.5 rounded-xl bg-black/70 border border-white/10 text-left font-mono text-[11px] text-red-400 overflow-x-auto max-h-36">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-red-400" />
                  <span>Stack Trace Context:</span>
                </div>
                <div>{this.state.error.message}</div>
                <div className="text-gray-500 text-[10px] mt-1 whitespace-pre-wrap">
                  {this.state.error.stack?.split('\n').slice(0, 4).join('\n')}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A8FF] hover:bg-[#0090dd] text-black font-bold text-xs font-mono transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Component</span>
              </button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
