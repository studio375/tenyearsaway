import { useRouter } from "next/router";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";
export default function StateManager() {
  const setTransition = useStore((state) => state.setTransition);
  const router = useRouter();
  useEffect(() => {
    const handleStart = (url, { shallow }) => {
      const currentTransition = useStore.getState().transition;

      const yearsToYear =
        router.asPath == "/year" && url.includes("/year/") && url !== "/year/";
      const yearsToHome = router.asPath == "/year" && url == "/";
      if (yearsToYear || yearsToHome || router.asPath == "/") return;

      if (!currentTransition) {
        setTransition("exit");
      } else {
        setTransition(false);
      }
    };

    router.events.on("routeChangeStart", handleStart);
    return () => {
      router.events.off("routeChangeStart", handleStart);
    };
  }, [router]);

  return null;
}
