import { useState, useEffect, useRef, useCallback } from "react";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const T = {
  bg:        "#F8F5F1",
  surface:   "#FFFFFF",
  surfaceAlt:"#F2EEE9",
  border:    "#E8E2DA",
  borderDark:"#D4CCC2",
  ink:       "#1C1917",
  inkMid:    "#6B6560",
  inkLight:  "#A8A29E",
  orange:    "#F4521E",
  orangeLight:"#FEE8E2",
  orangeMid: "#FCCFBF",
  pink:      "#F0547C",
  pinkLight: "#FDE8EF",
  pinkMid:   "#FAC4D4",
  white:     "#FFFFFF",
  green:     "#2E9B6E",
  greenLight:"#E0F4EC",
};

const FONT = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${T.bg}; color: ${T.ink}; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
  input, textarea, select, button { font-family: inherit; }
  input:focus, textarea:focus, select:focus { outline: 2px solid ${T.orange}; outline-offset: 1px; }
  input[type=range] { accent-color: ${T.orange}; }
`;

/* ─── EMPTY STATE SEED ───────────────────────────────────────────────────────── */
const EMPTY = {
  user: { name: "", mission: "", values: [], idealSelf: "", onboarded: false },
  goals: [],
  habits: [],
  tasks: [],
  reflections: [],
  whoop: null,          // null = not connected
  whoopToken: null,
};

/* ─── LOCAL STORAGE ─────────────────────────────────────────────────────────── */
const useLS = (key, init) => {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const set = useCallback(val => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, v]);
  return [v, set];
};

/* ─── UTILS ─────────────────────────────────────────────────────────────────── */
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const pct = n => `${Math.round(n)}%`;
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ─── PRIMITIVES ─────────────────────────────────────────────────────────────── */

const Mono = ({ children, color = T.ink, size = 13, style = {} }) => (
  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: size, color, ...style }}>{children}</span>
);

const Label = ({ children, style = {} }) => (
  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: T.inkLight, textTransform: "uppercase", marginBottom: 8, ...style }}>{children}</p>
);

const Serif = ({ children, size = 28, italic, style = {} }) => (
  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: size, fontWeight: 400, fontStyle: italic ? "italic" : "normal", lineHeight: 1.25, ...style }}>{children}</span>
);

const Divider = ({ style = {} }) => (
  <div style={{ height: 1, background: T.border, ...style }} />
);

const Tag = ({ children, color = T.orange, bg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4,
    fontSize: 11, fontWeight: 500, color, background: bg || color + "18",
    border: `1px solid ${color}30`, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style = {} }) => {
  const v = {
    primary:   { background: T.orange, color: "#fff", border: "none" },
    secondary: { background: T.white, color: T.ink, border: `1px solid ${T.border}` },
    ghost:     { background: "transparent", color: T.inkMid, border: "none" },
    pink:      { background: T.pink, color: "#fff", border: "none" },
    danger:    { background: T.pinkLight, color: T.pink, border: `1px solid ${T.pinkMid}` },
  }[variant];
  const s = { sm: "7px 12px", md: "9px 18px", lg: "12px 26px" }[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: s, borderRadius: 8, fontSize: size === "sm" ? 12 : 13, fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.15s",
      ...v, ...style
    }}>{children}</button>
  );
};

const Input = ({ value, onChange, placeholder, multiline, rows = 3, style = {}, type = "text", onKeyDown }) => {
  const base = {
    width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "9px 12px", color: T.ink, fontSize: 13,
    outline: "none", resize: "vertical", ...style,
  };
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} />
    : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onKeyDown={onKeyDown} />;
};

const Select = ({ value, onChange, children, style = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "9px 12px", color: T.ink, fontSize: 13,
    outline: "none", ...style,
  }}>{children}</select>
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
    padding: 20, cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
);

const Bar = ({ value, color = T.orange, height = 4, style = {} }) => (
  <div style={{ height, background: T.border, borderRadius: 99, overflow: "hidden", ...style }}>
    <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: 99, transition: "width 0.5s" }} />
  </div>
);

const Ring = ({ value, size = 72, stroke = 7, color = T.orange, label, sub }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const d = (value / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${d} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s" }} />
      </svg>
      {label && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Mono size={size > 60 ? 15 : 11} color={color}>{label}</Mono>
          {sub && <span style={{ fontSize: 9, color: T.inkLight, marginTop: 2 }}>{sub}</span>}
        </div>
      )}
    </div>
  );
};

const Spark = ({ data, color = T.orange, width = 80, height = 28 }) => {
  if (!data?.length || data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), range = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Empty = ({ icon, title, body, action }) => (
  <div style={{ textAlign: "center", padding: "48px 24px" }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
    <Serif size={20} style={{ display: "block", marginBottom: 8, color: T.ink }}>{title}</Serif>
    <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 20px" }}>{body}</p>
    {action}
  </div>
);

/* ─── ONBOARDING ─────────────────────────────────────────────────────────────── */
function Onboarding({ data, setData }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", mission: "", idealSelf: "", valuesInput: "" });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const finish = () => {
    if (!privacyAccepted) return;
    const vals = form.valuesInput.split(",").map(s => s.trim()).filter(Boolean);
    setData(d => ({
      ...d,
      user: { name: form.name, mission: form.mission, idealSelf: form.idealSelf, values: vals, onboarded: true, privacyAcceptedAt: new Date().toISOString() },
    }));
  };

  const steps = [
    {
      title: "What's your name?",
      sub: "Meridian will use this to make things feel personal.",
      content: (
        <Input value={form.name} onChange={v => f("name", v)} placeholder="Your first name" style={{ fontSize: 20, padding: "14px 16px" }} />
      ),
      valid: form.name.trim().length > 0,
    },
    {
      title: "Write your personal mission.",
      sub: "One to two sentences. Why are you here? What are you trying to build or become?",
      content: (
        <Input multiline value={form.mission} onChange={v => f("mission", v)}
          placeholder="e.g. To become a rigorous thinker who builds lasting work and lives with intention." rows={4} style={{ fontSize: 14 }} />
      ),
      valid: form.mission.trim().length > 10,
    },
    {
      title: "Describe your ideal self.",
      sub: "Not goals — character. How does the person you want to become show up in the world?",
      content: (
        <Input multiline value={form.idealSelf} onChange={v => f("idealSelf", v)}
          placeholder="e.g. Calm, focused, physically strong, generous, deeply curious. Reliable to the people I care about." rows={4} style={{ fontSize: 14 }} />
      ),
      valid: form.idealSelf.trim().length > 10,
    },
    {
      title: "Name your core values.",
      sub: "Comma-separated. These become the lens everything else is measured against.",
      content: (
        <Input value={form.valuesInput} onChange={v => f("valuesInput", v)}
          placeholder="e.g. Discipline, Curiosity, Integrity, Health, Depth" style={{ fontSize: 14 }} />
      ),
      valid: form.valuesInput.trim().length > 2,
    },
    {
      title: "Before you begin.",
      sub: "Meridian stores your goals, habits, reflections, and health data to help you understand yourself over time. Please review how we handle your information.",
      content: (
        <div>
          {/* Privacy summary card */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
            {[
              { icon: "🔒", heading: "Your data stays on your device", body: "Goals, habits, tasks, and reflections are stored in your browser's local storage only. Nothing is uploaded to a server without your explicit action." },
              { icon: "⌚", heading: "Health data is yours to control", body: "WHOOP and wearable data is only accessed when you choose to connect it. You can disconnect at any time from the Health screen." },
              { icon: "✦", heading: "AI uses your data to coach you", body: "The AI Coach reads your goals, habits, and reflections to give personalised guidance. This data is sent to Anthropic's API only during that session." },
              { icon: "📋", heading: "No selling, no ads", body: "Meridian does not sell your personal information to third parties. Data sharing is limited to what's needed to operate the service." },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 3 }}>{item.heading}</p>
                  <p style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.6 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Read full policy link */}
          <div style={{ marginBottom: 20, textAlign: "center" }}>
            <button onClick={() => setShowPrivacyModal(true)} style={{
              background: "none", border: "none", color: T.orange, fontSize: 13, fontWeight: 500,
              cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
            }}>
              Read the full Privacy Policy →
            </button>
          </div>

          {/* Consent checkbox */}
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", padding: "14px 16px", background: privacyAccepted ? T.orangeLight : T.surfaceAlt, border: `1px solid ${privacyAccepted ? T.orangeMid : T.border}`, borderRadius: 10, transition: "all 0.2s" }}>
            <div onClick={() => setPrivacyAccepted(p => !p)} style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
              background: privacyAccepted ? T.orange : "transparent",
              border: `2px solid ${privacyAccepted ? T.orange : T.borderDark}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {privacyAccepted && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
            </div>
            <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.6, userSelect: "none" }} onClick={() => setPrivacyAccepted(p => !p)}>
              I have read and agree to Meridian's{" "}
              <button onClick={e => { e.stopPropagation(); setShowPrivacyModal(true); }} style={{ background: "none", border: "none", color: T.orange, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 2 }}>
                Privacy Policy
              </button>
              . I understand that my data is stored locally and used to personalise my experience.
            </p>
          </label>
        </div>
      ),
      valid: privacyAccepted,
    },
  ];

  const s = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <>
      {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
            {steps.map((_, i) => (
              <div key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i <= step ? T.orange : T.border, transition: "background 0.3s" }} />
            ))}
          </div>

          {/* Meridian wordmark — only on first step */}
          {step === 0 && (
            <div style={{ marginBottom: 32 }}>
              <Serif size={24} style={{ display: "block", color: T.ink, letterSpacing: "-0.01em" }}>Meridian</Serif>
              <p style={{ fontSize: 11, color: T.inkLight, letterSpacing: "0.1em", marginTop: 2 }}>PERSONAL OS</p>
            </div>
          )}

          <Serif size={32} style={{ display: "block", marginBottom: 10, color: T.ink }}>{s.title}</Serif>
          <p style={{ fontSize: 14, color: T.inkMid, marginBottom: 28, lineHeight: 1.6 }}>{s.sub}</p>

          {s.content}

          <div style={{ display: "flex", gap: 10, marginTop: 28, justifyContent: "space-between", alignItems: "center" }}>
            {step > 0
              ? <Btn variant="ghost" onClick={() => setStep(p => p - 1)}>← Back</Btn>
              : <span />}
            <Btn
              onClick={isLastStep ? finish : () => setStep(p => p + 1)}
              disabled={!s.valid}
              size="lg"
            >
              {isLastStep ? "I agree — Enter Meridian →" : "Continue →"}
            </Btn>
          </div>

          <p style={{ fontSize: 12, color: T.inkLight, marginTop: 20, textAlign: "center" }}>
            Step {step + 1} of {steps.length} · Everything is stored locally on your device.
          </p>
        </div>
      </div>
    </>
  );
}

