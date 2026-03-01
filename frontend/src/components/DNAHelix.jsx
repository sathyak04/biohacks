import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const GENE_COLORS = {
  TP53: "#f87171",
  BRCA1: "#a78bfa",
  BRCA2: "#38bdf8",
};

// Fixed helix parameters so all genes look the same
const HELIX_HEIGHT = 20;
const HELIX_RADIUS = 1.2;
const HELIX_TURNS = 10;
const POINTS_PER_TURN = 16;
const TOTAL_POINTS = HELIX_TURNS * POINTS_PER_TURN;

// Build helix geometry data
function buildHelixData(geneData, geneName) {
  if (!geneData) return { spheres: [], tubes: [], rungs: [], mutationMarkers: [], minY: -10, maxY: 10 };

  const strand1 = [];
  const strand2 = [];

  for (let i = 0; i <= TOTAL_POINTS; i++) {
    const t = i / TOTAL_POINTS;
    const angle = t * HELIX_TURNS * Math.PI * 2;
    const y = (t - 0.5) * HELIX_HEIGHT;

    strand1.push(new THREE.Vector3(
      Math.cos(angle) * HELIX_RADIUS,
      y,
      Math.sin(angle) * HELIX_RADIUS
    ));
    strand2.push(new THREE.Vector3(
      Math.cos(angle + Math.PI) * HELIX_RADIUS,
      y,
      Math.sin(angle + Math.PI) * HELIX_RADIUS
    ));
  }

  // Base pair rungs (every few points)
  const rungs = [];
  for (let i = 0; i <= TOTAL_POINTS; i += 3) {
    rungs.push({ start: strand1[i].clone(), end: strand2[i].clone(), idx: i });
  }

  // Map mutations to positions on the helix
  const totalLength = geneData.length;
  const mutationMarkers = geneData.mutations.map((mut) => {
    const t = mut.pos / totalLength;
    const idx = Math.floor(t * TOTAL_POINTS);
    const angle = (idx / TOTAL_POINTS) * HELIX_TURNS * Math.PI * 2;
    const y = (idx / TOTAL_POINTS - 0.5) * HELIX_HEIGHT;

    return {
      position: new THREE.Vector3(
        Math.cos(angle) * HELIX_RADIUS * 1.6,
        y,
        Math.sin(angle) * HELIX_RADIUS * 1.6
      ),
      helixPos: new THREE.Vector3(
        Math.cos(angle) * HELIX_RADIUS,
        y,
        Math.sin(angle) * HELIX_RADIUS
      ),
      mutation: mut,
      id: mut.id,
    };
  });

  // Calculate scroll bounds from actual mutation positions
  const ys = mutationMarkers.map((m) => m.position.y);
  const minY = ys.length > 0 ? Math.min(...ys) : -HELIX_HEIGHT / 2;
  const maxY = ys.length > 0 ? Math.max(...ys) : HELIX_HEIGHT / 2;

  return { strand1, strand2, rungs, mutationMarkers, minY, maxY };
}

// Darken a hex color by a factor (0 = black, 1 = original)
function darkenColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

// Camera controller: smooth vertical scrolling + auto-focus on selected mutation
function CameraController({ targetY }) {
  const { camera } = useThree();
  const currentY = useRef(0);

  useFrame(() => {
    currentY.current += (targetY - currentY.current) * 0.08;
    camera.position.y = currentY.current;
    camera.lookAt(0, currentY.current, 0);
  });

  return null;
}

