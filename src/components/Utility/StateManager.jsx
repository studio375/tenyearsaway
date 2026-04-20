import { useRouter } from "next/router";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";

function stripLocale(path) {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1);
    if (path === `/${locale}`) return "/";
  }
  return path;
}

export default function StateManager() {
  const setTransition = useStore((state) => state.setTransition);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const handleStart = (url, { shallow }) => {
      const currentTransition = useStore.getState().transition;
      const strippedUrl = stripLocale(url);

      const yearsToYear =
        pathname == "/year" && strippedUrl.includes("/year/") && strippedUrl !== "/year/";
      const yearsToHome = pathname == "/year" && strippedUrl == "/";
      if (yearsToYear || yearsToHome || pathname == "/") return;

      if (currentTransition === "home") return;

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
  }, [router, pathname]);

  return null;
}
