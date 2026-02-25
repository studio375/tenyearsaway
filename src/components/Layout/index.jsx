import Scene from "../Scene";
import ScrollProvider from "../Utility/ScrollProvider";
import StateManager from "../Utility/StateManager";
import Footer from "../Library/Footer";
import Header from "../Library/Header";
import Loader from "../Library/Loader";

export default function Layout({ children, ...props }) {
  return (
    <div className={props.className}>
      <ScrollProvider>
        {children}
        <Scene />
        <div className="noise" />
        <Header />
        <Loader />
        <StateManager />
      </ScrollProvider>
    </div>
  );
}
