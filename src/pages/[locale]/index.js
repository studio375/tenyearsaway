import { useLayoutEffect } from "react";
import { useStore } from "@/store/useStore";
import { routing } from "@/i18n/routing";

export async function getStaticPaths() {
  return {
    paths: routing.locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
}

export async function getStaticProps({ params: { locale } }) {
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  return {
    props: { messages, locale },
  };
}

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
