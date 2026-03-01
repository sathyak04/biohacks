import React, { useState } from "react";

const GENE_COLORS = {
  TP53: "#f87171",
  BRCA1: "#a78bfa",
  BRCA2: "#38bdf8",
  KRAS: "#f59e0b",
  BRAF: "#22c55e",
  PIK3CA: "#ec4899",
};

export default function GeneSelector({ genes, selected, onSelect, catalog, activeMutations }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      background: "rgba(15,23,42,0.9)", borderRadius: "10px", padding: "10px",
      border: "1px solid #1e293b", marginBottom: "8px",
    }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>
            Select Gene
          </div>
          <div style={{ fontSize: "9px", color: "#334155" }}>
            6 clinically significant cancer genes from COSMIC
          </div>
        </div>
        <div style={{ color: "#64748b", fontSize: "12px", marginLeft: "10px" }}>
          {isExpanded ? "▲" : "▼"}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
        {(isExpanded ? genes : (selected ? [selected] : [])).map((g) => {
          const isActive = g === selected;
          const color = GENE_COLORS[g] || "#94a3b8";
          const info = catalog?.[g];
          const selectedCount = (activeMutations || []).filter((m) => m.startsWith(g + "_")).length;
          return (
            <button
              key={g}
              onClick={() => {
                if (isExpanded) {
                  onSelect(g);
                  setIsExpanded(false);
                } else {
                  setIsExpanded(true);
                }
              }}
              style={{
                padding: "7px 10px", borderRadius: "6px", border: "none", cursor: "pointer",
                background: isActive ? `${color}15` : "transparent",
                borderLeft: isActive ? `3px solid ${color}` : "3px solid transparent",
                textAlign: "left", transition: "all 0.15s",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: isActive ? color : "#94a3b8" }}>{g}</span>
                  {selectedCount > 0 && (
                    <span style={{
                      padding: "1px 6px", borderRadius: "8px", fontSize: "9px", fontWeight: "700",
                      background: `${color}25`, color: color, lineHeight: "1.4",
                    }}>{selectedCount} selected</span>
                  )}
                </div>
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
