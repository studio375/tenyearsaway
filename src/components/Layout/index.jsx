import dynamic from "next/dynamic";
const Scene = dynamic(() => import("../Scene"), { ssr: false });
import ScrollProvider from "../Utility/ScrollProvider";
import StateManager from "../Utility/StateManager";
import AudioManager from "../Utility/AudioManager";
import Footer from "../Library/Footer";
import Loader from "../Library/Loader";
import Header from "../Library/Header";
import Home from "../Library/Home";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useTexture } from "@react-three/drei";
import { useLocale } from "next-intl";

export default function Layout({ children, ...props }) {
  const setTeam = useStore((s) => s.setTeam);
  const setPages = useStore((s) => s.setPages);
  const locale = useLocale();

  useEffect(() => {
    fetch(`/api/team?locale=${locale}`)
      .then((r) => r.json())
      .then((team) => {
        if (!team?.length) return;
        setTeam(team);
        const cardUrls = team.map((t) => t.card?.url).filter(Boolean);
        if (cardUrls.length) useTexture.preload(cardUrls);
      })
      .catch(() => {});

    fetch(`/api/years?locale=${locale}`)
      .then((r) => r.json())
      .then((years) => {
        if (!years?.length) return;
        setPages(years);
        const pageUrls = years.map((p) => p.full?.url).filter(Boolean);
        if (pageUrls.length) useTexture.preload(pageUrls);
      })
      .catch(() => {});
  }, [locale, setTeam, setPages]);

  return (
    <div className={props.className}>
      <ScrollProvider>
        <Header />
        <Home />
        {children}
        <Scene />
        <div className="noise" />
        <Footer />
        <Loader />
        <StateManager />
        <AudioManager />
      </ScrollProvider>
    </div>
  );
}
