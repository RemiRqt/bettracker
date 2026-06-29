"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            Une erreur est survenue
          </h2>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  );
}
