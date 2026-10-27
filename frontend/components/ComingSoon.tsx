"use client";

import { useRouter } from "next/navigation";

export default function ComingSoon({ title }: { title: string }) {
  const router = useRouter();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: 12, textAlign: "center",
      fontFamily: "var(--font-body)",
    }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, color: "var(--text-primary)" }}>{title}</h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)" }}>This section is coming soon.</p>
      <button
        onClick={() => router.push("/assignments")}
        style={{
          marginTop: 8, background: "var(--text-primary)", color: "white",
          border: "none", borderRadius: 12, padding: "12px 24px",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}
      >
        Go to Assignments
      </button>
    </div>
  );
}