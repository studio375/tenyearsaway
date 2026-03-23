import "@/styles/globals.css";
import Layout from "@/components/Layout";
import localFont from "next/font/local";

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
  return (
    <Layout className={valve.className}>
      <Component {...pageProps} />
    </Layout>
  );
}
