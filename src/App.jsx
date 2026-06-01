import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  PASTE YOUR FREE GROQ API KEY HERE
//  Get it free in 2 min → console.groq.com
// ─────────────────────────────────────────────
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_MODEL = "llama3-70b-8192";

const MODES = [
  { id: "apex",    label: "APEX",    sub: "Billionaire Mode",      color: "#C9A84C", glow: "#C9A84C40" },
  { id: "balance", label: "BALANCE", sub: "Middle Class Mode",     color: "#4C9AC9", glow: "#4C9AC940" },
  { id: "hustle",  label: "HUSTLE",  sub: "Upward Mobility Mode",  color: "#C94C6E", glow: "#C94C6E40" },
];

const PILLARS = [
  { id: "nav",     icon: "⚡", label: "EXECUTE", desc: "Zero-Friction Navigation" },
  { id: "finance", icon: "◈",  label: "WEALTH",  desc: "Financial & Skill Guidance" },
  { id: "focus",   icon: "◎",  label: "FOCUS",   desc: "Attention Management" },
];

const SYSTEM_PROMPTS = {
  apex: {
    nav:     "You are VORTA — an elite executive AI for billionaires. Give hyper-efficient, no-fluff action steps. Think like a world-class chief of staff. Be direct, sharp, and commanding.",
    finance: "You are VORTA — a wealth intelligence engine for ultra-high-net-worth individuals. Discuss macro trends, portfolio protection, deal flow, and wealth preservation with sophistication.",
    focus:   "You are VORTA — an elite focus coach for billionaires. Help protect attention, schedule deep work blocks, filter noise, and maintain peak cognitive performance. Be direct and powerful.",
  },
  balance: {
    nav:     "You are VORTA — a smart life assistant for busy professionals. Help accomplish daily tasks efficiently — work, family, errands. Be warm, practical, and time-aware.",
    finance: "You are VORTA — a financial coach for middle-class users. Help with budgeting, tax strategies, subscription audits, side hustles, and savings goals. Be encouraging and practical.",
    focus:   "You are VORTA — a work-life balance coach. Help manage stress, reclaim family time, avoid burnout, and maintain mental wellness. Be empathetic and actionable.",
  },
  hustle: {
    nav:     "You are VORTA — a hustle navigator for people building from zero. Find opportunities, shortcuts, and free resources to level up fast. Be energetic, real, and street-smart.",
    finance: "You are VORTA — an upward mobility engine. Give free education paths, income opportunities, micro-budgeting strategies, and skill-building roadmaps. Be a world-class free advisor.",
    focus:   "You are VORTA — a motivation and discipline engine for hustlers. Help stay locked in, beat distraction, build iron discipline, and maintain the mindset to escape survival mode.",
  },
};

const QUICK_ACTIONS = {
  apex:    ["Optimize my schedule today", "Analyze a macro trend", "Help me make a big decision", "Protect my focus time"],
  balance: ["Plan my week efficiently", "Review my monthly budget", "Find work-life balance", "Deal with a stressful situation"],
  hustle:  ["Find income opportunities now", "Teach me a high-value skill", "Build me a micro-budget", "Keep me focused and motivated"],
};

// ── Floating particles background
function Particles({ color }) {
  const pts = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      dur: Math.random() * 18 + 12,
      delay: Math.random() * 8,
      op: Math.random() * 0.35 + 0.08,
    }))
  ).current;

  return (
    <>
      {pts.map((p) => (
        <div key={p.id} style={{
          position: "fixed", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: color, opacity: p.op, pointerEvents: "none", zIndex: 0,
          animation: `vFloat ${p.dur}s ease-in-out ${p.delay}s infinite`,
          transition: "background 1s ease",
        }} />
      ))}
    </>
  );
}

