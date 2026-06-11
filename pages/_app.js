import "../styles/globals.css";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";

const NO_LAYOUT = ["/privacy", "/terms", "/contact", "/about", "/404"];

export default function App({ Component, pageProps, router }) {
  const { pathname } = useRouter();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setTransitioning(true);
    const t = setTimeout(() => setTransitioning(false), 50);
    return () => clearTimeout(t);
  }, [pathname]);

  if (NO_LAYOUT.includes(router.pathname)) {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className={transitioning ? "page-enter" : "page-active"}>
          <Component {...pageProps} />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* initialActiveServer syncs the sidebar highlight on direct/shared URL loads */}
      <Layout initialActiveServer={pageProps.activeServer}>
        {({ activeServer, servers }) => (
          <div key={pathname} className="page-active fade-in">
            <ErrorBoundary>
              <Component
                {...pageProps}
                activeServer={activeServer}
                servers={servers}
              />
            </ErrorBoundary>
          </div>
        )}
      </Layout>
    </>
  );
}
