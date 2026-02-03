import { useEffect, useRef } from 'react';

export const useScrollSync = (
  ref1: React.RefObject<any>,
  ref2: React.RefObject<any>
) => {
  const isScrollingRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el1 = ref1.current;
    const el2 = ref2.current;

    if (!el1 || !el2) return;

    let timeoutId: any;

    const sync = (source: HTMLElement, target: HTMLElement) => {
         // If another element is currently driving the scroll, ignore this event
         if (isScrollingRef.current && isScrollingRef.current !== source) return;
         
         isScrollingRef.current = source;
         
         const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
         
         if (target.scrollHeight > target.clientHeight) {
            target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
         }
         
         clearTimeout(timeoutId);
         timeoutId = setTimeout(() => {
             isScrollingRef.current = null;
         }, 100); 
    };

    const onScroll1 = () => sync(el1, el2);
    const onScroll2 = () => sync(el2, el1);

    el1.addEventListener('scroll', onScroll1);
    el2.addEventListener('scroll', onScroll2);

    return () => {
      el1.removeEventListener('scroll', onScroll1);
      el2.removeEventListener('scroll', onScroll2);
      clearTimeout(timeoutId);
    };
  }, [ref1, ref2]); // Re-bind if refs change (unlikely)
};
