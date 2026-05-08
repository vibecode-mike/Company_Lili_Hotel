import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  rootMargin?: string;
  threshold?: number;
  // 若為 true，立即視為已進場（搭配 prefers-reduced-motion 短路）
  reducedMotion?: boolean;
}

// 讓元素第一次進入視窗後就鎖定 inView=true，並 unobserve；之後不再重播
export function useInViewOnce<T extends HTMLElement>(
  opts: Options = {},
): [(node: T | null) => void, boolean] {
  const { rootMargin = "0px", threshold = 0.1, reducedMotion = false } = opts;
  const [inView, setInView] = useState<boolean>(reducedMotion);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (reducedMotion) setInView(true);
  }, [reducedMotion]);

  const refCallback = useCallback(
    (node: T | null) => {
      // 卸下舊 observer
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;
      if (reducedMotion) {
        setInView(true);
        return;
      }
      if (typeof IntersectionObserver === "undefined") {
        // 環境不支援，直接視為已進場
        setInView(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setInView(true);
              observer.unobserve(entry.target);
              observer.disconnect();
              observerRef.current = null;
              break;
            }
          }
        },
        { rootMargin, threshold },
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [rootMargin, threshold, reducedMotion],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return [refCallback, inView];
}
