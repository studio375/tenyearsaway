import Link from "next/link";
import { useLayoutEffect } from "react";
import { useStore } from "@/store/useStore";
export default function Home() {
  const setTransition = useStore((state) => state.setTransition);
  useLayoutEffect(() => {
    const currentTransition = useStore.getState().transition;
    if (currentTransition !== "exit") {
      setTransition(false);
    }
  }, []);

  return (
    <div>
      <main className="relative z-10 h-screen w-screen"></main>
    </div>
  );
}
