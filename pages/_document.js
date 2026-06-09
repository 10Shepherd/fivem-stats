import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicons (served from /public/assets) */}
        <link rel="icon" href="/assets/favicon.ico" sizes="any" />
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <link
          rel="icon"
          href="/assets/favicon-32.png"
          type="image/png"
          sizes="32x32"
        />
        <link
          rel="icon"
          href="/assets/favicon-16.png"
          type="image/png"
          sizes="16x16"
        />
        <link
          rel="apple-touch-icon"
          href="/assets/apple-touch-icon.png"
          sizes="180x180"
        />
        <link rel="manifest" href="/assets/site.webmanifest" />
        <meta name="theme-color" content="#060606" />
      </Head>
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
