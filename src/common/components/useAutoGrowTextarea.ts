import { useLayoutEffect, type RefObject } from 'react';

/** Grow a textarea to fit its content so the full text is always visible
 * without a scrollbar. Re-fits on value change and on window resize. */
export function useAutoGrowTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const resize = () => {
      element.style.height = 'auto';
      const borderY = element.offsetHeight - element.clientHeight;
      element.style.height = `${element.scrollHeight + borderY}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [ref, value]);
}
