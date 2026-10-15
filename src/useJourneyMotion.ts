import { useCallback, useEffect, useRef, useState } from 'react';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function useJourneyMotion(enabled: boolean) {
  const journey = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const element = journey.current!;
    const intro = element.querySelector<HTMLElement>('.hero-content')!;
    const story = element.querySelector<HTMLElement>('.journey-story')!;
    const panel = document.querySelector<HTMLElement>('.space-panel');
    let frame = 0;
    function update() {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const distance = element.offsetHeight - window.innerHeight;
      const value = enabled && distance > 0 ? clamp(-rect.top / distance) : 0;
      const panelRect = panel?.getBoundingClientRect();
      progress.current = value;
      element.style.setProperty('--journey-progress', String(value));
      element.style.setProperty('--intro-opacity', String(clamp(1 - value / 0.22)));
      element.style.setProperty('--intro-y', `${-value * 180}px`);
      element.style.setProperty('--story-opacity', String(clamp((value - 0.2) / 0.12)));
      intro.inert = value > 0.22;
      story.inert = value < 0.22;
      story.setAttribute('aria-hidden', String(value < 0.22));
      if (panel && panelRect) panel.style.setProperty('--art-progress', String(enabled ? clamp((window.innerHeight - panelRect.top) / (window.innerHeight + panelRect.height)) - 0.5 : 0));
      setChapter(value < 0.38 ? 0 : value < 0.73 ? 1 : 2);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled]);

  const travelTo = useCallback((position: number) => {
    const element = journey.current;
    if (!element) return;
    const top = window.scrollY + element.getBoundingClientRect().top;
    window.scrollTo({ top: top + Math.max(0, element.offsetHeight - window.innerHeight) * position, behavior: enabled ? 'smooth' : 'instant' });
  }, [enabled]);

  return { journey, progress, chapter, travelTo };
}
