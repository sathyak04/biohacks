import React from "react";

export default function Navbar() {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 16px", maxWidth: "1500px", margin: "0 auto 6px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "38px", height: "38px",
          background: "linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)",
          borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
            {/* DNA double helix */}
            <path d="M5 1C5 1 17 5 17 7C17 9 5 11 5 13C5 15 17 17 17 19C17 21 5 23 5 25" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M17 1C17 1 5 5 5 7C5 9 17 11 17 13C17 15 5 17 5 19C5 21 17 23 17 25" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
            {/* Rungs */}
            <line x1="7" y1="4" x2="15" y2="4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="7" x2="16" y2="7" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="10" x2="15" y2="10" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="13" x2="16" y2="13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="16" x2="15" y2="16" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="19" x2="16" y2="19" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="22" x2="15" y2="22" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
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
    </nav>
  );
}
