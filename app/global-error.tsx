'use client'

import React from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong!</h2>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        We apologize for the inconvenience. A critical error occurred.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#B8071C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
