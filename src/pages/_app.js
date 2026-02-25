import "@/styles/globals.css";
import Layout from "@/components/Layout";
import localFont from "next/font/local";

const neueMachina = localFont({
  src: [
    {
      path: "../assets/fonts/PPNeueMachina-InktrapRegular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/PPNeueMachina-InktrapUltrabold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
});

export default function App({ Component, pageProps }) {
  return (
    <Layout className={neueMachina.className}>
      <Component {...pageProps} />
    </Layout>
  );
}
