import React from "react";

export default function Navbar() {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", maxWidth: "1500px", margin: "0 auto 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "38px", height: "38px",
          background: "linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)",
          borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: "800", color: "#fff",
        }}>MM</div>
        <div>
          <div style={{
            fontSize: "20px", fontWeight: "800",
            background: "linear-gradient(135deg, #ec4899, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>MutationMap</div>
          <div style={{ fontSize: "11px", color: "#64748b", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Cancer Driver Mutation Explorer
          </div>
        </div>
      </div>
      <span style={{
        padding: "5px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "600",
        background: "rgba(236,72,153,0.12)", color: "#f0abfc",
        border: "1px solid rgba(236,72,153,0.25)", letterSpacing: "0.5px",
      }}>Cancer Genomics Track | BioHacks 2026</span>
    </nav>
  );
}
