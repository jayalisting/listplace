"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any): State {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            typeof error === "string"
              ? error
              : typeof error === "object" && error !== null && "message" in error
              ? String((error as any).message)
              : typeof error === "object" && error !== null && "type" in error
              ? `Event error (${(error as any).type})`
              : "An unexpected error occurred."
          )
    return { hasError: true, error: normalizedError }
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Admin view error caught by boundary:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-3xl text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {this.props.fallbackTitle || "Something went wrong loading this view"}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 font-mono mt-1 break-words">
              {this.state.error?.message || "An unexpected render error occurred."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              onClick={this.handleReset}
              className="bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-xs rounded-xl"
            >
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

