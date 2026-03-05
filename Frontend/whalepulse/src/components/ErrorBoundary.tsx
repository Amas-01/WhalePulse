"use client"

import React from "react";

type Props = { children: React.ReactNode };

export default class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // TODO: send to telemetry
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl text-[#ff3d6b]">Something went wrong</h2>
            <p className="text-sm text-[#4a7fa5]">Try reloading or reconnecting to the SDK.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
