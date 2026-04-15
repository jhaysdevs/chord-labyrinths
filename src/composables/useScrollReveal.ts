import { onMounted, onUnmounted, type Ref } from 'vue';
import { gsap } from 'gsap';

/** Programmatically toggles the first chord pill so `ChordPills` state + emits stay in sync. */
function toggleFirstChordPill(root: HTMLElement | null) {
  if (!root) return;
  const first = root.querySelector<HTMLButtonElement>('button.chord-pill');
  first?.click();
}

export function useScrollReveal(el: Ref<HTMLElement | null>, delay = 0) {
  let observer: IntersectionObserver | null = null;
  let tween: gsap.core.Tween | null = null;

  onMounted(() => {
    if (!el.value) return;

    gsap.set(el.value, { opacity: 0, y: 32, filter: 'blur(14px)' });

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const root = el.value;
            if (!root) break;
            tween = gsap.to(root, {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.7,
              delay,
              ease: 'power3.inOut',
              onComplete: () => {
                // Clear GSAP inline props so CSS leave-transitions work normally
                gsap.set(root, { clearProps: 'opacity,y,filter' });
                toggleFirstChordPill(root);
              },
            });
            observer?.disconnect();
            break;
          }
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(el.value);
  });

  onUnmounted(() => {
    observer?.disconnect();
    tween?.kill();
  });
}
