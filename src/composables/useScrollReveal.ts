import { onMounted, onUnmounted, type Ref } from 'vue';
import { gsap } from 'gsap';

export function useScrollReveal(el: Ref<HTMLElement | null>, delay = 0) {
  let observer: IntersectionObserver | null = null;
  let tween: gsap.core.Tween | null = null;

  onMounted(() => {
    if (!el.value) return;

    gsap.set(el.value, { opacity: 0, y: 28 });

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const root = el.value;
            if (!root) break;
            tween = gsap.to(root, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay,
              ease: 'power3.out',
              onComplete: () => {
                // Clear GSAP inline props so CSS leave-transitions work normally
                gsap.set(root, { clearProps: 'opacity,y' });
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
