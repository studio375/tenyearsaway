import Scene from "../Scene";
import ScrollProvider from "../Utility/ScrollProvider";
import StateManager from "../Utility/StateManager";
import Footer from "../Library/Footer";
import Header from "../Library/Header";
export default function Layout({ children }) {
  return (
    <div>
      <ScrollProvider>
        <Header />
        {children}
        <Scene />
        <div className="noise" />
        <Footer />
        <StateManager />
      </ScrollProvider>
    </div>
  );
}