// ── Typing dots
function Typing() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "10px 14px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#fff3",
          animation: `vBounce 1.1s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Single chat bubble
function Bubble({ msg, accent }) {
  const me = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 12, animation: "vUp 0.3s ease forwards" }}>
      <div style={{
        maxWidth: "80%", padding: "11px 15px",
        borderRadius: me ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: me ? `linear-gradient(135deg,${accent}cc,${accent}88)` : "rgba(255,255,255,0.06)",
        border: me ? "none" : "1px solid rgba(255,255,255,0.08)",
        fontSize: 14, lineHeight: 1.65, color: "#f0f0f0",
        backdropFilter: "blur(8px)", whiteSpace: "pre-wrap",
      }}>{msg.content}</div>
    </div>
  );
}

export default function Vorta() {
  const [screen, setScreen]         = useState("splash");   // splash | modes | pillars | chat
  const [modeId, setModeId]         = useState(null);
  const [pillarId, setPillarId]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [apiKey, setApiKey]         = useState(GROQ_API_KEY);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const mode   = MODES.find((m) => m.id === modeId);
  const pillar = PILLARS.find((p) => p.id === pillarId);
  const accent = mode?.color || "#C9A84C";
  const glow   = mode?.glow  || "#C9A84C40";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const openPillar = (pid) => {
    setPillarId(pid);
    const p = PILLARS.find((x) => x.id === pid);
    setMessages([{ role: "assistant", content: `VORTA ${p.label} online.\n\nI'm your ${mode.sub} intelligence. What do you need?` }]);
    setScreen("chat");
  };

  const send = async (text) => {
    const txt = (text || input).trim();
    if (!txt || loading) return;
    setInput("");

    if (!apiKey || apiKey === "YOUR_GROQ_API_KEY_HERE") {
      setShowKeyInput(true);
      return;
    }

    const next = [...messages, { role: "user", content: txt }];
    setMessages(next);
    setLoading(true);

    const sys = SYSTEM_PROMPTS[modeId]?.[pillarId] || "You are VORTA, an AI life OS. Be sharp and genuinely helpful.";

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 800,
          messages: [{ role: "system", content: sys }, ...next.map((m) => ({ role: m.role, content: m.content }))],
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Something went wrong. Check your API key.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Connection error. Check your internet or API key." }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  // ── Styles
  const S = {
    root: {
      minHeight: "100vh", background: "#050508",
      fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
      color: "#f0f0f0", overflow: "hidden", position: "relative",
    },
    ambient: {
      position: "fixed", top: "15%", left: "50%", transform: "translateX(-50%)",
      width: 480, height: 480, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      background: `radial-gradient(circle,${glow} 0%,transparent 70%)`,
      animation: "vPulse 4s ease-in-out infinite", transition: "background 1s ease",
    },
    header: {
      padding: "22px 24px 0", display: "flex",
      alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2,
    },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoOrb: {
      width: 30, height: 30, borderRadius: "50%",
      background: `radial-gradient(circle,${accent} 0%,transparent 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 800, fontFamily: "'Syne',sans-serif",
      boxShadow: `0 0 14px ${glow}`, transition: "all 0.6s ease",
    },
    logoText: { fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "0.14em" },
    badge: {
      padding: "4px 13px", borderRadius: 20, fontSize: 11,
      letterSpacing: "0.18em", fontWeight: 600, color: accent,
      border: `1px solid ${accent}55`, background: `${accent}11`,
      transition: "all 0.6s ease",
    },
  };

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes vFloat{0%{transform:translate(0,0)}33%{transform:translate(8px,-28px)}66%{transform:translate(-6px,-14px)}100%{transform:translate(0,0)}}
        @keyframes vBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}
        @keyframes vUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes vIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
        @keyframes vSlide{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes vPulse{0%,100%{opacity:0.45}50%{opacity:0.85}}
        @keyframes vSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes vOrbit{from{transform:rotate(0deg) translateX(56px) rotate(0deg)}to{transform:rotate(360deg) translateX(56px) rotate(-360deg)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#ffffff18;border-radius:2px}
        input::placeholder{color:#ffffff30}
        button{transition:all 0.25s ease}
        button:active{transform:scale(0.96)!important}
      `}</style>

      <Particles color={accent} />
      <div style={S.ambient} />

      {/* ── API KEY MODAL ── */}
      {showKeyInput && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "#050508ee", display: "flex",
          alignItems: "center", justifyContent: "center", padding: 24,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{
            background: "#0e0e14", border: `1px solid ${accent}44`,
            borderRadius: 20, padding: 32, maxWidth: 360, width: "100%",
            boxShadow: `0 0 40px ${glow}`, animation: "vIn 0.4s ease",
          }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Add Your Groq API Key
            </div>
            <p style={{ fontSize: 13, color: "#ffffff55", marginBottom: 6, lineHeight: 1.6 }}>
              Get your FREE key in 2 minutes:
            </p>
            <p style={{ fontSize: 13, color: accent, marginBottom: 20, letterSpacing: "0.05em" }}>
              → console.groq.com → API Keys → Create
            </p>
            <input
              autoFocus
              placeholder="gsk_..."
              value={apiKey === "YOUR_GROQ_API_KEY_HERE" ? "" : apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${accent}44`, borderRadius: 12,
                color: "#f0f0f0", fontSize: 14, outline: "none",
                marginBottom: 14, fontFamily: "'DM Sans',sans-serif",
              }}
            />
            <button onClick={() => { if (apiKey.startsWith("gsk_")) setShowKeyInput(false); }} style={{
              width: "100%", padding: "13px",
              background: accent, border: "none", borderRadius: 12,
              color: "#000", fontWeight: 700, fontSize: 14,
              cursor: "pointer", fontFamily: "'Syne',sans-serif",
              letterSpacing: "0.1em",
            }}>ACTIVATE VORTA</button>
          </div>
        </div>
      )}

      {/* ── SPLASH ── */}
      {screen === "splash" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#050508", animation: "vIn 0.9s ease forwards",
        }}>
          {/* Orbital */}
          <div style={{ position: "relative", width: 150, height: 150, marginBottom: 44 }}>
            {[0, 10, 24].map((inset, i) => (
              <div key={i} style={{
                position: "absolute", inset, borderRadius: "50%",
                border: `1px solid ${i === 0 ? "#ffffff08" : i === 1 ? accent + "30" : accent + "60"}`,
                animation: i > 0 ? `vSpin ${5 + i * 3}s linear infinite ${i % 2 === 0 ? "" : "reverse"}` : "none",
              }} />
            ))}
            {/* Center orb */}
            <div style={{
              position: "absolute", inset: "50%", transform: "translate(-50%,-50%)",
              width: 50, height: 50, borderRadius: "50%",
              background: `radial-gradient(circle,${accent} 0%,${accent}77 60%,transparent 100%)`,
              boxShadow: `0 0 28px ${accent}88, 0 0 56px ${accent}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne',sans-serif", fontSize: 21, fontWeight: 800,
            }}>V</div>
            {/* Orbiting dots */}
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                position: "absolute", inset: "50%", transform: "translate(-50%,-50%)",
                width: 6, height: 6, borderRadius: "50%", background: accent,
                animation: `vOrbit ${2.8 + i * 0.9}s linear ${i * 0.9}s infinite`,
              }} />
            ))}
          </div>

          <h1 style={{
            fontFamily: "'Syne',sans-serif", fontSize: 60, fontWeight: 800,
            letterSpacing: "0.16em", color: "#fff", marginBottom: 6,
            textShadow: `0 0 40px ${accent}55`,
          }}>VORTA</h1>
          <p style={{ fontSize: 12, letterSpacing: "0.35em", color: "#ffffff44", marginBottom: 6, textTransform: "uppercase" }}>
            Life Operating System
          </p>
          <p style={{ fontSize: 14, color: "#ffffff28", marginBottom: 52 }}>Your AI Chief of Staff</p>

          <button onClick={() => setScreen("modes")} style={{
            padding: "15px 50px", background: "transparent",
            border: `1px solid ${accent}`, borderRadius: 40,
            color: accent, fontSize: 12, letterSpacing: "0.28em",
            fontWeight: 700, cursor: "pointer",
            fontFamily: "'Syne',sans-serif", textTransform: "uppercase",
            boxShadow: `0 0 18px ${glow}`,
          }}
            onMouseEnter={(e) => { e.target.style.background = accent + "22"; e.target.style.boxShadow = `0 0 36px ${glow},0 0 72px ${glow}`; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.boxShadow = `0 0 18px ${glow}`; }}>
            INITIALIZE
          </button>

          {/* Key setup hint */}
          <button onClick={() => setShowKeyInput(true)} style={{
            marginTop: 20, background: "none", border: "none",
            color: "#ffffff28", fontSize: 11, cursor: "pointer",
            letterSpacing: "0.15em", textTransform: "uppercase",
          }}>
            {apiKey === "YOUR_GROQ_API_KEY_HERE" ? "⚙ Setup API Key" : "⚙ API Key Active"}
          </button>
        </div>
      )}

      {/* ── SHARED HEADER (modes/pillars/chat) ── */}
      {screen !== "splash" && (
        <div style={S.header}>
          <div style={S.logo}>
            <div style={S.logoOrb}>V</div>
            <span style={S.logoText}>VORTA</span>
          </div>
          {modeId && <div style={S.badge}>{mode.sub}</div>}
        </div>
      )}

      {/* ── MODE SELECT ── */}
      {screen === "modes" && (
        <div style={{ padding: "52px 22px 32px", position: "relative", zIndex: 2, animation: "vSlide 0.5s ease forwards" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#ffffff3a", textTransform: "uppercase", marginBottom: 10 }}>
            Select Your Mode
          </p>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 40, lineHeight: 1.35 }}>
            Who are you<br />operating as today?
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {MODES.map((m, i) => (
              <button key={m.id} onClick={() => { setModeId(m.id); setScreen("pillars"); }} style={{
                padding: "20px 24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                animation: `vSlide 0.5s ease ${i * 0.1}s both`,
                backdropFilter: "blur(10px)",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.color + "66"; e.currentTarget.style.background = m.color + "10"; e.currentTarget.style.transform = "translateX(6px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateX(0)"; }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 700, color: m.color, letterSpacing: "0.1em", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: "#ffffff44" }}>{m.sub}</div>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${m.color}44`, display: "flex", alignItems: "center", justifyContent: "center", color: m.color, fontSize: 15 }}>→</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PILLAR SELECT ── */}
      {screen === "pillars" && (
        <div style={{ padding: "36px 22px 32px", position: "relative", zIndex: 2, animation: "vSlide 0.5s ease forwards" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#ffffff3a", textTransform: "uppercase", marginBottom: 8 }}>Choose Your Engine</p>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 25, fontWeight: 700, color: "#fff", marginBottom: 28, lineHeight: 1.35 }}>
            What do you need<br />right now?
          </h2>

          {/* Pillars grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
            {PILLARS.map((p, i) => (
              <button key={p.id} onClick={() => openPillar(p.id)} style={{
                padding: "18px 10px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
                cursor: "pointer", textAlign: "center",
                animation: `vSlide 0.5s ease ${i * 0.1}s both`,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent + "66"; e.currentTarget.style.background = accent + "10"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${glow}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: 22, marginBottom: 8, color: accent }}>{p.icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.12em", marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 9, color: "#ffffff3a", lineHeight: 1.4 }}>{p.desc}</div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <p style={{ fontSize: 11, letterSpacing: "0.25em", color: "#ffffff2a", textTransform: "uppercase", marginBottom: 12 }}>Quick Start</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {QUICK_ACTIONS[modeId]?.map((action, i) => (
              <button key={i} onClick={() => { openPillar("nav"); setTimeout(() => send(action), 200); }} style={{
                padding: "12px 16px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 11,
                color: "#ffffff66", fontSize: 13, cursor: "pointer", textAlign: "left",
                animation: `vSlide 0.5s ease ${i * 0.08}s both`,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent + "44"; e.currentTarget.style.color = "#ffffffbb"; e.currentTarget.style.background = accent + "08"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#ffffff66"; e.currentTarget.style.background = "transparent"; }}>
                → {action}
              </button>
            ))}
          </div>

          <button onClick={() => { setModeId(null); setScreen("modes"); }} style={{
            marginTop: 24, width: "100%", padding: "11px", background: "transparent",
            border: "none", color: "#ffffff28", fontSize: 11, letterSpacing: "0.18em",
            cursor: "pointer", textTransform: "uppercase",
          }}
            onMouseEnter={(e) => e.target.style.color = "#ffffff55"}
            onMouseLeave={(e) => e.target.style.color = "#ffffff28"}>
            ← Switch Mode
          </button>
        </div>
      )}

      {/* ── CHAT ── */}
      {screen === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 74px)", position: "relative", zIndex: 2, animation: "vIn 0.4s ease forwards" }}>
          {/* Chat header */}
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => { setScreen("pillars"); setMessages([]); }} style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>←</button>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: accent, letterSpacing: "0.1em" }}>{pillar?.label}</div>
              <div style={{ fontSize: 11, color: "#ffffff3a", letterSpacing: "0.12em" }}>{mode?.sub}</div>
            </div>
            {/* Live dot */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4CAF50", boxShadow: "0 0 8px #4CAF5077", animation: "vPulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, color: "#ffffff33", letterSpacing: "0.15em" }}>LIVE</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 8px" }}>
            {messages.map((m, i) => <Bubble key={i} msg={m} accent={accent} />)}
            {loading && <Typing />}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: "10px 16px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{
              display: "flex", gap: 8, alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 22, padding: "7px 7px 7px 16px",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Tell VORTA what you need..."
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", color: "#f0f0f0", fontSize: 14,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} style={{
                width: 36, height: 36, borderRadius: "50%",
                background: input.trim() ? accent : "rgba(255,255,255,0.07)",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                color: input.trim() ? "#000" : "#ffffff28",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: input.trim() ? `0 0 14px ${glow}` : "none",
                flexShrink: 0,
              }}>↑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}