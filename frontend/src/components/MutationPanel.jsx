import React from "react";

const GENE_COLORS = { TP53: "#f87171", BRCA1: "#a78bfa", BRCA2: "#38bdf8" };

export default function MutationPanel({ gene, geneData, activeMutations, onToggle, onSelect, selectedMutation }) {
  if (!geneData) {
    return (
      <div style={{ background: "rgba(15,23,42,0.9)", borderRadius: "12px", padding: "20px", border: "1px solid #1e293b" }}>
        <div style={{ color: "#475569", fontSize: "13px" }}>Loading mutations...</div>
      </div>
    );
  }

  const color = GENE_COLORS[gene] || "#94a3b8";

  return (
    <div style={{
      background: "rgba(15,23,42,0.9)", borderRadius: "10px", padding: "10px",
      border: "1px solid #1e293b", flex: "0 1 auto", minHeight: 0, overflowY: "auto",
    }}>
      <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
        {gene} Mutations
      </div>
      <div style={{ fontSize: "10px", color: "#475569", marginBottom: "12px" }}>{geneData.role}</div>

      {geneData.mutations.map((mut) => {
        const key = `${gene}_${mut.id}`;
        const isActive = activeMutations.includes(key);
        const isSelected = selectedMutation === mut.id;

        return (
          <div
            key={mut.id}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 10px", borderRadius: "6px", marginBottom: "4px",
              background: isSelected ? `${color}12` : "transparent",
              cursor: "pointer", transition: "all 0.15s",
              borderLeft: isSelected ? `2px solid ${color}` : "2px solid transparent",
            }}
            onClick={() => onSelect(mut.id)}
          >
            {/* Toggle checkbox */}
            <div
              onClick={(e) => { e.stopPropagation(); onToggle(gene, mut.id); }}
              style={{
                width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0,
                border: isActive ? `2px solid ${color}` : "2px solid #334155",
                background: isActive ? `${color}30` : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "10px", color,
              }}
            >
              {isActive && "✓"}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: isActive ? color : "#94a3b8" }}>
                  {mut.id}
                </span>
                {mut.driver && (
                  <span style={{
                    fontSize: "9px", padding: "1px 5px", borderRadius: "3px",
                    background: "rgba(239,68,68,0.15)", color: "#f87171",
                  }}>DRIVER</span>
                )}
              </div>
              <div style={{ fontSize: "10px", color: "#475569" }}>
                pos {mut.pos} | {mut.cancers.slice(0, 2).join(", ")}
                {mut.cancers.length > 2 && ` +${mut.cancers.length - 2}`}
              </div>
            </div>

            {/* Frequency bar */}
            <div style={{ width: "40px" }}>
              <div style={{
                height: "3px", background: "#1e293b", borderRadius: "2px", overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.min(100, mut.freq * 1000)}%`,
                  height: "100%", background: color, borderRadius: "2px",
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
