import dynamic from "next/dynamic";
const Scene = dynamic(() => import("../Scene"), { ssr: false });
import ScrollProvider from "../Utility/ScrollProvider";
import StateManager from "../Utility/StateManager";
import Footer from "../Library/Footer";
import Loader from "../Library/Loader";
import Header from "../Library/Header";
import Home from "../Library/Home";
export default function Layout({ children, ...props }) {
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
      </ScrollProvider>
    </div>
  );
}
