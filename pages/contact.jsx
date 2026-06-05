import Head from "next/head";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };
const BODY = { fontFamily: "var(--font-body)", fontWeight: 300 };

const TOPICS = [
  "General question",
  "Bug report",
  "Data issue",
  "Privacy / data removal request",
  "Partnership or collaboration",
  "Other",
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "required";
    if (!form.email.trim()) e.email = "required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "invalid email";
    if (!form.topic) e.topic = "required";
    if (!form.message.trim()) e.message = "required";
    else if (form.message.trim().length < 10) e.message = "too short";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      // Using FormSubmit.co — replace YOUR_EMAIL below with your actual email
      const res = await fetch(
        "https://formsubmit.co/ajax/magadumparth5@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            topic: form.topic,
            message: form.message,
            _subject: `[Fivem Stats] ${form.topic}`,
          }),
        },
      );
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", topic: "", message: "" });
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const inputStyle = (err) => ({
    width: "100%",
    background: "var(--bg3)",
    border: `1px solid ${err ? "var(--red)" : "var(--line2)"}`,
    borderRadius: 10,
    padding: "11px 14px",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 300,
    color: "var(--text)",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    letterSpacing: "0.01em",
  });

  const labelStyle = {
    ...MONO,
    fontSize: 10,
    letterSpacing: "0.14em",
    color: "var(--muted)",
    textTransform: "uppercase",
    marginBottom: 7,
    display: "block",
  };

  const errStyle = {
    ...MONO,
    fontSize: 10,
    color: "var(--red)",
    letterSpacing: "0.04em",
    marginTop: 5,
  };

  return (
    <>
      <Head>
        <title>Contact — Fivem Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Nav />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 28px 0" }}>
        {/* Header */}
        <div className="fade-up d1" style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <span className="pill">Community</span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 6vw, 52px)",
              letterSpacing: "0.08em",
              color: "#fff",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            CONTACT US
          </h1>
          <p
            style={{
              ...BODY,
              fontSize: 14,
              color: "var(--muted)",
              lineHeight: 1.75,
            }}
          >
            Got a bug to report, a data issue, or just want to reach out? Fill
            in the form below and we'll get back to you as soon as possible.
            Response time is typically 1–3 days.
          </p>
        </div>

        <div
          style={{ height: 1, background: "var(--line)", marginBottom: 40 }}
        />

        {/* Success state */}
        {status === "sent" ? (
          <div
            className="fade-up d2"
            style={{
              background: "rgba(61,220,132,0.06)",
              border: "1px solid rgba(61,220,132,0.2)",
              borderRadius: 14,
              padding: "36px 28px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                letterSpacing: "0.08em",
                color: "var(--green)",
                marginBottom: 10,
              }}
            >
              MESSAGE SENT
            </div>
            <p
              style={{
                ...BODY,
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.7,
              }}
            >
              Thanks for reaching out. We'll be in touch within 1–3 days.
            </p>
            <button
              className="btn"
              onClick={() => setStatus(null)}
              style={{ marginTop: 20 }}
            >
              send another
            </button>
          </div>
        ) : (
          <form
            className="fade-up d2"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 22 }}
          >
            {/* Name + Email row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  placeholder="your name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  style={inputStyle(errors.name)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--green)";
                    e.target.style.background = "var(--line)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.name
                      ? "var(--red)"
                      : "var(--line2)";
                    e.target.style.background = "var(--bg3)";
                  }}
                />
                {errors.name && <div style={errStyle}>{errors.name}</div>}
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  style={inputStyle(errors.email)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--green)";
                    e.target.style.background = "var(--line)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email
                      ? "var(--red)"
                      : "var(--line2)";
                    e.target.style.background = "var(--bg3)";
                  }}
                />
                {errors.email && <div style={errStyle}>{errors.email}</div>}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label style={labelStyle}>Topic</label>
              <select
                value={form.topic}
                onChange={(e) => set("topic", e.target.value)}
                style={{
                  ...inputStyle(errors.topic),
                  appearance: "none",
                  cursor: "pointer",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a4a4a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  paddingRight: 36,
                  color: form.topic ? "var(--text)" : "var(--muted)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--green)";
                  e.target.style.background = "var(--line)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.topic
                    ? "var(--red)"
                    : "var(--line2)";
                  e.target.style.background = "var(--bg3)";
                }}
              >
                <option value="" disabled>
                  select a topic
                </option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.topic && <div style={errStyle}>{errors.topic}</div>}
            </div>

            {/* Message */}
            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                rows={5}
                placeholder="describe your question or issue in detail..."
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                style={{
                  ...inputStyle(errors.message),
                  resize: "vertical",
                  minHeight: 120,
                  lineHeight: 1.65,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--green)";
                  e.target.style.background = "var(--line)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.message
                    ? "var(--red)"
                    : "var(--line2)";
                  e.target.style.background = "var(--bg3)";
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 5,
                }}
              >
                {errors.message ? (
                  <div style={errStyle}>{errors.message}</div>
                ) : (
                  <div />
                )}
                <span style={{ ...MONO, fontSize: 9, color: "var(--muted2)" }}>
                  {form.message.length} chars
                </span>
              </div>
            </div>

            {/* Error banner */}
            {status === "error" && (
              <div
                style={{
                  background: "rgba(224,85,85,0.08)",
                  border: "1px solid rgba(224,85,85,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  ...MONO,
                  fontSize: 11,
                  color: "var(--red)",
                  letterSpacing: "0.04em",
                }}
              >
                something went wrong — please try again or email us directly
              </div>
            )}

            {/* Submit */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  background:
                    status === "sending" ? "var(--line3)" : "var(--green)",
                  border: "none",
                  borderRadius: 10,
                  color: "#060606",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  padding: "12px 28px",
                  cursor: status === "sending" ? "not-allowed" : "pointer",
                  transition: "background 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (status !== "sending")
                    e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {status === "sending" ? "sending..." : "send message"}
              </button>
              <span style={{ ...MONO, fontSize: 10, color: "var(--muted2)" }}>
                we'll reply to your email
              </span>
            </div>
          </form>
        )}

        {/* Info cards */}
        <div
          className="fade-up d4"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 48,
          }}
        >
          {[
            {
              label: "RESPONSE TIME",
              value: "1–3 days",
              sub: "typical reply window",
            },
            { label: "SERVER CODE", value: "3lamjz", sub: "cfx.re identifier" },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "20px 18px",
              }}
            >
              <div
                style={{
                  ...MONO,
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  letterSpacing: "0.06em",
                  color: "#fff",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {value}
              </div>
              <div style={{ ...MONO, fontSize: 10, color: "var(--muted2)" }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
