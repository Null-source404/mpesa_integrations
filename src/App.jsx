import { useState, useEffect, useRef } from "react";

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 4,
  duration: 8 + Math.random() * 12,
  delay: Math.random() * 8,
}));

const API = "http://localhost:5000/api";
const fmt = (n) => Number(n).toLocaleString("en-KE", { minimumFractionDigits: 2 });
const genId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// ── status config ─────────────────────────────────────────────
const STATUS = {
  pending: { label: "Pending",   icon: "⏳", ring: "#f59e0b", glow: "rgba(245,158,11,0.15)",  text: "#92400e", bg: "rgba(254,243,199,0.8)" },
  paid:    { label: "Paid",      icon: "✓",  ring: "#10b981", glow: "rgba(16,185,129,0.15)",  text: "#065f46", bg: "rgba(209,250,229,0.8)" },
  failed:  { label: "Failed",    icon: "✕",  ring: "#ef4444", glow: "rgba(239,68,68,0.15)",   text: "#7f1d1d", bg: "rgba(254,226,226,0.8)" },
};

// ── animated number ───────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);  // ← add this

  useEffect(() => {
    let start = displayRef.current;  // ← read from ref, not state
    const end = parseFloat(value) || 0;
    if (start === end) return;
    const step = (end - start) / 20;
    const timer = setInterval(() => {
      start += step;
      if ((step > 0 && start >= end) || (step < 0 && start <= end)) {
        displayRef.current = end;
        setDisplay(end);
        clearInterval(timer);
      } else {
        displayRef.current = start;
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);  // ← now only depends on value, which is correct

  return <>{fmt(display.toFixed(2))}</>;
};

// ── floating particle bg ──────────────────────────────────────
const Particles = () => {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "rgba(255,255,255,0.3)",
          animation: `float ${p.duration}s ${p.delay}s infinite ease-in-out alternate`
        }} />
      ))}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          to   { transform: translateY(-30px) rotate(180deg); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// ── glass card ────────────────────────────────────────────────
const Glass = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3)",
    ...style
  }}>{children}</div>
);

