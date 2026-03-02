import React, { useState, useRef, useEffect, useCallback } from "react";

export default function AIChat({ prediction, activeMutations, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm MutationMap AI. Select some mutations and run a prediction, then ask me anything about the results." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Dragging state
  const [pos, setPos] = useState({ x: window.innerWidth - 370, y: 80 });
  const dragRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Drag handlers
  const handleDragStart = useCallback((e) => {
    // Only drag from the header area
    if (e.target.closest("[data-no-drag]")) return;
    isDragging.current = true;
    const rect = dragRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 340, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          prediction,
          activeMutations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dragRef}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: "340px",
        height: "420px",
        background: "rgba(15,23,42,0.95)",
        borderRadius: "12px",
        border: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Draggable header */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "10px 12px",
          cursor: "grab", borderBottom: "1px solid #1e293b", flexShrink: 0,
        }}
      >
        <div style={{
          width: "20px", height: "20px", borderRadius: "6px",
          background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="12" height="14" viewBox="0 0 22 26" fill="none">
            <path d="M5 1C5 1 17 5 17 7C17 9 5 11 5 13C5 15 17 17 17 19C17 21 5 23 5 25" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M17 1C17 1 5 5 5 7C5 9 17 11 17 13C17 15 5 17 5 19C5 21 17 23 17 25" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontSize: "12px", fontWeight: "700" }}>MutationMap AI</span>
        <span style={{ fontSize: "9px", color: "#475569", marginLeft: "auto", marginRight: "8px" }}>Powered by Groq</span>
        <button
          data-no-drag="true"
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "#64748b", cursor: "pointer",
            fontSize: "16px", lineHeight: 1, padding: "2px",
          }}
        >x</button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, minHeight: 0, overflowY: "auto", display: "flex",
          flexDirection: "column", gap: "6px", padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "90%",
              padding: "6px 10px",
              borderRadius: msg.role === "user" ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
              background: msg.role === "user"
                ? "rgba(139,92,246,0.2)"
                : "rgba(30,41,59,0.8)",
              border: msg.role === "user"
                ? "1px solid rgba(139,92,246,0.3)"
                : "1px solid #1e293b",
              fontSize: "11px",
              lineHeight: "1.5",
              color: msg.role === "user" ? "#c4b5fd" : "#94a3b8",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start", padding: "6px 10px", borderRadius: "8px 8px 8px 2px",
            background: "rgba(30,41,59,0.8)", border: "1px solid #1e293b",
            fontSize: "11px", color: "#475569",
          }}>
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "6px", padding: "10px", borderTop: "1px solid #1e293b", flexShrink: 0 }}>
        <input
          data-no-drag="true"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your results..."
          style={{
            flex: 1, padding: "7px 10px", borderRadius: "6px",
            border: "1px solid #334155", background: "#0f172a",
            color: "#e2e8f0", fontSize: "11px", outline: "none",
          }}
        />
        <button
          data-no-drag="true"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "7px 12px", borderRadius: "6px", border: "none",
            background: input.trim() ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "#1e293b",
            color: input.trim() ? "#fff" : "#475569",
            fontSize: "11px", fontWeight: "700", cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
