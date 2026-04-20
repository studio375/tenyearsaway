import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/router";
import { routing } from "./routing";
import { forwardRef } from "react";

function stripLocale(asPath) {
  const path = asPath.split("?")[0].split("#")[0];
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1);
    if (path === `/${locale}`) return "/";
  }
  return path;
}

function addLocale(href, locale) {
  if (!locale || locale === routing.defaultLocale) return href;
  if (typeof href !== "string") return href;
  if (href.startsWith("http") || href.startsWith("//")) return href;
  return `/${locale}${href}`;
}

export function useLocale() {
  const { query } = useNextRouter();
  return query?.locale || routing.defaultLocale;
}

export function usePathname() {
  const { asPath } = useNextRouter();
  return stripLocale(asPath);
}

export function useRouter() {
  const router = useNextRouter();
  const locale = router.query?.locale || routing.defaultLocale;

  return {
    ...router,
    push: (href, as, options) =>
      router.push(addLocale(href, locale), as, options),
    replace: (href, as, options) =>
      router.replace(addLocale(href, locale), as, options),
    prefetch: (href, asPath, options) =>
      router.prefetch(addLocale(href, locale), asPath, options),
  };
}

export const Link = forwardRef(function Link({ href, ...props }, ref) {
  const { query } = useNextRouter();
  const locale = query?.locale || routing.defaultLocale;
  const localizedHref = addLocale(href, locale);
  return <NextLink href={localizedHref} ref={ref} {...props} />;
});

export function getPathname({ href, locale }) {
  return addLocale(typeof href === "string" ? href : href.pathname ?? "/", locale);
}
