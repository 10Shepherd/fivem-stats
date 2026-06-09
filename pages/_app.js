import "../styles/globals.css";
import Layout from "../components/Layout";

const NO_LAYOUT = ["/privacy", "/terms", "/contact"];

export default function App({ Component, pageProps, router }) {
  // FIX #5: removed deprecated getInitialProps from App
  if (NO_LAYOUT.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }
  return (
    <Layout>
      {({ activeServer, servers }) => (
        <Component
          {...pageProps}
          activeServer={activeServer}
          servers={servers}
        />
      )}
    </Layout>
  );
}
