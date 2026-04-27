/**
 * 全域錯誤邊界
 * 用途：把 React render 中拋出的例外攔下來、顯示友善訊息，
 *       並把 stack trace 同時印到 console，避免「整頁空白」這種沒線索的狀況。
 */
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  info: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught error:', error);
    console.error('[ErrorBoundary] component stack:', info.componentStack);
    this.setState({ info });
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
          <div className="max-w-[720px] w-full bg-white rounded-[16px] p-[24px] shadow">
            <h2 className="text-[20px] font-medium text-[#f44336] mb-[12px]">頁面發生錯誤</h2>
            <p className="text-[14px] text-[#383838] mb-[12px]">
              {this.state.error.message || String(this.state.error)}
            </p>
            <pre className="text-[12px] text-[#6e6e6e] bg-[#f5f5f5] p-[12px] rounded-[8px] overflow-auto max-h-[280px] whitespace-pre-wrap">
{this.state.error.stack}
{this.state.info?.componentStack}
            </pre>
            <div className="mt-[16px] flex gap-[8px]">
              <button
                onClick={this.handleReset}
                className="px-[16px] h-[40px] rounded-[10px] bg-[#0f6beb] text-white text-[14px] hover:bg-[#0d5bcc]"
              >
                重試
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-[16px] h-[40px] rounded-[10px] border border-[#dddddd] text-[#6e6e6e] text-[14px] hover:bg-[#f5f5f5]"
              >
                重新整理
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