// ── receipt card ──────────────────────────────────────────────
const Receipt = ({ bill, onRefresh, refreshing }) => {
  const paid = bill.participants.filter(p => p.status === "paid").length;
  const pct = Math.round((paid / bill.participants.length) * 100);

  return (
    <Glass style={{ overflow: "hidden", animation: "riseIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)" }}>
      {/* header */}
      <div style={{
        padding: "16px 20px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start"
      }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 3, marginBottom: 3 }}>BILL</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>#{bill.id}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 2 }}>Total</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
            KES {fmt(bill.total)}
          </div>
        </div>
      </div>

      {/* progress */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>COLLECTED</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
            {paid}/{bill.participants.length}
          </span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: "linear-gradient(90deg, #34d399, #10b981)",
            width: `${pct}%`,
            transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 0 8px rgba(52,211,153,0.6)"
          }} />
        </div>
      </div>

      {/* participants */}
      <div style={{ padding: "8px 12px" }}>
        {bill.participants.map((p, i) => {
          const s = STATUS[p.status] || STATUS.pending;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 10px", borderRadius: 12, marginBottom: 4,
              background: s.glow,
              border: `1px solid ${s.ring}30`,
              transition: "all 0.5s ease"
            }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>
                  {p.phone}
                </div>
                {p.receipt && (
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2, fontFamily: "monospace" }}>
                    {p.receipt}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
                  KES {fmt(bill.splitAmount)}
                </span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 20,
                  background: s.bg, border: `1px solid ${s.ring}50`
                }}>
                  <span style={{ fontSize: 9 }}>{s.icon}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: s.text, letterSpacing: 1 }}>{s.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div style={{
        padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>
          KES {fmt(bill.splitAmount)} × {bill.participants.length} people
        </span>
        <button onClick={onRefresh} disabled={refreshing} style={{
          padding: "4px 12px", borderRadius: 20,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.6)", fontSize: 9,
          cursor: refreshing ? "not-allowed" : "pointer",
          fontFamily: "monospace", letterSpacing: 1,
          transition: "all 0.2s"
        }}>
          {refreshing ? "checking..." : "↺ refresh"}
        </button>
      </div>

      <style>{`
        @keyframes riseIn {
          from { opacity:0; transform: translateY(16px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </Glass>
  );
};

// ── main ──────────────────────────────────────────────────────
export default function BillSplitter() {
  const [total, setTotal]   = useState("");
  const [phones, setPhones] = useState(["", ""]);
  const [bills, setBills]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [refreshing, setRefreshing] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validPhones = phones.filter(p => p.trim());
  const splitAmount = validPhones.length >= 2 && parseFloat(total) > 0
    ? (parseFloat(total) / validPhones.length).toFixed(2)
    : null;

  const updatePhone = (i, v) => setPhones(p => p.map((x, idx) => idx === i ? v : x));
  const addPhone = () => { if (phones.length < 8) setPhones(p => [...p, ""]); };
  const removePhone = (i) => setPhones(p => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError("");
    if (!total || parseFloat(total) <= 0) { setError("Enter a valid bill amount"); return; }
    if (validPhones.length < 2) { setError("Add at least 2 phone numbers"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/split-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total: parseFloat(total), phones: validPhones })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setBills(prev => [{
        id: data.billId || genId(),
        total: parseFloat(total),
        splitAmount: parseFloat(splitAmount),
        participants: validPhones.map(phone => ({ phone, status: "pending", receipt: null }))
      }, ...prev]);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 1500);
      setTotal(""); setPhones(["", ""]);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshBill = async (billId, idx) => {
    setRefreshing(r => ({ ...r, [billId]: true }));
    try {
      const res = await fetch(`${API}/bill-status/${billId}`);
      const data = await res.json();
      setBills(prev => prev.map((b, i) => i === idx ? { ...b, participants: data.participants } : b));
    } catch(e) { console.error(e); }
    finally { setRefreshing(r => ({ ...r, [billId]: false })); }
  };

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      background: "linear-gradient(135deg, #0f4c2a 0%, #1a3a5c 35%, #2d1b4e 70%, #0f4c2a 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: "hidden"
    }}>
      <Particles />

      {/* bg orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* nav */}
      <nav style={{
        position: "relative", zIndex: 10,
        padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.15)", backdropFilter: "blur(20px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #34d399, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#fff",
            boxShadow: "0 4px 16px rgba(52,211,153,0.4)"
          }}>₭</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>SplitPesa</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>M-PESA BILL SPLITTER</div>
          </div>
        </div>
        <div style={{
          padding: "6px 14px", borderRadius: 20,
          background: "rgba(52,211,153,0.15)",
          border: "1px solid rgba(52,211,153,0.3)",
          fontSize: 10, color: "#34d399", letterSpacing: 2
        }}>
          ● SANDBOX
        </div>
      </nav>

      {/* content */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 900, margin: "0 auto", padding: "32px 20px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start"
      }}>

        {/* ── form ── */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: -1 }}>
              Split the bill,<br/>
              <span style={{ background: "linear-gradient(90deg,#34d399,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                no awkwardness.
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 8, lineHeight: 1.7 }}>
              Everyone gets an M-Pesa PIN prompt.<br/>You track who paid in real time.
            </p>
          </div>

          <Glass style={{ padding: 20, marginBottom: 14 }}>
            {/* amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 3, display: "block", marginBottom: 8 }}>
                TOTAL BILL
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 0,
                background: "rgba(255,255,255,0.08)", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden"
              }}>
                <div style={{
                  padding: "12px 14px", fontSize: 12, fontWeight: 700,
                  color: "#34d399", borderRight: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(52,211,153,0.08)"
                }}>KES</div>
                <input
                  type="number" value={total}
                  onChange={e => setTotal(e.target.value)}
                  placeholder="0.00"
                  style={{
                    flex: 1, border: "none", outline: "none", background: "transparent",
                    padding: "12px 14px", fontSize: 22, fontWeight: 800, color: "#fff",
                  }}
                />
              </div>
            </div>

            {/* split pill */}
            {splitAmount && (
              <div style={{
                padding: "8px 14px", borderRadius: 10, marginBottom: 14,
                background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                animation: "fadeIn 0.3s ease"
              }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Each person pays</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#34d399" }}>
                  KES <AnimatedNumber value={splitAmount} />
                </span>
              </div>
            )}

            {/* phones */}
            <div>
              <label style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 3, display: "block", marginBottom: 10 }}>
                PHONES — {validPhones.length} PEOPLE
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {phones.map((p, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, alignItems: "center",
                    animation: "fadeIn 0.2s ease"
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: "#34d399", fontWeight: 700, flexShrink: 0
                    }}>{i + 1}</div>
                    <input
                      value={p}
                      onChange={e => updatePhone(i, e.target.value)}
                      placeholder="254712345678"
                      style={{
                        flex: 1, background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                        padding: "9px 12px", color: "#fff", fontFamily: "monospace",
                        fontSize: 12, outline: "none"
                      }}
                    />
                    {phones.length > 2 && (
                      <button onClick={() => removePhone(i)} style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "#f87171", cursor: "pointer", fontSize: 14
                      }}>×</button>
                    )}
                  </div>
                ))}
              </div>

              {phones.length < 8 && (
                <button onClick={addPhone} style={{
                  width: "100%", marginTop: 8, padding: "8px 0",
                  background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)",
                  borderRadius: 10, color: "rgba(255,255,255,0.3)", cursor: "pointer",
                  fontSize: 10, letterSpacing: 2, transition: "all 0.2s"
                }}>+ ADD PERSON</button>
              )}
            </div>
          </Glass>

          {/* error */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 12,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5", fontSize: 11, animation: "shake 0.3s ease"
            }}>⚠ {error}</div>
          )}

          {/* submit */}
          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
            background: submitted
              ? "linear-gradient(135deg,#10b981,#059669)"
              : loading
              ? "rgba(255,255,255,0.05)"
              : "linear-gradient(135deg,#34d399,#3b82f6)",
            color: loading ? "rgba(255,255,255,0.2)" : "#fff",
            fontSize: 13, fontWeight: 800, letterSpacing: 2,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 8px 32px rgba(52,211,153,0.35)",
            transition: "all 0.3s",
            transform: submitted ? "scale(1.02)" : "scale(1)"
          }}>
            {loading ? "⏳ SENDING STK PUSHES..." : submitted ? "✓ SENT!" : "📲 SPLIT & REQUEST PAYMENT"}
          </button>
        </div>

        {/* ── receipts ── */}
        <div>
          {bills.length === 0 ? (
            <Glass style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.8 }}>
                No bills yet.<br/>Create one to see receipts here.
              </div>
            </Glass>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3 }}>
                {bills.length} RECEIPT{bills.length !== 1 ? "S" : ""}
              </div>
              {bills.map((bill, i) => (
                <Receipt key={bill.id} bill={bill}
                  onRefresh={() => refreshBill(bill.id, i)}
                  refreshing={!!refreshing[bill.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
      `}</style>
    </div>
  );
}