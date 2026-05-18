import { useEffect, useRef, useState } from 'react';
import { IChartApi } from 'lightweight-charts';

export const useChartSync = (
  charts: (IChartApi | undefined)[],
  containers: (React.RefObject<HTMLDivElement | null> | HTMLDivElement | null)[]
) => {
  const activeSourceChartRef = useRef<IChartApi | null>(null);

  // Filter out undefined charts
  const activeCharts = charts.filter(Boolean) as IChartApi[];

  // Resolve ref objects to raw HTML elements
  const activeElements = containers.map((refOrEl) => {
    return refOrEl && 'current' in refOrEl ? refOrEl.current : refOrEl;
  });

  // Track bounded chart instances and DOM elements to avoid repeatedly tearing down bindings on render literals
  const [boundCharts, setBoundCharts] = useState<IChartApi[]>([]);
  const [boundElements, setBoundElements] = useState<(HTMLDivElement | null)[]>([]);

  const prevActiveChartsRef = useRef<IChartApi[]>([]);
  const prevActiveElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Adjust state directly during render when charts or container elements change.
  // This standard React pattern schedules an immediate, clean re-render with the new inputs,
  // avoiding any useEffect dependency warning or infinite rendering loops.
  const chartsChanged =
    activeCharts.length !== prevActiveChartsRef.current.length ||
    activeCharts.some((c, i) => c !== prevActiveChartsRef.current[i]);

  const elementsChanged =
    activeElements.length !== prevActiveElementsRef.current.length ||
    activeElements.some((el, i) => el !== prevActiveElementsRef.current[i]);

  if (chartsChanged || elementsChanged) {
    prevActiveChartsRef.current = activeCharts;
    prevActiveElementsRef.current = activeElements;
    setBoundCharts(activeCharts);
    setBoundElements(activeElements);
  }

  useEffect(() => {
    if (boundCharts.length < 2) return;

    const cleanups: (() => void)[] = [];

    // 1. Attach interaction event listeners to elements to track which chart is being hovered/dragged/scrolled
    boundElements.forEach((el, index) => {
      if (!el) return;

      const chart = boundCharts[index];
      if (!chart) return;

      const onInteraction = () => {
        activeSourceChartRef.current = chart;
      };

      // Wire mouse/touch interactions to lock interaction source immediately
      el.addEventListener('mouseenter', onInteraction);
      el.addEventListener('mousedown', onInteraction, { passive: true });
      el.addEventListener('touchstart', onInteraction, { passive: true });
      el.addEventListener('wheel', onInteraction, { passive: true });

      cleanups.push(() => {
        el.removeEventListener('mouseenter', onInteraction);
        el.removeEventListener('mousedown', onInteraction);
        el.removeEventListener('touchstart', onInteraction);
        el.removeEventListener('wheel', onInteraction);
      });
    });

    // 2. Set up logical range synchronization handlers
    const handlers = boundCharts.map((sourceChart) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (range: any) => {
        if (!range || activeSourceChartRef.current !== sourceChart) return;

        boundCharts.forEach((targetChart) => {
          if (targetChart !== sourceChart) {
            try {
              const targetRange = targetChart.timeScale().getVisibleLogicalRange();
              // Prevent recursive updates by comparing range delta (0.01 threshold is highly precise)
              if (!targetRange || Math.abs(targetRange.from - range.from) > 0.01 || Math.abs(targetRange.to - range.to) > 0.01) {
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
  }, [boundCharts, boundElements]);
};
