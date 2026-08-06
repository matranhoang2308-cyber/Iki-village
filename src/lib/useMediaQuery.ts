import { useEffect, useState } from "react"

/* Reads a media query in JS so a component can be mounted conditionally rather
   than merely hidden with `lg:hidden`. Tailwind's visibility utilities still
   mount both branches, which for stateful things like timers means two
   intervals and duplicated callbacks. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}

/* Matches Tailwind's `lg` breakpoint (64rem / 1024px). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}
