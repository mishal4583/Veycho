/** Smooth in-page navigation. Routes through Lenis when active so it shares
 *  the same damped feel; falls back to native smooth scroll otherwise. */
export function scrollToId(id: string) {
  const target: number | HTMLElement | null =
    id === "top" ? 0 : document.getElementById(id);
  if (target === null) return;

  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.4 });
    return;
  }

  const top = typeof target === "number" ? target : target.offsetTop;
  window.scrollTo({ top, behavior: "smooth" });
}
