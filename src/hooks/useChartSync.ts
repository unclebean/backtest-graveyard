import { useEffect, useRef } from 'react';
import { IChartApi } from 'lightweight-charts';

export const useChartSync = (
  charts: (IChartApi | undefined)[],
  containers: (React.RefObject<HTMLDivElement | null> | HTMLDivElement | null)[]
) => {
  const activeSourceChartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const activeCharts = charts.filter(Boolean) as IChartApi[];
    if (activeCharts.length < 2) return;

    // 1. Attach hover/touch event listeners to all container elements
    const cleanups: (() => void)[] = [];

    containers.forEach((refOrEl, index) => {
      const el = refOrEl && 'current' in refOrEl ? refOrEl.current : refOrEl;
      if (!el) return;

      const chart = activeCharts[index];
      if (!chart) return;

      const onInteraction = () => {
        activeSourceChartRef.current = chart;
      };

      el.addEventListener('mouseenter', onInteraction);
      el.addEventListener('touchstart', onInteraction);
      el.addEventListener('wheel', onInteraction, { passive: true });

      cleanups.push(() => {
        el.removeEventListener('mouseenter', onInteraction);
        el.removeEventListener('touchstart', onInteraction);
        el.removeEventListener('wheel', onInteraction);
      });
    });

    // 2. Set up logical range synchronization handlers
    const handlers = activeCharts.map((sourceChart) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (range: any) => {
        if (!range || activeSourceChartRef.current !== sourceChart) return;

        activeCharts.forEach((targetChart) => {
          if (targetChart !== sourceChart) {
            try {
              const targetRange = targetChart.timeScale().getVisibleLogicalRange();
              if (!targetRange || Math.abs(targetRange.from - range.from) > 0.5 || Math.abs(targetRange.to - range.to) > 0.5) {
                targetChart.timeScale().setVisibleLogicalRange(range);
              }
            } catch {
              // Safe catch for disposed charts during replay tick sync
            }
          }
        });
      };

      try {
        sourceChart.timeScale().subscribeVisibleLogicalRangeChange(handler);
      } catch {
        // Safe catch for disposed subscriptions
      }

      return { chart: sourceChart, handler };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      handlers.forEach(({ chart, handler }) => {
        try {
          chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
        } catch {
          // Safe catch for already disposed charts on unmount/re-render
        }
      });
    };
  }, [charts, containers]);
};
