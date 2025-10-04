import { create } from 'zustand'

// Track concurrent requests and timing for smart UX (delayed show, minimum visible time)
export const useLoadingStore = create((set, get) => ({
  active: 0,
  isVisible: false,
  lastShowAt: 0,
  minVisibleMs: 500,
  delayMs: 150, // don't flash for ultra-fast calls
  start: () => {
    const { active, isVisible, delayMs } = get();
    const newActive = active + 1;
    set({ active: newActive });
    if (!isVisible) {
      // delay showing to avoid flicker
      const showTimer = setTimeout(() => {
        // double-check still loading
        if (get().active > 0) {
          set({ isVisible: true, lastShowAt: Date.now() });
        }
      }, delayMs);
      set({ showTimer });
    }
  },
  stop: () => {
    const { active, isVisible, lastShowAt, minVisibleMs } = get();
    const newActive = Math.max(0, active - 1);
    if (newActive === 0) {
      if (isVisible) {
        const elapsed = Date.now() - lastShowAt;
        if (elapsed < minVisibleMs) {
          setTimeout(() => set({ isVisible: false, active: 0 }), minVisibleMs - elapsed);
        } else {
          set({ isVisible: false, active: 0 });
        }
      } else {
        set({ active: 0 });
      }
    } else {
      set({ active: newActive });
    }
  }
}));
