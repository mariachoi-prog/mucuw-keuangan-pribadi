import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Terjadi kesalahan aplikasi.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Mucuw ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9] p-6">
          <div className="max-w-md w-full rounded-3xl bg-white border border-rose-200 p-6 shadow-xl text-center space-y-3">
            <p className="text-3xl">🧸</p>
            <h1 className="font-display text-lg font-extrabold text-slate-900">
              Ups, terjadi kendala tampilan
            </h1>
            <p className="text-xs text-slate-600 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[42px] rounded-full bg-purple-600 text-white px-5 py-2 text-xs font-bold"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
