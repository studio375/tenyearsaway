import "@/styles/globals.css";
import Layout from "@/components/Layout";
import localFont from "next/font/local";
import { Cache } from "three";
import { NextIntlClientProvider } from "next-intl";
import { useLayoutEffect } from "react";
import { useStore } from "@/store/useStore";

Cache.enabled = true;

const valve = localFont({
  src: [
    {
      path: "../assets/fonts/PPValve-PlainExtralight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../assets/fonts/PPValve-PlainExtralightItalic.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "../assets/fonts/PPValve-PlainMedium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/PPValve-PlainMediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../assets/fonts/PPValve-PlainExtrabold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
});

export default function App({ Component, pageProps }) {
  // Sync store from pageProps before paint — before Scene reads from store.
  // Skip if a year→year exit transition is active: Bridge handles that case with deferred sync.
  useLayoutEffect(() => {
    if (useStore.getState().transition === "exit") return;

    if (pageProps.year?.acf?.vignette) {
      const { year } = pageProps;
      useStore.setState({
        activeYear: year.slug,
        frames: year.acf.vignette,
        page: [
          year.acf.completo,
          year.acf.completo_texture,
          year.acf?.titolo || year.title?.rendered,
        ],
        objects: [],
      });
    }

    if (pageProps.years?.length) {
      useStore.setState({ pages: pageProps.years });
    }
  }, [pageProps]);

  return (
    <NextIntlClientProvider
      locale={pageProps.locale ?? "it"}
      messages={pageProps.messages ?? {}}
    >
      <Layout className={valve.className}>
        <Component {...pageProps} />
      </Layout>
    </NextIntlClientProvider>
  );
}
