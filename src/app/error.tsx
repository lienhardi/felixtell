"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Something went wrong</h1>
      <p style={{ marginBottom: 24 }}>{error.message}</p>
      <button
        style={{
          padding: '8px 24px',
          background: '#F6D365',
          color: '#222',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: 'pointer'
        }}
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
} 