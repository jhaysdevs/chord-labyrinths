import { ref, onMounted, onUnmounted } from 'vue';

export function useMediaQuery(query: string) {
  const matches = ref(false);
  let mq: MediaQueryList | undefined;

  function handler(e: MediaQueryListEvent) {
    matches.value = e.matches;
  }

  onMounted(() => {
    mq = window.matchMedia(query);
    matches.value = mq.matches;
    mq.addEventListener('change', handler);
  });

  onUnmounted(() => {
    mq?.removeEventListener('change', handler);
  });

  return matches;
}