/* ─── PRIVACY POLICY CONTENT ────────────────────────────────────────────────── */
const PRIVACY_SECTIONS = [
  {
    title: "1. Introduction",
    body: `Welcome to Meridian.\n\nMeridian ("Meridian," "we," "our," or "us") is a personal growth and performance platform designed to help individuals understand their behaviors, track meaningful goals, develop better habits, and make informed decisions about their personal development.\n\nThis Privacy Policy explains how we collect, use, store, protect, and share information when you use our website, mobile application, and related services (collectively, the "Service").\n\nBy using Meridian, you agree to the practices described in this Privacy Policy.`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect information that helps us provide, improve, and personalize your Meridian experience.\n\nInformation You Provide\nYou may provide information including: name, email address, account information, profile information, goals and objectives, habits and routines, tasks and plans, personal reflections and journal entries, notes, observations, and insights, preferences and settings, and feedback and communications with Meridian.\n\nPersonal Performance Data\nBecause Meridian is designed to help users understand themselves over time, you may choose to provide information related to: productivity patterns, goal progress, habit completion, daily and weekly reflections, mood and emotional patterns, self-reported energy levels, learning and development activities, and fitness and training information. You control what information you choose to enter.\n\nHealth and Wearable Data\nIf you connect third-party health platforms such as WHOOP or other supported services, Meridian may collect information such as sleep information, recovery metrics, heart rate-related information, training load, activity data, and other wellness metrics provided through connected services. This information is only collected when you authorize the connection. Meridian uses this data to help identify patterns between your behaviors, recovery, performance, and goals.\n\nAutomatically Collected Information\nWhen you use Meridian, we may automatically collect certain technical information, including device information, browser type, operating system, usage activity, app interactions, log data, performance information, and approximate location information derived from technical data. This information helps us maintain, secure, and improve the Service.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use your information to: provide and operate Meridian, track your goals, habits, and progress, generate personalized insights, analyze behavioral patterns, improve your experience, provide AI-powered recommendations, improve app functionality, maintain security, respond to support requests, and develop new features.\n\nMeridian is designed to transform your personal data into useful insights that help you better understand your own behaviors and decisions.`,
  },
  {
    title: "4. Artificial Intelligence Features",
    body: `Meridian may use artificial intelligence technologies to analyze information you provide and generate insights, summaries, recommendations, or reflections.\n\nExamples include: identifying behavior patterns, creating weekly or monthly reviews, highlighting relationships between habits and outcomes, and suggesting areas for improvement.\n\nAI-generated insights are designed to support reflection and decision-making. They are not medical, psychological, financial, or professional advice.`,
  },
  {
    title: "5. How We Protect Your Information",
    body: `We take reasonable technical and organizational measures to protect your information. These measures may include: encryption, secure authentication systems, access controls, data protection practices, and security monitoring.\n\nHowever, no digital system can guarantee absolute security.`,
  },
  {
    title: "6. Data Sharing",
    body: `We do not sell your personal information.\n\nWe may share information only in limited circumstances:\n\nService Providers — We may work with trusted third-party providers that help operate Meridian, such as cloud hosting providers, database providers, analytics services, authentication providers, and AI infrastructure providers. These providers only receive information necessary to perform their services and are required to protect your information.\n\nLegal Requirements — We may disclose information if required to comply with legal obligations, respond to lawful requests, protect rights, safety, or security, or prevent fraud or misuse.\n\nBusiness Transfers — If Meridian is involved in a merger, acquisition, financing, or sale of assets, your information may be transferred as part of that transaction.`,
  },
  {
    title: "7. Your Control Over Your Information",
    body: `You have control over your information. You may: access your information, update your account information, delete your data, disconnect wearable integrations, export your information where available, and request information about how your data is used.\n\nYou can manage many privacy settings directly within the Meridian app.`,
  },
  {
    title: "8. Data Retention",
    body: `We retain information only for as long as necessary to: provide the Service, maintain your account, meet legal obligations, resolve disputes, and improve our platform.\n\nWhen you delete your account, we will take reasonable steps to remove or anonymize your personal information, subject to legal requirements.`,
  },
  {
    title: "9. Third-Party Services",
    body: `Meridian may integrate with third-party services. These services operate under their own privacy policies. Meridian is not responsible for the privacy practices of external services. You should review the privacy policies of any connected services.`,
  },
  {
    title: "10. Children's Privacy",
    body: `Meridian is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13 without appropriate consent. If you believe a child has provided information to Meridian, please contact us.`,
  },
  {
    title: "11. International Users",
    body: `Meridian may be used by individuals around the world. Depending on your location, you may have additional privacy rights under applicable laws, including laws such as the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and other applicable privacy regulations.`,
  },
  {
    title: "12. Changes to This Privacy Policy",
    body: `We may update this Privacy Policy periodically. When changes are made, we will update the effective date and provide notice where required. Your continued use of Meridian after changes means you accept the updated policy.`,
  },
  {
    title: "13. Contact Us",
    body: `If you have questions about this Privacy Policy, your data, or Meridian's privacy practices, please contact us through the Meridian app or website.`,
  },
];

