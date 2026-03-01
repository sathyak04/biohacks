import React from "react";

const GENE_COLORS = {
  TP53: "#f87171",
  BRCA1: "#a78bfa",
  BRCA2: "#38bdf8",
};

export default function GeneSelector({ genes, selected, onSelect, catalog }) {
  return (
    <div style={{
      background: "rgba(15,23,42,0.9)", borderRadius: "12px", padding: "16px",
      border: "1px solid #1e293b", marginBottom: "12px",
    }}>
      <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
        Select Gene
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {genes.map((g) => {
          const isActive = g === selected;
          const color = GENE_COLORS[g] || "#94a3b8";
          const info = catalog?.[g];
          return (
            <button
              key={g}
              onClick={() => onSelect(g)}
              style={{
                padding: "10px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                background: isActive ? `${color}15` : "transparent",
                borderLeft: isActive ? `3px solid ${color}` : "3px solid transparent",
                textAlign: "left", transition: "all 0.15s",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: isActive ? color : "#94a3b8" }}>{g}</div>
                {info && (
                  <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                    Chr {info.chromosome} | {info.mutations.length} mutations
                  </div>
                )}
              </div>
              {info && (
                <div style={{ fontSize: "10px", color: "#475569" }}>
                  {info.length} aa
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
