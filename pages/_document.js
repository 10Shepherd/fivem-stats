import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {/* Skip to main content — hidden visually but accessible to screen readers */}
        <a
          href="#main-content"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
          onFocus={(e) => {
            e.currentTarget.style.left = "16px";
            e.currentTarget.style.top = "16px";
            e.currentTarget.style.width = "auto";
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.overflow = "visible";
          }}
          onBlur={(e) => {
            e.currentTarget.style.left = "-9999px";
            e.currentTarget.style.top = "auto";
            e.currentTarget.style.width = "1px";
            e.currentTarget.style.height = "1px";
            e.currentTarget.style.overflow = "hidden";
          }}
        >
          Skip to main content
        </a>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
