import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import GeneSelector from "./components/GeneSelector";
import DNAHelix from "./components/DNAHelix";
import MutationPanel from "./components/MutationPanel";
import PredictionPanel from "./components/PredictionPanel";

const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #050a18;
    color: #e2e8f0;
    min-height: 100vh;
    overflow-x: hidden;
  }
  .app-container {
    max-width: 1500px;
    margin: 0 auto;
    padding: 0 20px 48px;
  }
  .main-layout {
    display: grid;
    grid-template-columns: 280px 1fr 340px;
    gap: 20px;
    min-height: calc(100vh - 80px);
  }
  .right-panels {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (max-width: 1200px) {
    .main-layout { grid-template-columns: 1fr; }
  }
`;

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [selectedGene, setSelectedGene] = useState("TP53");
  const [selectedMutation, setSelectedMutation] = useState(null);
  const [activeMutations, setActiveMutations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(console.error);
  }, []);

  const toggleMutation = (gene, mutId) => {
    const key = `${gene}_${mutId}`;
    setActiveMutations((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const handlePredict = async () => {
    if (activeMutations.length === 0) return;
    setPredicting(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutations: activeMutations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPrediction(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setPredicting(false);
    }
  };

  const geneData = catalog?.[selectedGene];

  return (
    <>
      <style>{globalStyles}</style>
      <Navbar />
      <div className="app-container">
        <div className="main-layout">
          {/* Left — Gene selector + mutation list */}
          <div>
            <GeneSelector
              genes={catalog ? Object.keys(catalog) : []}
              selected={selectedGene}
              onSelect={(g) => { setSelectedGene(g); setSelectedMutation(null); }}
              catalog={catalog}
            />
            <MutationPanel
              gene={selectedGene}
              geneData={geneData}
              activeMutations={activeMutations}
              onToggle={toggleMutation}
              onSelect={setSelectedMutation}
              selectedMutation={selectedMutation}
            />
          </div>

          {/* Center — 3D DNA Helix */}
          <DNAHelix
            geneData={geneData}
            geneName={selectedGene}
            activeMutations={activeMutations}
            selectedMutation={selectedMutation}
            onSelectMutation={setSelectedMutation}
          />

          {/* Right — Mutation detail + Prediction */}
          <div className="right-panels">
            {selectedMutation && geneData && (
              <MutationDetail
                mutation={geneData.mutations.find((m) => m.id === selectedMutation)}
                gene={selectedGene}
              />
            )}
            <PredictionPanel
              activeMutations={activeMutations}
              prediction={prediction}
              predicting={predicting}
              onPredict={handlePredict}
              onClear={() => { setActiveMutations([]); setPrediction(null); }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function MutationDetail({ mutation, gene }) {
  if (!mutation) return null;

  const styles = {
    card: {
      background: "rgba(15,23,42,0.9)",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #1e293b",
    },
    title: { fontSize: "16px", fontWeight: "700", marginBottom: "4px", color: "#f0abfc" },
    subtitle: { fontSize: "12px", color: "#64748b", marginBottom: "12px" },
    desc: { fontSize: "13px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "12px" },
    tag: {
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: "600",
      marginRight: "4px",
      marginBottom: "4px",
    },
    driverTag: {
      background: "rgba(239,68,68,0.15)",
      color: "#f87171",
    },
    cancerTag: {
      background: "rgba(139,92,246,0.15)",
      color: "#a78bfa",
    },
    stat: { fontSize: "12px", color: "#64748b", marginTop: "8px" },
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>{gene} {mutation.id}</div>
      <div style={styles.subtitle}>
        Position {mutation.pos} | {mutation.ref} → {mutation.alt}
      </div>
      <div style={styles.desc}>{mutation.desc}</div>
      <div>
        {mutation.driver && <span style={{ ...styles.tag, ...styles.driverTag }}>Driver Mutation</span>}
        {mutation.cancers.map((c) => (
          <span key={c} style={{ ...styles.tag, ...styles.cancerTag }}>{c}</span>
        ))}
      </div>
      <div style={styles.stat}>Frequency: {(mutation.freq * 100).toFixed(1)}% of {gene} mutations</div>
    </div>
  );
}