function HelixModel({ geneData, geneName, activeMutations, selectedMutation, onSelectMutation }) {
  const groupRef = useRef();
  const color = GENE_COLORS[geneName] || "#94a3b8";
  const rungColor = darkenColor(GENE_COLORS[geneName] || "#94a3b8", 0.65);
  const [hovered, setHovered] = useState(null);

  const { strand1, strand2, rungs, mutationMarkers } = useMemo(
    () => buildHelixData(geneData, geneName),
    [geneData, geneName]
  );

  // Slow auto-rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  if (!geneData) return null;

  // Create tube curves
  const curve1 = new THREE.CatmullRomCurve3(strand1);
  const curve2 = new THREE.CatmullRomCurve3(strand2);

  return (
    <group ref={groupRef}>
      {/* Strand 1 */}
      <mesh>
        <tubeGeometry args={[curve1, 200, 0.06, 8, false]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.8} />
      </mesh>

      {/* Strand 2 */}
      <mesh>
        <tubeGeometry args={[curve2, 200, 0.06, 8, false]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.8} />
      </mesh>

      {/* Base pair rungs */}
      {rungs.map((rung, i) => {
        const mid = rung.start.clone().lerp(rung.end, 0.5);
        const dir = rung.end.clone().sub(rung.start);
        const len = dir.length();
        dir.normalize();

        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        return (
          <mesh key={i} position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[0.02, 0.02, len, 4]} />
            <meshStandardMaterial color={rungColor} emissive={rungColor} emissiveIntensity={0.5} transparent opacity={0.8} />
          </mesh>
        );
      })}

      {/* Mutation markers */}
      {mutationMarkers.map((marker) => {
        const key = `${geneName}_${marker.id}`;
        const isActive = activeMutations.includes(key);
        const isSelected = selectedMutation === marker.id;
        const isHovered = hovered === marker.id;
        const isDriver = marker.mutation.driver;

        const markerColor = isActive
          ? "#ec4899"
          : isDriver
          ? "#f59e0b"
          : "#475569";

        const scale = isSelected ? 1.8 : isHovered ? 1.4 : isActive ? 1.2 : 0.8;

        return (
          <group key={marker.id}>
            {/* Line from helix to marker */}
            {(isActive || isSelected || isHovered) && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      marker.helixPos.x, marker.helixPos.y, marker.helixPos.z,
                      marker.position.x, marker.position.y, marker.position.z,
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={markerColor} transparent opacity={0.4} />
              </line>
            )}

            {/* Mutation sphere */}
            <mesh
              position={marker.position}
              scale={scale}
              onClick={(e) => { e.stopPropagation(); onSelectMutation(marker.id); }}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(marker.id); document.body.style.cursor = "pointer"; }}
              onPointerOut={() => { setHovered(null); document.body.style.cursor = "default"; }}
            >
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={isActive || isSelected ? 0.8 : 0.3}
                transparent
                opacity={isActive || isSelected ? 1 : 0.6}
              />
            </mesh>

            {/* Glow sphere */}
            {(isActive || isSelected) && (
              <mesh position={marker.position} scale={scale * 2}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color={markerColor} transparent opacity={0.1} />
              </mesh>
            )}

            {/* Label */}
            {(isHovered || isSelected) && (
              <Html position={[marker.position.x, marker.position.y + 0.4, marker.position.z]} center>
                <div style={{
                  background: "rgba(0,0,0,0.85)", padding: "4px 10px", borderRadius: "6px",
                  fontSize: "11px", fontWeight: "700", color: markerColor, whiteSpace: "nowrap",
                  border: `1px solid ${markerColor}40`, pointerEvents: "none",
                }}>
                  {marker.id} (pos {marker.mutation.pos})
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function DNAHelix({ geneData, geneName, activeMutations, selectedMutation, onSelectMutation }) {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef(null);

  const helixData = useMemo(
    () => buildHelixData(geneData, geneName),
    [geneData, geneName]
  );

  // Reset scroll when gene changes
  useEffect(() => {
    setScrollY(0);
  }, [geneName]);

  // When a mutation is selected, scroll to its Y position
  useEffect(() => {
    if (selectedMutation && helixData.mutationMarkers.length > 0) {
      const marker = helixData.mutationMarkers.find((m) => m.id === selectedMutation);
      if (marker) {
        setScrollY(marker.position.y);
      }
    }
  }, [selectedMutation, helixData.mutationMarkers]);

  // Clamp scroll to the helix bounds (from first mutation to last mutation)
  const clampScroll = (val) => {
    const min = helixData.minY - 1;
    const max = helixData.maxY + 1;
    return Math.max(min, Math.min(max, val));
  };

  // Handle mouse wheel for vertical scrolling
  const handleWheel = (e) => {
    e.preventDefault();
    setScrollY((prev) => clampScroll(prev - e.deltaY * 0.01));
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      style={{
        borderRadius: "16px", overflow: "hidden", border: "1px solid #1e293b",
        background: "#050a18", minHeight: "500px", position: "relative",
      }}
    >
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }} style={{ background: "#050a18" }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-10, -5, 5]} intensity={0.4} color="#8b5cf6" />
        <pointLight position={[5, -10, -5]} intensity={0.3} color="#ec4899" />

        <CameraController targetY={scrollY} />

        <HelixModel
          geneData={geneData}
          geneName={geneName}
          activeMutations={activeMutations}
          selectedMutation={selectedMutation}
          onSelectMutation={onSelectMutation}
        />
      </Canvas>

      {/* Gene label overlay */}
      {geneData && (
        <div style={{
          position: "absolute", bottom: "16px", left: "16px", pointerEvents: "none",
        }}>
          <div style={{
            fontSize: "18px", fontWeight: "800",
            color: GENE_COLORS[geneName] || "#94a3b8",
            textShadow: "0 0 20px rgba(0,0,0,0.8)",
          }}>{geneName}</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            {geneData.full_name} | {geneData.length} amino acids | Chr {geneData.chromosome}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: "absolute", top: "12px", right: "12px", pointerEvents: "none",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        {[
          { color: "#f59e0b", label: "Driver mutation" },
          { color: "#475569", label: "Passenger" },
          { color: "#ec4899", label: "Selected" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
            <span style={{ fontSize: "10px", color: "#64748b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        position: "absolute", bottom: "12px", right: "12px", pointerEvents: "none",
        fontSize: "10px", color: "#334155",
      }}>
        Scroll to navigate | Click mutations to inspect
      </div>
    </div>
  );
}