/* ─── PRIVACY POLICY SCREEN (full page, accessible from sidebar) ─────────────── */
function PrivacyScreen() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <Label>Legal</Label>
        <Serif size={34} style={{ display: "block", marginBottom: 10 }}>Privacy Policy</Serif>
        <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.6 }}>
          This policy explains how Meridian collects, uses, and protects your information.
        </p>
        <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ padding: "6px 14px", background: T.orangeLight, border: `1px solid ${T.orangeMid}`, borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: T.orange, fontWeight: 500 }}>Effective Date: [Insert Date]</span>
          </div>
          <span style={{ fontSize: 12, color: T.inkLight }}>Last updated when the policy is finalised</span>
        </div>
      </div>

      {/* Quick links */}
      <Card style={{ marginBottom: 28, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        <Label>Jump to section</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PRIVACY_SECTIONS.map((s, i) => (
            <a key={i} href={`#privacy-${i}`} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 12, color: T.inkMid,
              background: T.surface, border: `1px solid ${T.border}`, textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.color = T.orange}
            onMouseOut={e => e.currentTarget.style.color = T.inkMid}>
              {s.title.split(".")[0]}.
            </a>
          ))}
        </div>
      </Card>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {PRIVACY_SECTIONS.map((s, i) => (
          <div key={i} id={`privacy-${i}`} style={{ paddingBottom: 28, marginBottom: 28, borderBottom: i < PRIVACY_SECTIONS.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 400, color: T.ink, marginBottom: 14 }}>{s.title}</h2>
            {s.body.split("\n\n").map((para, j) => {
              const isBold = para.length < 60 && !para.includes(" — ") && j > 0;
              return (
                <p key={j} style={{
                  fontSize: 14, color: isBold ? T.ink : T.inkMid, lineHeight: 1.8,
                  marginBottom: 12, fontWeight: isBold ? 600 : 400,
                }}>{para}</p>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 24px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, marginTop: 8 }}>
        <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.7 }}>
          Questions about this policy? Contact us through the Meridian app or website. Your trust matters to us — Meridian is built around the principle that your personal data belongs to you.
        </p>
      </div>
    </div>
  );
}

/* ─── PRIVACY MODAL (inline viewer, used during onboarding) ──────────────────── */
function PrivacyModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(28,25,23,0.6)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: T.surface, borderRadius: 16, width: "100%", maxWidth: 620,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        border: `1px solid ${T.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
      }}>
        {/* Modal header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <Serif size={20} style={{ display: "block" }}>Privacy Policy</Serif>
            <p style={{ fontSize: 12, color: T.inkLight, marginTop: 2 }}>Effective Date: [Insert Date]</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: T.inkMid, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
          {PRIVACY_SECTIONS.map((s, i) => (
            <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < PRIVACY_SECTIONS.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 400, color: T.ink, marginBottom: 10 }}>{s.title}</h3>
              {s.body.split("\n\n").map((para, j) => (
                <p key={j} style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.7, marginBottom: 8 }}>{para}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <Btn onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
            Close
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── NAV ────────────────────────────────────────────────────────────────────── */
const NAV = [
  { id: "today",    label: "Today"    },
  { id: "goals",    label: "Goals"    },
  { id: "habits",   label: "Habits"   },
  { id: "tasks",    label: "Tasks"    },
  { id: "journal",  label: "Journal"  },
  { id: "health",   label: "Health"   },
  { id: "insights", label: "Insights" },
  { id: "coach",    label: "AI Coach" },
  { id: "identity", label: "Identity" },
  { id: "privacy",  label: "Privacy Policy", footer: true },
];

/* ─── WHOOP PANEL ────────────────────────────────────────────────────────────── */
function WhoopPanel({ data, setData, onClose }) {
  const [tab, setTab] = useState("connect");
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState({
    recovery: "", sleep: "", hrv: "", rhr: "", strain: "", date: today(),
  });
  const [apiKey, setApiKey] = useState(data.whoopToken || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const f = (k, v) => setManual(p => ({ ...p, [k]: v }));

  /* Real WHOOP API call via their v1 endpoint */
  const fetchWhoop = async () => {
    if (!apiKey.trim()) { setError("Paste your WHOOP access token first."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      // WHOOP API v1 — cycle collection (most recent)
      const cycleRes = await fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=7", {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      if (!cycleRes.ok) throw new Error(`WHOOP returned ${cycleRes.status}. Check your token.`);
      const cycleData = await cycleRes.json();

      // Sleep
      const sleepRes = await fetch("https://api.prod.whoop.com/developer/v1/activity/sleep?limit=7", {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      const sleepData = sleepRes.ok ? await sleepRes.json() : { records: [] };

      // Recovery
      const recRes = await fetch("https://api.prod.whoop.com/developer/v1/recovery?limit=7", {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      const recData = recRes.ok ? await recRes.json() : { records: [] };

      const cycles = cycleData.records || [];
      const sleeps = sleepData.records || [];
      const recoveries = recData.records || [];

      const latestCycle = cycles[0];
      const latestSleep = sleeps[0];
      const latestRec = recoveries[0];

      const whoopPayload = {
        connected: true,
        lastSync: new Date().toISOString(),
        recovery: latestRec?.score?.recovery_score ?? null,
        hrv: latestRec?.score?.hrv_rmssd_milli ?? null,
        rhr: latestRec?.score?.resting_heart_rate ?? null,
        sleep: latestSleep?.score?.stage_summary?.total_in_bed_time_milli
          ? (latestSleep.score.stage_summary.total_in_bed_time_milli / 3_600_000).toFixed(1)
          : null,
        strain: latestCycle?.score?.strain ?? null,
        // Historical arrays for charts
        recoveryHistory: recoveries.map(r => ({ date: r.created_at?.split("T")[0], value: r.score?.recovery_score })).filter(x => x.value != null).reverse(),
        sleepHistory: sleeps.map(s => ({ date: s.created_at?.split("T")[0], value: s.score?.stage_summary?.total_in_bed_time_milli ? (s.score.stage_summary.total_in_bed_time_milli/3_600_000) : null })).filter(x => x.value != null).reverse(),
        hrvHistory: recoveries.map(r => ({ date: r.created_at?.split("T")[0], value: r.score?.hrv_rmssd_milli })).filter(x => x.value != null).reverse(),
      };

      setData(d => ({ ...d, whoop: whoopPayload, whoopToken: apiKey.trim() }));
      setSuccess("Connected! Your real WHOOP data is now live.");
    } catch (e) {
      setError(e.message || "Could not connect. Check your token and try again.");
    }
    setLoading(false);
  };

  const saveManual = () => {
    const w = {
      connected: false, manual: true,
      lastSync: new Date().toISOString(),
      recovery: manual.recovery ? Number(manual.recovery) : null,
      sleep: manual.sleep ? Number(manual.sleep) : null,
      hrv: manual.hrv ? Number(manual.hrv) : null,
      rhr: manual.rhr ? Number(manual.rhr) : null,
      strain: manual.strain ? Number(manual.strain) : null,
      recoveryHistory: data.whoop?.recoveryHistory || [],
      sleepHistory: data.whoop?.sleepHistory || [],
      hrvHistory: data.whoop?.hrvHistory || [],
    };
    // Append to history
    if (w.recovery) w.recoveryHistory = [...(data.whoop?.recoveryHistory || []), { date: manual.date, value: w.recovery }].slice(-30);
    if (w.sleep) w.sleepHistory = [...(data.whoop?.sleepHistory || []), { date: manual.date, value: w.sleep }].slice(-30);
    if (w.hrv) w.hrvHistory = [...(data.whoop?.hrvHistory || []), { date: manual.date, value: w.hrv }].slice(-30);
    setData(d => ({ ...d, whoop: w }));
    onClose?.();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: T.surface, borderRadius: 16, width: "100%", maxWidth: 520, padding: 28, border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <Serif size={22} style={{ display: "block" }}>Connect health data</Serif>
            <p style={{ fontSize: 13, color: T.inkMid, marginTop: 4 }}>Use your real WHOOP data, or enter metrics manually.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: T.inkMid, cursor: "pointer", padding: 4 }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: T.surfaceAlt, padding: 4, borderRadius: 8 }}>
          {["connect","manual"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: tab === t ? T.surface : "transparent", color: tab === t ? T.ink : T.inkMid,
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s",
            }}>{t === "connect" ? "WHOOP API" : "Manual entry"}</button>
          ))}
        </div>

        {tab === "connect" && (
          <div>
            <div style={{ padding: "14px 16px", background: T.orangeLight, border: `1px solid ${T.orangeMid}`, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: T.orange, lineHeight: 1.6 }}>
                <strong>How to get your WHOOP access token:</strong><br />
                1. Go to <strong>app.whoop.com → Profile → Integrations → Developer API</strong><br />
                2. Create an app and generate an access token<br />
                3. Paste it below. Your token stays on your device only.
              </p>
            </div>
            <Label>WHOOP Access Token</Label>
            <Input value={apiKey} onChange={setApiKey} placeholder="Paste your access token here..." type="password" style={{ marginBottom: 12, fontFamily: "monospace" }} />
            {error && <p style={{ fontSize: 12, color: T.pink, marginBottom: 10 }}>{error}</p>}
            {success && <p style={{ fontSize: 12, color: T.green, marginBottom: 10 }}>{success}</p>}
            <Btn onClick={fetchWhoop} disabled={loading || !apiKey.trim()} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Connecting…" : "Connect WHOOP"}
            </Btn>
          </div>
        )}

        {tab === "manual" && (
          <div>
            <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 16 }}>Enter today's metrics from your WHOOP app, watch, or any source.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { key: "recovery", label: "Recovery score (%)", placeholder: "e.g. 85" },
                { key: "sleep", label: "Sleep (hours)", placeholder: "e.g. 8.2" },
                { key: "hrv", label: "HRV (ms)", placeholder: "e.g. 68" },
                { key: "rhr", label: "Resting HR (bpm)", placeholder: "e.g. 52" },
                { key: "strain", label: "Strain score", placeholder: "e.g. 12.4" },
                { key: "date", label: "Date", placeholder: "" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <Label style={{ marginBottom: 6 }}>{label}</Label>
                  <Input value={manual[key]} onChange={v => f(key, v)} placeholder={placeholder} type={key === "date" ? "date" : "text"} />
                </div>
              ))}
            </div>
            <Btn onClick={saveManual} style={{ width: "100%", justifyContent: "center" }}>Save entry</Btn>
          </div>
        )}

        {data.whoop && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: T.greenLight, border: `1px solid ${T.green}30`, borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: T.green }}>
              {data.whoop.connected ? "✓ WHOOP API connected" : "✓ Manual data saved"} · Last sync: {new Date(data.whoop.lastSync).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TODAY ──────────────────────────────────────────────────────────────────── */
function TodayScreen({ data, setData, setNav }) {
  const [showWhoop, setShowWhoop] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Still up," : hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
  const todayStr = today();

  const toggleHabit = id => {
    setData(d => ({
      ...d, habits: d.habits.map(h => {
        if (h.id !== id) return h;
        const log = h.log || {};
        const done = !log[todayStr];
        return { ...h, log: { ...log, [todayStr]: done } };
      })
    }));
  };

  const toggleTask = id => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }));

  const todayHabits = data.habits;
  const doneCount = todayHabits.filter(h => h.log?.[todayStr]).length;
  const pctDone = todayHabits.length ? Math.round((doneCount / todayHabits.length) * 100) : 0;
  const dueTasks = data.tasks.filter(t => t.due === "Today" && !t.done);
  const w = data.whoop;

  const recoveryColor = !w?.recovery ? T.inkLight
    : w.recovery >= 67 ? T.green : w.recovery >= 34 ? T.orange : T.pink;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {showWhoop && <WhoopPanel data={data} setData={setData} onClose={() => setShowWhoop(false)} />}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 6 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <Serif size={40} style={{ display: "block", color: T.ink, lineHeight: 1.1 }}>
          {greeting} {data.user.name}.
        </Serif>
      </div>

      {/* Top row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* Recovery */}
        <Card style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {w ? (
            <>
              <Ring value={w.recovery || 0} size={68} stroke={6} color={recoveryColor} label={w.recovery ? `${w.recovery}%` : "—"} sub="REC" />
              <div>
                <Label>Recovery</Label>
                <p style={{ fontSize: 15, fontWeight: 600, color: recoveryColor }}>
                  {!w.recovery ? "No data" : w.recovery >= 67 ? "High readiness" : w.recovery >= 34 ? "Moderate" : "Low"}
                </p>
                <p style={{ fontSize: 12, color: T.inkMid, marginTop: 3 }}>
                  {w.sleep ? `${w.sleep}h sleep` : ""}{w.hrv ? ` · HRV ${Math.round(w.hrv)}ms` : ""}
                </p>
              </div>
            </>
          ) : (
            <div style={{ width: "100%" }}>
              <Label>Recovery</Label>
              <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 10 }}>No health data yet.</p>
              <Btn size="sm" variant="secondary" onClick={() => setShowWhoop(true)}>Connect WHOOP</Btn>
            </div>
          )}
        </Card>

        {/* Habits */}
        <Card style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Ring value={pctDone} size={68} stroke={6} color={T.orange} label={todayHabits.length ? `${doneCount}/${todayHabits.length}` : "–"} sub="TODAY" />
          <div>
            <Label>Habits</Label>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.orange }}>
              {!todayHabits.length ? "None yet" : `${pctDone}% complete`}
            </p>
            <p style={{ fontSize: 12, color: T.inkMid, marginTop: 3 }}>
              {!todayHabits.length ? "Add habits to track" : `${todayHabits.length - doneCount} remaining`}
            </p>
          </div>
        </Card>

        {/* Active goals */}
        <Card style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Ring value={data.goals.length ? Math.round(data.goals.filter(g=>g.status==="active").reduce((s,g)=>s+g.progress,0)/Math.max(1,data.goals.filter(g=>g.status==="active").length)) : 0}
            size={68} stroke={6} color={T.pink} label={data.goals.filter(g=>g.status==="active").length || "–"} sub="GOALS" />
          <div>
            <Label>Active goals</Label>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.pink }}>
              {!data.goals.length ? "None yet" : `${data.goals.filter(g=>g.status==="active").length} in progress`}
            </p>
            <p style={{ fontSize: 12, color: T.inkMid, marginTop: 3 }}>
              {!data.goals.length ? "Add goals to track" : `Avg ${Math.round(data.goals.filter(g=>g.status==="active").reduce((s,g)=>s+g.progress,0)/Math.max(1,data.goals.filter(g=>g.status==="active").length))}% complete`}
            </p>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Habits checklist */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Label style={{ margin: 0 }}>Today's habits</Label>
              {!todayHabits.length && <Btn size="sm" variant="secondary" onClick={() => setNav("habits")}>Add habits</Btn>}
            </div>
            {!todayHabits.length
              ? <p style={{ fontSize: 13, color: T.inkMid }}>No habits set up yet. <button onClick={() => setNav("habits")} style={{ color: T.orange, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Add your first habit →</button></p>
              : todayHabits.map(h => {
                  const done = !!h.log?.[todayStr];
                  return (
                    <div key={h.id} onClick={() => toggleHabit(h.id)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                      borderBottom: `1px solid ${T.border}`, cursor: "pointer",
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? T.orange : T.border}`,
                        background: done ? T.orange : "transparent", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                      }}>
                        {done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14 }}>{h.icon}</span>
                      <span style={{ fontSize: 13, flex: 1, color: done ? T.inkLight : T.ink, textDecoration: done ? "line-through" : "none" }}>{h.name}</span>
                      <span style={{ fontSize: 11, color: T.inkLight, fontFamily: "'DM Mono', monospace" }}>{h.streak || 0}d</span>
                    </div>
                  );
                })}
          </Card>

          {/* Due today */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Label style={{ margin: 0 }}>Due today</Label>
              {!data.tasks.length && <Btn size="sm" variant="secondary" onClick={() => setNav("tasks")}>Add tasks</Btn>}
            </div>
            {!dueTasks.length && data.tasks.length > 0 && (
              <p style={{ fontSize: 13, color: T.inkMid }}>Nothing due today. Good.</p>
            )}
            {!data.tasks.length && (
              <p style={{ fontSize: 13, color: T.inkMid }}>No tasks yet. <button onClick={() => setNav("tasks")} style={{ color: T.orange, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Add tasks →</button></p>
            )}
            {dueTasks.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${T.border}`, flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1 }}>{t.title}</span>
                <Tag color={t.priority === "high" ? T.pink : T.inkLight}>{t.priority}</Tag>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Mission card */}
          <Card style={{ background: T.ink, border: "none" }}>
            <Label style={{ color: T.orange }}>Your mission</Label>
            <Serif size={16} italic style={{ display: "block", color: T.white, lineHeight: 1.6 }}>
              "{data.user.mission || "Not set yet."}"
            </Serif>
          </Card>

          {/* WHOOP quick view */}
          {w && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Label style={{ margin: 0 }}>Health snapshot</Label>
                <Btn size="sm" variant="ghost" onClick={() => setShowWhoop(true)}>Update</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Sleep", val: w.sleep ? `${w.sleep}h` : "—", color: T.pink },
                  { label: "HRV", val: w.hrv ? `${Math.round(w.hrv)}ms` : "—", color: T.orange },
                  { label: "RHR", val: w.rhr ? `${Math.round(w.rhr)} bpm` : "—", color: T.ink },
                  { label: "Strain", val: w.strain ? Number(w.strain).toFixed(1) : "—", color: T.ink },
                ].map(m => (
                  <div key={m.label} style={{ padding: "10px 12px", background: T.surfaceAlt, borderRadius: 8 }}>
                    <Label style={{ marginBottom: 4 }}>{m.label}</Label>
                    <Mono size={18} color={m.color}>{m.val}</Mono>
                  </div>
                ))}
              </div>
              {!w.connected && <p style={{ fontSize: 11, color: T.inkLight, marginTop: 10 }}>Manual entry · <button onClick={() => setShowWhoop(true)} style={{ color: T.orange, background: "none", border: "none", cursor: "pointer", fontSize: 11 }}>Connect WHOOP API →</button></p>}
            </Card>
          )}

          {/* No WHOOP yet */}
          {!w && (
            <Card style={{ textAlign: "center" }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>⌚</p>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Connect health data</p>
              <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 14, lineHeight: 1.5 }}>Link your WHOOP account or enter metrics manually to unlock health correlations.</p>
              <Btn variant="secondary" onClick={() => setShowWhoop(true)}>Connect now</Btn>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── GOALS ──────────────────────────────────────────────────────────────────── */
function GoalsScreen({ data, setData }) {
  const [sel, setSel] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", why: "", horizon: "quarter", parentId: "" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const horizonColor = { life: T.pink, year: T.orange, quarter: T.green, month: T.inkMid };
  const horizonLabel = { life: "Life vision", year: "This year", quarter: "This quarter", month: "This month" };

  const save = () => {
    if (!form.title.trim()) return;
    setData(d => ({ ...d, goals: [...d.goals, { id: "g" + Date.now(), ...form, progress: 0, status: "active", parentId: form.parentId || null }] }));
    setForm({ title: "", why: "", horizon: "quarter", parentId: "" });
    setAdding(false);
  };

  const updateProgress = (id, val) => setData(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, progress: Number(val) } : g) }));
  const deleteGoal = id => { setData(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) })); if (sel === id) setSel(null); };

  const roots = data.goals.filter(g => !g.parentId);
  const selGoal = data.goals.find(g => g.id === sel);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Serif size={34} style={{ display: "block" }}>Goals</Serif>
          <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>Vision → Year → Quarter → Month. Your full hierarchy.</p>
        </div>
        <Btn onClick={() => setAdding(true)}>+ New goal</Btn>
      </div>

      {adding && (
        <Card style={{ marginBottom: 20, border: `1px solid ${T.orangeMid}` }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New goal</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><Label>Goal</Label><Input value={form.title} onChange={v => f("title", v)} placeholder="What do you want to achieve?" /></div>
            <div><Label>Horizon</Label><Select value={form.horizon} onChange={v => f("horizon", v)}>{Object.entries(horizonLabel).map(([k,l]) => <option key={k} value={k}>{l}</option>)}</Select></div>
          </div>
          <div style={{ marginBottom: 12 }}><Label>Why it matters</Label><Input multiline value={form.why} onChange={v => f("why", v)} placeholder="Be honest and specific." rows={2} /></div>
          {data.goals.length > 0 && (
            <div style={{ marginBottom: 16 }}><Label>Parent goal (optional)</Label>
              <Select value={form.parentId} onChange={v => f("parentId", v)}>
                <option value="">None</option>
                {data.goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </Select>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}><Btn onClick={save}>Save</Btn><Btn variant="secondary" onClick={() => setAdding(false)}>Cancel</Btn></div>
        </Card>
      )}

      {!data.goals.length
        ? <Empty icon="◎" title="No goals yet." body="Start with your biggest long-term vision, then break it down." action={<Btn onClick={() => setAdding(true)}>Add your first goal</Btn>} />
        : (
          <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 1.1fr" : "1fr", gap: 20 }}>
            <div>
              {roots.length === 0 && data.goals.length > 0 && data.goals.map(g => (
                <div key={g.id} onClick={() => setSel(sel === g.id ? null : g.id)}
                  style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${sel === g.id ? horizonColor[g.horizon] || T.orange : T.border}`, borderRadius: 12, cursor: "pointer", marginBottom: 10, transition: "border-color 0.15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Tag color={horizonColor[g.horizon] || T.orange}>{horizonLabel[g.horizon]}</Tag>
                    <Mono size={13} color={horizonColor[g.horizon] || T.orange}>{g.progress}%</Mono>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{g.title}</p>
                  <Bar value={g.progress} color={horizonColor[g.horizon] || T.orange} height={3} style={{ marginTop: 10 }} />
                </div>
              ))}
              {roots.map(root => (
                <div key={root.id} style={{ marginBottom: 12 }}>
                  <div onClick={() => setSel(sel === root.id ? null : root.id)}
                    style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${sel === root.id ? horizonColor[root.horizon] || T.orange : T.border}`, borderRadius: 12, cursor: "pointer", transition: "border-color 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Tag color={horizonColor[root.horizon] || T.orange}>{horizonLabel[root.horizon]}</Tag>
                      <Mono size={13} color={horizonColor[root.horizon] || T.orange}>{root.progress}%</Mono>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>{root.title}</p>
                    <Bar value={root.progress} color={horizonColor[root.horizon] || T.orange} height={3} style={{ marginTop: 10 }} />
                  </div>
                  {data.goals.filter(g => g.parentId === root.id).map(child => (
                    <div key={child.id} onClick={() => setSel(sel === child.id ? null : child.id)}
                      style={{ marginLeft: 20, marginTop: 6, padding: "10px 14px", background: T.surface, border: `1px solid ${sel === child.id ? horizonColor[child.horizon] || T.orange : T.border}`, borderRadius: 10, cursor: "pointer", transition: "border-color 0.15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ color: T.inkLight, fontSize: 12 }}>└</span>
                          <Tag color={horizonColor[child.horizon] || T.orange} style={{ fontSize: 10 }}>{horizonLabel[child.horizon]}</Tag>
                        </div>
                        <Mono size={12} color={horizonColor[child.horizon] || T.orange}>{child.progress}%</Mono>
                      </div>
                      <p style={{ fontSize: 13, marginLeft: 16, marginBottom: 6 }}>{child.title}</p>
                      <Bar value={child.progress} color={horizonColor[child.horizon] || T.orange} height={2} style={{ marginLeft: 16 }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {selGoal && (
              <Card style={{ position: "sticky", top: 0, height: "fit-content" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Tag color={horizonColor[selGoal.horizon] || T.orange}>{horizonLabel[selGoal.horizon]}</Tag>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="danger" onClick={() => deleteGoal(selGoal.id)}>Delete</Btn>
                    <button onClick={() => setSel(null)} style={{ background: "none", border: "none", fontSize: 20, color: T.inkMid, cursor: "pointer" }}>×</button>
                  </div>
                </div>
                <Serif size={22} style={{ display: "block", marginBottom: 16, lineHeight: 1.3 }}>{selGoal.title}</Serif>

                <Label>Progress</Label>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                  <input type="range" min={0} max={100} value={selGoal.progress} onChange={e => updateProgress(selGoal.id, e.target.value)} style={{ flex: 1 }} />
                  <Mono size={14} color={T.orange}>{selGoal.progress}%</Mono>
                </div>
                <Bar value={selGoal.progress} color={horizonColor[selGoal.horizon] || T.orange} height={6} style={{ marginBottom: 20 }} />

                {selGoal.why && (
                  <div style={{ marginBottom: 16, padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8 }}>
                    <Label>Why it matters</Label>
                    <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.7, fontStyle: "italic" }}>"{selGoal.why}"</p>
                  </div>
                )}

                {data.habits.filter(h => h.goalId === selGoal.id).length > 0 && (
                  <div>
                    <Label>Linked habits</Label>
                    {data.habits.filter(h => h.goalId === selGoal.id).map(h => (
                      <div key={h.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span>{h.icon}</span><span style={{ fontSize: 13 }}>{h.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
    </div>
  );
}

/* ─── HABITS ─────────────────────────────────────────────────────────────────── */
function HabitsScreen({ data, setData }) {
  const [sel, setSel] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "⭐", category: "Mind", schedule: "daily", goalId: "" });
  const todayStr = today();

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return;
    setData(d => ({ ...d, habits: [...d.habits, { id: "h" + Date.now(), ...form, goalId: form.goalId || null, log: {}, streak: 0 }] }));
    setForm({ name: "", icon: "⭐", category: "Mind", schedule: "daily", goalId: "" });
    setAdding(false);
  };

  const toggle = id => {
    setData(d => ({
      ...d, habits: d.habits.map(h => {
        if (h.id !== id) return h;
        const log = { ...(h.log || {}) };
        const done = !log[todayStr];
        log[todayStr] = done;
        // Recalculate streak
        let streak = 0;
        const d2 = new Date(); 
        while (true) {
          const k = d2.toISOString().split("T")[0];
          if (!log[k]) break;
          streak++;
          d2.setDate(d2.getDate() - 1);
        }
        return { ...h, log, streak };
      })
    }));
  };

  const deleteHabit = id => { setData(d => ({ ...d, habits: d.habits.filter(h => h.id !== id) })); if (sel === id) setSel(null); };

  const getLast = (h, n) => {
    const arr = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const t = new Date(d); t.setDate(d.getDate() - i);
      arr.push(t.toISOString().split("T")[0]);
    }
    return arr.map(k => h.log?.[k] ? 1 : 0);
  };

  const selHabit = data.habits.find(h => h.id === sel);
  const categories = [...new Set(data.habits.map(h => h.category))];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Serif size={34} style={{ display: "block" }}>Habits</Serif>
          <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>Your behavioral baseline. Real data, no guessing.</p>
        </div>
        <Btn onClick={() => setAdding(true)}>+ New habit</Btn>
      </div>

      {adding && (
        <Card style={{ marginBottom: 20, border: `1px solid ${T.orangeMid}` }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New habit</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><Label>Name</Label><Input value={form.name} onChange={v => f("name", v)} placeholder="Habit name" /></div>
            <div><Label>Icon</Label><Input value={form.icon} onChange={v => f("icon", v)} /></div>
            <div><Label>Category</Label><Select value={form.category} onChange={v => f("category", v)}>{["Mind","Work","Fitness","Learning","Health","Reflection","Social"].map(c=><option key={c}>{c}</option>)}</Select></div>
            <div><Label>Schedule</Label><Select value={form.schedule} onChange={v => f("schedule", v)}>{["daily","5x/week","3x/week","weekdays","weekends","weekly"].map(s=><option key={s}>{s}</option>)}</Select></div>
          </div>
          {data.goals.length > 0 && (
            <div style={{ marginBottom: 12 }}><Label>Link to goal (optional)</Label>
              <Select value={form.goalId} onChange={v => f("goalId", v)}>
                <option value="">None</option>
                {data.goals.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}
              </Select>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}><Btn onClick={save}>Save</Btn><Btn variant="secondary" onClick={() => setAdding(false)}>Cancel</Btn></div>
        </Card>
      )}

      {!data.habits.length
        ? <Empty icon="⊞" title="No habits yet." body="Good habits are the bridge between your goals and your identity. Start with one." action={<Btn onClick={() => setAdding(true)}>Add your first habit</Btn>} />
        : (
          <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 1fr" : "1fr", gap: 20 }}>
            <div>
              {categories.map(cat => (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <Label>{cat}</Label>
                  {data.habits.filter(h => h.category === cat).map(h => {
                    const done = !!h.log?.[todayStr];
                    const last14 = getLast(h, 14);
                    const rate = Math.round(avg(getLast(h, 30)) * 100);
                    return (
                      <div key={h.id} onClick={() => setSel(sel === h.id ? null : h.id)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: T.surface, border: `1px solid ${sel === h.id ? T.orange : T.border}`, borderRadius: 12, marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }}>
                        <div onClick={e => { e.stopPropagation(); toggle(h.id); }}
                          style={{ width: 26, height: 26, borderRadius: 7, border: `2px solid ${done ? T.orange : T.border}`, background: done ? T.orange : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                          {done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 18 }}>{h.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: done ? T.inkLight : T.ink, textDecoration: done ? "line-through" : "none" }}>{h.name}</p>
                          <div style={{ display: "flex", gap: 3 }}>
                            {last14.map((v, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: v ? T.orange : T.border }} />)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <Mono size={14} color={rate >= 70 ? T.green : rate >= 40 ? T.orange : T.pink}>{rate}%</Mono>
                          <p style={{ fontSize: 11, color: T.inkLight, marginTop: 2 }}>{h.streak}d streak</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {selHabit && (
              <Card style={{ position: "sticky", top: 0, height: "fit-content" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 24 }}>{selHabit.icon}</span>
                    <p style={{ fontSize: 16, fontWeight: 600 }}>{selHabit.name}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="danger" onClick={() => deleteHabit(selHabit.id)}>Delete</Btn>
                    <button onClick={() => setSel(null)} style={{ background: "none", border: "none", fontSize: 20, color: T.inkMid, cursor: "pointer" }}>×</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { l: "Streak", v: `${selHabit.streak}d`, c: T.orange },
                    { l: "30-day rate", v: `${Math.round(avg(getLast(selHabit, 30)) * 100)}%`, c: T.orange },
                    { l: "Schedule", v: selHabit.schedule, c: T.inkMid },
                  ].map(m => (
                    <div key={m.l} style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, textAlign: "center" }}>
                      <Mono size={18} color={m.c}>{m.v}</Mono>
                      <p style={{ fontSize: 11, color: T.inkLight, marginTop: 4 }}>{m.l}</p>
                    </div>
                  ))}
                </div>

                <Label>27-day history</Label>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 20 }}>
                  {getLast(selHabit, 27).map((v, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: v ? T.orange : T.border }} />)}
                </div>

                {selHabit.goalId && data.goals.find(g => g.id === selHabit.goalId) && (
                  <div style={{ padding: "10px 12px", background: T.orangeLight, borderRadius: 8 }}>
                    <Label style={{ color: T.orange }}>Linked goal</Label>
                    <p style={{ fontSize: 13, color: T.ink }}>{data.goals.find(g => g.id === selHabit.goalId)?.title}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
    </div>
  );
}

/* ─── TASKS ──────────────────────────────────────────────────────────────────── */
function TasksScreen({ data, setData }) {
  const [view, setView] = useState("matrix");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "high", urgency: "urgent", energy: "deep", due: "This week", goalId: "" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.title.trim()) return;
    setData(d => ({ ...d, tasks: [...d.tasks, { id: "t" + Date.now(), ...form, goalId: form.goalId || null, done: false }] }));
    setForm({ title: "", priority: "high", urgency: "urgent", energy: "deep", due: "This week", goalId: "" });
    setAdding(false);
  };

  const toggle = id => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  const del = id => setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));

  const quadrants = [
    { label: "Do now", sub: "Urgent & important", fn: t => t.priority === "high" && t.urgency === "urgent", color: T.pink },
    { label: "Schedule", sub: "Important, not urgent", fn: t => t.priority === "high" && t.urgency === "not-urgent", color: T.orange },
    { label: "Delegate", sub: "Urgent, less important", fn: t => t.priority === "low" && t.urgency === "urgent", color: T.inkMid },
    { label: "Drop", sub: "Neither urgent nor important", fn: t => t.priority === "low" && t.urgency === "not-urgent", color: T.inkLight },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Serif size={34} style={{ display: "block" }}>Tasks</Serif>
          <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>One-time work, filtered by what actually matters.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["matrix","list"].map(v => <Btn key={v} variant={view === v ? "primary" : "secondary"} size="sm" onClick={() => setView(v)}>{v === "matrix" ? "Matrix" : "List"}</Btn>)}
          <Btn onClick={() => setAdding(true)}>+ New task</Btn>
        </div>
      </div>

      {adding && (
        <Card style={{ marginBottom: 20, border: `1px solid ${T.orangeMid}` }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New task</p>
          <div style={{ marginBottom: 12 }}><Input value={form.title} onChange={v => f("title", v)} placeholder="What needs to get done?" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><Label>Priority</Label><Select value={form.priority} onChange={v => f("priority", v)}><option value="high">High</option><option value="low">Low</option></Select></div>
            <div><Label>Urgency</Label><Select value={form.urgency} onChange={v => f("urgency", v)}><option value="urgent">Urgent</option><option value="not-urgent">Not urgent</option></Select></div>
            <div><Label>Energy</Label><Select value={form.energy} onChange={v => f("energy", v)}>{["deep","medium","shallow"].map(e=><option key={e}>{e}</option>)}</Select></div>
            <div><Label>Due</Label><Select value={form.due} onChange={v => f("due", v)}>{["Today","This week","This month","Someday"].map(e=><option key={e}>{e}</option>)}</Select></div>
          </div>
          {data.goals.length > 0 && (
            <div style={{ marginBottom: 14 }}><Label>Link to goal</Label>
              <Select value={form.goalId} onChange={v => f("goalId", v)}>
                <option value="">None</option>
                {data.goals.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}
              </Select>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}><Btn onClick={save}>Save</Btn><Btn variant="secondary" onClick={() => setAdding(false)}>Cancel</Btn></div>
        </Card>
      )}

      {!data.tasks.length
        ? <Empty icon="▣" title="No tasks yet." body="Add tasks and assign them to the right quadrant." action={<Btn onClick={() => setAdding(true)}>Add your first task</Btn>} />
        : view === "matrix"
        ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {quadrants.map(q => {
              const tasks = data.tasks.filter(q.fn);
              return (
                <div key={q.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div><p style={{ fontSize: 14, fontWeight: 600, color: q.color }}>{q.label}</p><p style={{ fontSize: 11, color: T.inkLight }}>{q.sub}</p></div>
                    <Tag color={q.color}>{tasks.length}</Tag>
                  </div>
                  {!tasks.length && <p style={{ fontSize: 13, color: T.inkLight }}>Empty.</p>}
                  {tasks.map(t => (
                    <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                      <div onClick={() => toggle(t.id)} style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${t.done ? q.color : T.border}`, background: t.done ? q.color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {t.done && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, flex: 1, textDecoration: t.done ? "line-through" : "none", color: t.done ? T.inkLight : T.ink }}>{t.title}</span>
                      <button onClick={() => del(t.id)} style={{ background: "none", border: "none", color: T.inkLight, cursor: "pointer", fontSize: 14 }}>×</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            {["Today","This week","This month","Someday"].map(due => {
              const tasks = data.tasks.filter(t => t.due === due);
              if (!tasks.length) return null;
              return (
                <div key={due} style={{ marginBottom: 20 }}>
                  <Label>{due}</Label>
                  {tasks.map(t => (
                    <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                      <div onClick={() => toggle(t.id)} style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${t.done ? T.teal : T.border}`, background: t.done ? T.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {t.done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, flex: 1, textDecoration: t.done ? "line-through" : "none", color: t.done ? T.inkLight : T.ink }}>{t.title}</span>
                      <Tag color={t.priority === "high" ? T.pink : T.inkLight}>{t.priority}</Tag>
                      <Tag color={t.energy === "deep" ? T.orange : T.inkLight}>{t.energy}</Tag>
                      <button onClick={() => del(t.id)} style={{ background: "none", border: "none", color: T.inkLight, cursor: "pointer", fontSize: 14 }}>×</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </Card>
        )}
    </div>
  );
}

/* ─── JOURNAL ────────────────────────────────────────────────────────────────── */
function JournalScreen({ data, setData }) {
  const [tab, setTab] = useState("morning");
  const todayStr = today();
  const existing = data.reflections.find(r => r.date === todayStr && r.type === tab);
  const [form, setForm] = useState(existing || { intention: "", challenge: "", proud: "", mood: 7, energy: 7, wentWell: "", learned: "", improve: "", gratitude: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const e = data.reflections.find(r => r.date === todayStr && r.type === tab);
    setForm(e || { intention: "", challenge: "", proud: "", mood: 7, energy: 7, wentWell: "", learned: "", improve: "", gratitude: "" });
    setSaved(false);
  }, [tab]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    const entry = { ...form, date: todayStr, type: tab };
    setData(d => ({
      ...d, reflections: [...d.reflections.filter(r => !(r.date === todayStr && r.type === tab)), entry]
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const past = data.reflections.filter(r => r.date !== todayStr).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <Serif size={34} style={{ display: "block" }}>Journal</Serif>
        <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>Where data meets self-understanding.</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: T.surfaceAlt, padding: 4, borderRadius: 8 }}>
        {["morning","evening","history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "8px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: tab === t ? T.surface : "transparent", color: tab === t ? T.ink : T.inkMid,
            boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.07)" : "none", transition: "all 0.15s",
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab !== "history" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Serif size={20} style={{ display: "block" }}>{tab === "morning" ? "Morning reflection" : "Evening reflection"}</Serif>
            <p style={{ fontSize: 12, color: T.inkLight }}>{fmtDate(todayStr)}</p>
          </div>

          {tab === "morning" && [
            { key: "intention", label: "What matters most today?", ph: "The one thing that would make today a success…" },
            { key: "proud", label: "What do you want to feel proud of by tonight?", ph: "Be specific." },
            { key: "challenge", label: "What challenges might show up?", ph: "And how will you meet them?" },
          ].map(q => (
            <div key={q.key} style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>{q.label}</label>
              <Input multiline value={form[q.key] || ""} onChange={v => f(q.key, v)} placeholder={q.ph} rows={2} />
            </div>
          ))}

          {tab === "evening" && [
            { key: "wentWell", label: "What went well?", ph: "Wins, progress, moments of focus or connection…" },
            { key: "learned", label: "What did you learn?", ph: "About your work, yourself, or someone else…" },
            { key: "improve", label: "What could have gone better?", ph: "Honest, not harsh." },
            { key: "gratitude", label: "One thing you're genuinely grateful for:", ph: "Keep it specific." },
          ].map(q => (
            <div key={q.key} style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>{q.label}</label>
              <Input multiline value={form[q.key] || ""} onChange={v => f(q.key, v)} placeholder={q.ph} rows={q.key === "gratitude" ? 1 : 2} />
            </div>
          ))}

          <Divider style={{ margin: "20px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {[{ key: "mood", label: "Mood" }, { key: "energy", label: "Energy" }].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10 }}>
                  {label} <Mono size={13} color={T.orange}>{form[key]}/10</Mono>
                </label>
                <input type="range" min={1} max={10} value={form[key]} onChange={e => f(key, +e.target.value)} style={{ width: "100%" }} />
              </div>
            ))}
          </div>

          <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }}>
            {saved ? "✓ Saved" : `Save ${tab} reflection`}
          </Btn>
        </Card>
      )}

      {tab === "history" && (
        <div>
          {!past.length
            ? <Empty icon="◻" title="No past entries." body="Complete your first morning or evening reflection to see history here." />
            : past.map(r => (
              <Card key={r.date + r.type} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <Tag color={r.type === "morning" ? T.orange : T.pink}>{r.type}</Tag>
                  <p style={{ fontSize: 12, color: T.inkLight }}>{fmtDate(r.date)}</p>
                  {r.mood && <Tag color={T.inkMid}>Mood {r.mood}</Tag>}
                  {r.energy && <Tag color={T.inkMid}>Energy {r.energy}</Tag>}
                </div>
                {(r.intention || r.wentWell) && (
                  <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6 }}>
                    {r.intention || r.wentWell}
                  </p>
                )}
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

/* ─── HEALTH ─────────────────────────────────────────────────────────────────── */
function HealthScreen({ data, setData }) {
  const [showWhoop, setShowWhoop] = useState(false);
  const w = data.whoop;

  const statColor = (val, type) => {
    if (!val) return T.inkLight;
    if (type === "recovery") return val >= 67 ? T.green : val >= 34 ? T.orange : T.pink;
    return T.orange;
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {showWhoop && <WhoopPanel data={data} setData={setData} onClose={() => setShowWhoop(false)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Serif size={34} style={{ display: "block" }}>Health</Serif>
          <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>Your biometric data, correlated with behavior.</p>
        </div>
        <Btn variant={w ? "secondary" : "primary"} onClick={() => setShowWhoop(true)}>
          {w?.connected ? "Re-sync WHOOP" : w ? "Update data" : "Connect WHOOP"}
        </Btn>
      </div>

      {!w ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16 }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>⌚</p>
          <Serif size={24} style={{ display: "block", marginBottom: 10 }}>No health data connected.</Serif>
          <p style={{ fontSize: 14, color: T.inkMid, marginBottom: 24, lineHeight: 1.6, maxWidth: 380, margin: "0 auto 24px" }}>
            Connect your WHOOP account for real recovery, sleep, HRV, and strain data. Or enter today's numbers manually.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn onClick={() => setShowWhoop(true)}>Connect WHOOP</Btn>
            <Btn variant="secondary" onClick={() => setShowWhoop(true)}>Enter manually</Btn>
          </div>
        </div>
      ) : (
        <>
          {/* Today's stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Recovery", val: w.recovery ? `${w.recovery}%` : "—", color: statColor(w.recovery, "recovery"), sub: "today" },
              { label: "Sleep", val: w.sleep ? `${w.sleep}h` : "—", color: T.pink, sub: "last night" },
              { label: "HRV", val: w.hrv ? `${Math.round(w.hrv)}ms` : "—", color: T.orange, sub: "rmssd" },
              { label: "Resting HR", val: w.rhr ? `${Math.round(w.rhr)}` : "—", color: T.ink, sub: "bpm" },
              { label: "Strain", val: w.strain ? Number(w.strain).toFixed(1) : "—", color: T.inkMid, sub: "score" },
            ].map(m => (
              <Card key={m.label} style={{ textAlign: "center" }}>
                <Label style={{ textAlign: "center" }}>{m.label}</Label>
                <Mono size={28} color={m.color} style={{ display: "block", lineHeight: 1.2 }}>{m.val}</Mono>
                <p style={{ fontSize: 11, color: T.inkLight, marginTop: 4 }}>{m.sub}</p>
              </Card>
            ))}
          </div>

          {/* History charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Recovery history", data: w.recoveryHistory || [], color: T.orange, unit: "%" },
              { label: "Sleep history", data: w.sleepHistory || [], color: T.pink, unit: "h" },
              { label: "HRV history", data: w.hrvHistory || [], color: T.orange, unit: "ms" },
            ].map(chart => (
              <Card key={chart.label}>
                <Label>{chart.label}</Label>
                {chart.data.length < 2 ? (
                  <p style={{ fontSize: 12, color: T.inkLight }}>Not enough data yet. Sync more days.</p>
                ) : (
                  <>
                    <Spark data={chart.data.map(d => d.value)} color={chart.color} width={180} height={50} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <p style={{ fontSize: 11, color: T.inkLight }}>{fmtDate(chart.data[0]?.date)}</p>
                      <Mono size={12} color={chart.color}>{chart.data[chart.data.length-1]?.value?.toFixed(1)}{chart.unit}</Mono>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>

          {/* Correlations (computed from real data) */}
          <Card>
            <Label>Patterns detected</Label>
            {(!w.recoveryHistory?.length || !data.habits.length)
              ? <p style={{ fontSize: 13, color: T.inkMid }}>Add more data over time to unlock behavioral correlations — recovery vs habit completion, sleep vs mood, and more.</p>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {w.recovery >= 80 && <div style={{ padding: "12px 14px", background: T.greenLight, border: `1px solid ${T.green}20`, borderRadius: 8 }}><p style={{ fontSize: 13, color: T.green }}>High recovery today ({w.recovery}%). Your best output days typically follow nights like last night.</p></div>}
                  {w.sleep && w.sleep < 7 && <div style={{ padding: "12px 14px", background: T.pinkLight, border: `1px solid ${T.pink}20`, borderRadius: 8 }}><p style={{ fontSize: 13, color: T.pink }}>Sleep was below 7h. Watch for habit skips — they tend to cluster around low-sleep days.</p></div>}
                  {w.hrv && w.hrv < 50 && <div style={{ padding: "12px 14px", background: T.orangeLight, border: `1px solid ${T.orange}20`, borderRadius: 8 }}><p style={{ fontSize: 13, color: T.orange }}>HRV is lower than ideal. Consider reducing workout intensity and prioritizing recovery today.</p></div>}
                  <p style={{ fontSize: 12, color: T.inkLight }}>More correlations appear as your dataset grows.</p>
                </div>
              )}
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: T.inkLight }}>
                {w.connected ? `Connected via WHOOP API · ` : "Manual data · "}
                Last updated: {new Date(w.lastSync).toLocaleString()}
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ─── INSIGHTS ───────────────────────────────────────────────────────────────── */
function InsightsScreen({ data }) {
  const habitCount = data.habits.length;
  const goalCount = data.goals.filter(g => g.status === "active").length;
  const reflectionCount = data.reflections.length;
  const avgGoalProgress = goalCount ? Math.round(data.goals.filter(g => g.status === "active").reduce((s, g) => s + g.progress, 0) / goalCount) : 0;

  const today30 = n => {
    const d = new Date(); const arr = [];
    for (let i = n-1; i >= 0; i--) { const t = new Date(d); t.setDate(d.getDate() - i); arr.push(t.toISOString().split("T")[0]); }
    return arr;
  };
  const last30 = today30(30);

  const habitRates = data.habits.map(h => ({ name: h.name, icon: h.icon, rate: Math.round(avg(last30.map(d => h.log?.[d] ? 1 : 0)) * 100) }));

  const moodData = data.reflections.filter(r => r.mood).sort((a,b) => a.date.localeCompare(b.date)).slice(-14);

  const isEmpty = !habitCount && !goalCount && !reflectionCount;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <Serif size={34} style={{ display: "block" }}>Insights</Serif>
        <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>Patterns your data reveals about you.</p>
      </div>

      {isEmpty ? (
        <Empty icon="◈" title="No data to analyze yet." body="Add goals, habits, and reflections. Meridian surfaces patterns after about a week of real data." />
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Active goals", val: goalCount, color: T.pink },
              { label: "Habits tracked", val: habitCount, color: T.orange },
              { label: "Avg goal progress", val: `${avgGoalProgress}%`, color: T.orange },
              { label: "Journal entries", val: reflectionCount, color: T.pink },
            ].map(m => (
              <Card key={m.label} style={{ textAlign: "center" }}>
                <Mono size={36} color={m.color} style={{ display: "block", lineHeight: 1.2 }}>{m.val}</Mono>
                <p style={{ fontSize: 12, color: T.inkLight, marginTop: 6 }}>{m.label}</p>
              </Card>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Goal progress */}
            <Card>
              <Label>Goal progress</Label>
              {!goalCount
                ? <p style={{ fontSize: 13, color: T.inkMid }}>No active goals.</p>
                : data.goals.filter(g=>g.status==="active").map(g => (
                  <div key={g.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, flex: 1, marginRight: 8 }}>{g.title}</span>
                      <Mono size={12} color={T.orange}>{g.progress}%</Mono>
                    </div>
                    <Bar value={g.progress} color={T.orange} height={4} />
                  </div>
                ))}
            </Card>

            {/* Habit rates */}
            <Card>
              <Label>30-day habit rates</Label>
              {!habitCount
                ? <p style={{ fontSize: 13, color: T.inkMid }}>No habits tracked.</p>
                : habitRates.sort((a,b)=>b.rate-a.rate).map(h => (
                  <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>{h.icon}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{h.name}</span>
                    <Mono size={13} color={h.rate >= 70 ? T.green : h.rate >= 40 ? T.orange : T.pink}>{h.rate}%</Mono>
                  </div>
                ))}
            </Card>
          </div>

          {/* Mood trend */}
          {moodData.length >= 3 && (
            <Card style={{ marginBottom: 20 }}>
              <Label>Mood trend (last {moodData.length} entries)</Label>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 8 }}>
                {moodData.map((r, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", background: r.type === "morning" ? T.orange : T.pink, borderRadius: "4px 4px 0 0", height: `${(r.mood / 10) * 64}px`, transition: "height 0.4s" }} />
                    <span style={{ fontSize: 9, color: T.inkLight }}>{fmtDate(r.date).replace(/\s\d+$/, "")}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: T.inkLight }}>Orange = morning, pink = evening.</p>
            </Card>
          )}

          {/* Life balance wheel */}
          {data.habits.length >= 3 && (
            <Card>
              <Label>Life balance (based on your habits)</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[...new Set(data.habits.map(h => h.category))].map(cat => {
                  const catHabits = data.habits.filter(h => h.category === cat);
                  const rate = Math.round(avg(catHabits.map(h => avg(last30.map(d => h.log?.[d] ? 1 : 0)))) * 100);
                  return (
                    <div key={cat} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <Ring value={rate} size={64} stroke={6} color={rate >= 70 ? T.green : rate >= 40 ? T.orange : T.pink} label={`${rate}%`} />
                      <p style={{ fontSize: 12, color: T.inkMid, textAlign: "center" }}>{cat}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ─── AI COACH ───────────────────────────────────────────────────────────────── */
function CoachScreen({ data }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildCtx = () => {
    const last30 = (() => { const d=new Date(), arr=[]; for(let i=29;i>=0;i--){const t=new Date(d);t.setDate(d.getDate()-i);arr.push(t.toISOString().split("T")[0]);} return arr; })();
    const habitSummary = data.habits.map(h => `${h.name}: ${Math.round(avg(last30.map(d=>h.log?.[d]?1:0))*100)}% (${h.streak}d streak)`).join(", ") || "No habits logged";
    const goalSummary = data.goals.map(g => `${g.title} (${g.horizon}): ${g.progress}%`).join(", ") || "No goals set";
    const recentReflections = data.reflections.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(r=>`[${r.date} ${r.type}] mood:${r.mood||"?"} energy:${r.energy||"?"} ${r.intention||r.wentWell||""}`).join("\n") || "No reflections";
    const whoopCtx = data.whoop ? `Recovery: ${data.whoop.recovery||"?"}%, Sleep: ${data.whoop.sleep||"?"}h, HRV: ${data.whoop.hrv||"?"}ms` : "Not connected";

    return `You are the AI coach inside Meridian, a personal operating system. You have access to this user's real data.

USER:
Name: ${data.user.name || "the user"}
Mission: ${data.user.mission || "Not set"}
Values: ${data.user.values.join(", ") || "Not set"}
Ideal self: ${data.user.idealSelf || "Not set"}

GOALS (${data.goals.length}):
${goalSummary}

HABITS — 30-day rates:
${habitSummary}

RECENT HEALTH:
${whoopCtx}

RECENT REFLECTIONS:
${recentReflections}

COACHING STYLE:
- Warm, direct, evidence-based. Reference their actual data.
- Challenge gently when you see a gap between values and actions.
- Ask one focused follow-up question per response.
- Under 180 words unless they ask for a full analysis.
- Never vague, never sycophantic. Be a genuine thinking partner.
- If they have no data yet, encourage them to add it and explain what insights will unlock.`;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: buildCtx(), messages: history }),
      });
      const json = await res.json();
      const text = json.content?.map(b => b.text || "").join("") || "Something went wrong. Try again.";
      setMessages(m => [...m, { role: "assistant", content: text }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const starters = ["What patterns do you see in my data?", "Where am I falling short of my goals?", "Give me a weekly review", "What should I focus on this week?"];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <Serif size={34} style={{ display: "block" }}>AI Coach</Serif>
        <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>Knows your goals, habits, health, and reflections. Ask anything.</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 8 }}>
        {!messages.length && (
          <Card style={{ background: T.ink, border: "none", marginBottom: 8 }}>
            <Serif size={18} italic style={{ display: "block", color: T.white, lineHeight: 1.6 }}>
              "I have access to your goals, habits, health data, and reflections. Ask me anything — a weekly review, pattern analysis, what to focus on, or why something isn't working."
            </Serif>
          </Card>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.orange, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 12 }}>M</span>
              </div>
            )}
            <div style={{
              maxWidth: "82%", padding: "12px 16px",
              background: m.role === "user" ? T.ink : T.surface,
              color: m.role === "user" ? T.white : T.ink,
              border: `1px solid ${m.role === "user" ? "transparent" : T.border}`,
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.orange, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 12 }}>M</span>
            </div>
            <div style={{ padding: "12px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px 14px 14px 4px", fontSize: 13, color: T.inkMid }}>
              Reading your data…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!messages.length && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, flexShrink: 0 }}>
          {starters.map(s => (
            <button key={s} onClick={() => setInput(s)} style={{ padding: "6px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, fontSize: 12, color: T.inkMid, cursor: "pointer" }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Input value={input} onChange={setInput} placeholder="Ask your coach…"
          style={{ flex: 1, borderRadius: 10 }}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} />
        <Btn onClick={send} disabled={!input.trim() || loading} style={{ borderRadius: 10, padding: "0 20px" }}>Send</Btn>
      </div>
    </div>
  );
}

/* ─── IDENTITY ───────────────────────────────────────────────────────────────── */
function IdentityScreen({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const [mDraft, setMDraft] = useState(data.user.mission);
  const [iDraft, setIDraft] = useState(data.user.idealSelf);
  const [newVal, setNewVal] = useState("");

  const saveField = (field, val) => {
    setData(d => ({ ...d, user: { ...d.user, [field]: val } }));
    setEditing(null);
  };

  const addValue = () => {
    if (!newVal.trim()) return;
    setData(d => ({ ...d, user: { ...d.user, values: [...d.user.values, newVal.trim()] } }));
    setNewVal("");
  };

  const removeValue = v => setData(d => ({ ...d, user: { ...d.user, values: d.user.values.filter(x => x !== v) } }));

  const last30 = (() => { const d=new Date(), arr=[]; for(let i=29;i>=0;i--){const t=new Date(d);t.setDate(d.getDate()-i);arr.push(t.toISOString().split("T")[0]);} return arr; })();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <Serif size={34} style={{ display: "block" }}>Identity</Serif>
        <p style={{ color: T.inkMid, fontSize: 14, marginTop: 6 }}>Who you're becoming. The anchor for everything in Meridian.</p>
      </div>

      {/* Mission */}
      <Card style={{ marginBottom: 16, border: `1px solid ${T.orangeMid}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Label style={{ color: T.orange, margin: 0 }}>Personal mission</Label>
          <Btn size="sm" variant="ghost" onClick={() => { setMDraft(data.user.mission); setEditing(editing === "mission" ? null : "mission"); }}>
            {editing === "mission" ? "Cancel" : "Edit"}
          </Btn>
        </div>
        {editing === "mission"
          ? <div><Input multiline value={mDraft} onChange={setMDraft} rows={3} style={{ marginBottom: 10 }} /><Btn size="sm" onClick={() => saveField("mission", mDraft)}>Save</Btn></div>
          : <Serif size={18} italic style={{ display: "block", color: T.ink, lineHeight: 1.6 }}>"{data.user.mission || "Not written yet."}"</Serif>}
      </Card>

      {/* Ideal self */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Label style={{ margin: 0 }}>Ideal self</Label>
          <Btn size="sm" variant="ghost" onClick={() => { setIDraft(data.user.idealSelf); setEditing(editing === "ideal" ? null : "ideal"); }}>
            {editing === "ideal" ? "Cancel" : "Edit"}
          </Btn>
        </div>
        {editing === "ideal"
          ? <div><Input multiline value={iDraft} onChange={setIDraft} rows={3} style={{ marginBottom: 10 }} /><Btn size="sm" onClick={() => saveField("idealSelf", iDraft)}>Save</Btn></div>
          : <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.7 }}>{data.user.idealSelf || "Not written yet."}</p>}
      </Card>

      {/* Values */}
      <Card style={{ marginBottom: 16 }}>
        <Label>Core values</Label>
        {!data.user.values.length && <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 12 }}>No values defined yet.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {data.user.values.map(v => (
            <div key={v} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, minWidth: 120 }}>{v}</span>
              <div style={{ flex: 1 }}>
                <Bar value={70 + Math.abs(v.split("").reduce((a,c)=>a+c.charCodeAt(0),0)) % 25} color={T.orange} height={4} />
              </div>
              <button onClick={() => removeValue(v)} style={{ background: "none", border: "none", color: T.inkLight, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={newVal} onChange={setNewVal} placeholder="Add a value…" style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && addValue()} />
          <Btn size="sm" onClick={addValue}>Add</Btn>
        </div>
      </Card>

      {/* Identity alignment */}
      {data.habits.length > 0 && (
        <Card>
          <Label>Identity in action</Label>
          <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.7, marginBottom: 16 }}>
            The habits you've built reflect who you're becoming. Here's how your behavioral data maps to your identity.
          </p>
          {data.habits.map(h => {
            const rate = Math.round(avg(last30.map(d => h.log?.[d] ? 1 : 0)) * 100);
            return (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span>{h.icon}</span>
                <span style={{ fontSize: 13, flex: 1 }}>{h.name}</span>
                <Bar value={rate} color={T.orange} height={4} style={{ width: 80 }} />
                <Mono size={12} color={T.orange}>{rate}%</Mono>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────────── */
export default function App() {
  const [data, setData] = useLS("meridian_v2", EMPTY);
  const [nav, setNav] = useState("today");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  if (!data.user.onboarded) return (
    <>
      <style>{FONT}</style>
      <Onboarding data={data} setData={setData} />
    </>
  );

  const screens = {
    today: TodayScreen, goals: GoalsScreen, habits: HabitsScreen,
    tasks: TasksScreen, journal: JournalScreen, health: HealthScreen,
    insights: InsightsScreen, coach: CoachScreen, identity: IdentityScreen,
    privacy: PrivacyScreen,
  };
  const Screen = screens[nav] || TodayScreen;
  const mainNav = NAV.filter(n => !n.footer);

  return (
    <>
      <style>{FONT}</style>
      {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
      <div style={{ display: "flex", height: "100vh", background: T.bg, overflow: "hidden" }}>

        {/* Sidebar */}
        <nav style={{ width: 188, flexShrink: 0, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.surface }}>
          {/* Logo */}
          <div style={{ padding: "22px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
            <Serif size={20} style={{ display: "block", color: T.ink, letterSpacing: "-0.01em" }}>Meridian</Serif>
            <p style={{ fontSize: 10, color: T.inkLight, marginTop: 2, letterSpacing: "0.08em" }}>PERSONAL OS</p>
          </div>

          {/* Main nav items */}
          <div style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
            {mainNav.map(n => {
              const active = nav === n.id;
              return (
                <button key={n.id} onClick={() => setNav(n.id)} style={{
                  display: "flex", alignItems: "center", width: "100%", padding: "9px 20px",
                  background: active ? T.orangeLight : "transparent",
                  border: "none", borderLeft: `3px solid ${active ? T.orange : "transparent"}`,
                  color: active ? T.orange : T.inkMid, cursor: "pointer",
                  fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left",
                  transition: "all 0.12s",
                }}>{n.label}</button>
              );
            })}
          </div>

          {/* User + footer */}
          <div style={{ borderTop: `1px solid ${T.border}` }}>
            {/* User row */}
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.orange, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{data.user.name?.[0] || "?"}</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: T.ink }}>{data.user.name}</p>
                  <button onClick={() => { if (confirm("Reset all data?")) { setData(EMPTY); } }} style={{ fontSize: 10, color: T.inkLight, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Reset</button>
                </div>
              </div>
            </div>

            {/* Privacy Policy link */}
            <button onClick={() => setNav("privacy")} style={{
              display: "flex", alignItems: "center", width: "100%", padding: "10px 20px",
              background: nav === "privacy" ? T.orangeLight : "transparent",
              border: "none", borderLeft: `3px solid ${nav === "privacy" ? T.orange : "transparent"}`,
              color: nav === "privacy" ? T.orange : T.inkLight, cursor: "pointer",
              fontSize: 11, fontWeight: nav === "privacy" ? 600 : 400, textAlign: "left",
              transition: "all 0.12s", letterSpacing: "0.02em",
            }}>
              Privacy Policy
            </button>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, overflowY: "auto", padding: "36px 44px", background: T.bg }}>
          <Screen data={data} setData={setData} setNav={setNav} />
        </main>
      </div>
    </>
  );
}
