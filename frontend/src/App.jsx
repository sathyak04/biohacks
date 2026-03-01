import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import GeneSelector from "./components/GeneSelector";
import DNAHelix from "./components/DNAHelix";
import MutationPanel from "./components/MutationPanel";
import PredictionPanel from "./components/PredictionPanel";
import AIChat from "./components/AIChat";

const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #050a18;
    color: #e2e8f0;
    height: 100vh;
    overflow: hidden;
  }
  #root { height: 100vh; display: flex; flex-direction: column; }
  .app-container {
    max-width: 1500px;
    margin: 0 auto;
    padding: 0 16px 8px;
    flex: 1;
    min-height: 0;
    width: 100%;
  }
  .main-layout {
    display: grid;
    grid-template-columns: 260px 1fr 300px;
    gap: 12px;
    height: 100%;
  }
  .left-panels {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .right-panels {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    overflow-y: auto;
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);

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
      setChatKey((k) => k + 1);
      setChatOpen(false);
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
          <div className="left-panels">
            <GeneSelector
              genes={catalog ? Object.keys(catalog) : []}
              selected={selectedGene}
              onSelect={(g) => { setSelectedGene(g); setSelectedMutation(null); }}
              catalog={catalog}
              activeMutations={activeMutations}
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

          {/* Center — 3D DNA Helix with mutation detail overlay */}
          <DNAHelix
            geneData={geneData}
            geneName={selectedGene}
            activeMutations={activeMutations}
            selectedMutation={selectedMutation}
            onSelectMutation={setSelectedMutation}
            mutationDetail={selectedMutation && geneData
              ? { mutation: geneData.mutations.find((m) => m.id === selectedMutation), gene: selectedGene }
              : null
            }
          />

          {/* Right — Prediction */}
          <div className="right-panels">
            <PredictionPanel
              activeMutations={activeMutations}
              prediction={prediction}
              predicting={predicting}
              onPredict={handlePredict}
              onClear={() => { setActiveMutations([]); setPrediction(null); setChatOpen(false); setChatKey((k) => k + 1); }}
              onAskAI={() => setChatOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Floating draggable AI Chat panel */}
      <AIChat
        key={chatKey}
        prediction={prediction}
        activeMutations={activeMutations}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </>
  );
}

