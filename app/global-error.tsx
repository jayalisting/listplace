'use client'

import React, { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global layout error captured:', error)
  }, [error])

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as any).message)
      : typeof error === 'object' && error !== null && 'type' in error
      ? `Event error (${(error as any).type})`
      : String(error || 'An unexpected error occurred.')

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-8 shadow-xl space-y-4">
          <h2 className="text-xl font-bold">Application Error</h2>
          <p className="text-xs text-rose-700 font-mono bg-rose-50 p-3 rounded-xl border border-rose-200">
            {message}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-rose-900 text-white font-bold text-xs rounded-xl hover:bg-rose-800 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="px-4 py-2 border border-stone-300 text-xs rounded-xl hover:bg-stone-50 transition"
            >
              Return to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

