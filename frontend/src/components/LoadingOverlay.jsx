import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLoadingStore } from '../store/useLoadingStore';

// simple easing progression for perceived progress
const easeCurve = [0,15,28,40,50,58,65,71,76,80,83,86,88,90,92,93,94,95,96,97,98,99];

export const LoadingOverlay = () => {
  const { isVisible, active } = useLoadingStore();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');

  useEffect(() => {
    if (isVisible) {
      setPhase(active > 1 ? 'Loading multiple requests…' : 'Loading…');
      let i = 0;
      const id = setInterval(() => {
        i = Math.min(i + 1, easeCurve.length - 1);
        setProgress(easeCurve[i]);
      }, 120);
      return () => clearInterval(id);
    } else {
      // Finish bar quickly
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 250);
      return () => clearTimeout(timer);
    }
  }, [isVisible, active]);

  if (!isVisible && progress === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] flex flex-col">
      {/* Top progress bar */}
      <div className="h-1 w-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-400 via-violet-400 to-pink-400 transition-all duration-200"
          style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
        />
      </div>
      {/* Center pulse only when visible */}
      {isVisible && (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass-panel px-8 py-6 flex flex-col items-center gap-3 min-w-[220px] animate-[fadeIn_.4s]">
            <Loader2 className="w-7 h-7 text-teal-300 animate-spin" />
            <div className="text-sm text-white/80 font-medium tracking-wide">
              {phase}
            </div>
            {active > 1 && (
              <div className="text-[11px] text-white/50 font-mono">{active} pending</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
