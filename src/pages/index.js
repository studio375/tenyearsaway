import { useLayoutEffect } from "react";
import { useStore } from "@/store/useStore";

export default function HomePage() {
  const setTransition = useStore((state) => state.setTransition);

  useLayoutEffect(() => {
    const currentTransition = useStore.getState().transition;
    if (currentTransition !== "exit") {
      setTransition(false);
    }
  }, []);

  return null;
}
