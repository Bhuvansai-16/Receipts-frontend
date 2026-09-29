import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router-dom";

/** After client-side navigation, move focus to the new page for keyboard and screen reader users. */
export function useRouteFocus(main: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname, main]);
}
