import Head from "next/head";
import { useState, useEffect } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };
const BODY = { fontFamily: "var(--font-body)", fontWeight: 300 };

const TOPICS = [
  "General question",
  "Bug report",
  "Data issue",
  "Privacy / data removal request",
  "Server removal request",
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
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverCount, setServerCount] = useState(0);

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setServerCount(d.length);
      })
      .catch(() => {});
  }, []);

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
      const res = await fetch(
        "https://formsubmit.co/ajax/8ae150ec513dd54e06d88e21631d6b7b",
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
            _subject: `[FiveM Stats] ${form.topic}`,
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
        <title>Contact — FiveM Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Nav />
      <main
        id="main-content"
        style={{ maxWidth: 640, margin: "0 auto", padding: "48px 28px 0" }}
      >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label htmlFor="contact-name" style={labelStyle}>
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="your name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  style={inputStyle(errors.name)}
                />
                {errors.name && (
                  <div role="alert" style={errStyle}>
                    {errors.name}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="contact-email" style={labelStyle}>
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  style={inputStyle(errors.email)}
                />
                {errors.email && (
                  <div role="alert" style={errStyle}>
                    {errors.email}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="contact-topic" style={labelStyle}>
                Topic
              </label>
              <select
                id="contact-topic"
                value={form.topic}
                onChange={(e) => set("topic", e.target.value)}
                style={{
                  ...inputStyle(errors.topic),
                  appearance: "none",
                  cursor: "pointer",
                  color: form.topic ? "var(--text)" : "var(--muted)",
                }}
              >
                <option value="" disabled hidden>
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
            <div>
              <label htmlFor="contact-message" style={labelStyle}>
                Message
              </label>
              <textarea
                id="contact-message"
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
              />
              {errors.message && (
                <div role="alert" style={errStyle}>
                  {errors.message}
                </div>
              )}
            </div>
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
                }}
              >
                something went wrong — please try again or email us directly
              </div>
            )}
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
                  padding: "12px 28px",
                  cursor: status === "sending" ? "not-allowed" : "pointer",
                }}
              >
                {status === "sending" ? "sending..." : "send message"}
              </button>
              <span style={{ ...MONO, fontSize: 10, color: "var(--muted)" }}>
                we'll reply to your email
              </span>
            </div>
          </form>
        )}

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
            {
              label: "SERVERS TRACKED",
              value: String(serverCount || "—"),
              sub: "active FiveM servers",
            },
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
              <div style={{ ...MONO, fontSize: 10, color: "var(--muted)" }}>
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
