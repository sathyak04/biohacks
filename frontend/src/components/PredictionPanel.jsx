import React from "react";

const CANCER_COLORS = {
  breast: "#ec4899", colorectal: "#f97316", ovarian: "#a78bfa", lung: "#64748b",
  brain: "#06b6d4", liver: "#22c55e", pancreatic: "#eab308", bladder: "#f87171",
  skin: "#fb923c", esophageal: "#94a3b8", prostate: "#38bdf8",
};

export default function PredictionPanel({ activeMutations, prediction, predicting, onPredict, onClear }) {
  return (
    <div style={{
      background: "rgba(15,23,42,0.9)", borderRadius: "12px", padding: "20px",
      border: "1px solid #1e293b", flex: 1,
    }}>
      <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>Cancer Type Predictor</div>
      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>
        Select mutations on the left, then predict which cancer type they indicate
      </div>

      {/* Active mutations */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: "600", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
          Selected ({activeMutations.length})
        </div>
        {activeMutations.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#334155", fontStyle: "italic" }}>
            No mutations selected — check boxes on the left panel
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {activeMutations.map((m) => (
              <span key={m} style={{
                padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600",
                background: "rgba(236,72,153,0.12)", color: "#f0abfc",
              }}>{m}</span>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={onPredict}
          disabled={predicting || activeMutations.length === 0}
          style={{
            flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: activeMutations.length > 0
              ? "linear-gradient(135deg, #ec4899, #8b5cf6)"
              : "#1e293b",
            color: activeMutations.length > 0 ? "#fff" : "#475569",
            fontSize: "13px", fontWeight: "700",
            opacity: predicting ? 0.6 : 1,
          }}
        >
          {predicting ? "Analyzing..." : "Predict Cancer Type"}
        </button>
        <button
          onClick={onClear}
          style={{
            padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155",
            background: "transparent", color: "#94a3b8", cursor: "pointer",
            fontSize: "12px",
          }}
        >Clear</button>
      </div>

      {/* Results */}
      {prediction && (
        <div>
          {/* Top prediction */}
          <div style={{
            background: `${CANCER_COLORS[prediction.top_prediction] || "#8b5cf6"}12`,
            border: `1px solid ${CANCER_COLORS[prediction.top_prediction] || "#8b5cf6"}30`,
            borderRadius: "10px", padding: "14px", marginBottom: "12px", textAlign: "center",
          }}>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
              Most Likely Cancer Type
            </div>
            <div style={{
              fontSize: "20px", fontWeight: "800", textTransform: "capitalize",
              color: CANCER_COLORS[prediction.top_prediction] || "#a78bfa",
            }}>
              {prediction.top_prediction}
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#e2e8f0" }}>
              {prediction.top_probability}%
            </div>
          </div>

          {/* All predictions */}
          <div style={{ fontSize: "10px", fontWeight: "600", color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
            All Probabilities
          </div>
          {prediction.all_predictions
            .filter((p) => p.probability > 0.5)
            .map((p) => {
              const color = CANCER_COLORS[p.cancer_type] || "#64748b";
              return (
                <div key={p.cancer_type} style={{
                  display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px",
                }}>
                  <span style={{
                    fontSize: "11px", color: "#94a3b8", width: "70px", textAlign: "right",
                    textTransform: "capitalize",
                  }}>{p.cancer_type}</span>
                  <div style={{
                    flex: 1, height: "6px", background: "#1e293b", borderRadius: "3px", overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${p.probability}%`, height: "100%", background: color,
                      borderRadius: "3px", transition: "width 0.5s",
                    }} />
                  </div>
                  <span style={{ fontSize: "11px", color, fontWeight: "600", width: "35px" }}>
                    {p.probability}%
                  </span>
                </div>
              );
            })}

          <div style={{
            fontSize: "10px", color: "#475569", textAlign: "center", marginTop: "12px",
          }}>
            Model accuracy: {(prediction.model_accuracy * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}
