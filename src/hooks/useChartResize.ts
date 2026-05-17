import { useEffect } from 'react';
import { IChartApi } from 'lightweight-charts';

export function useChartResize(chart: IChartApi | undefined | null, containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!chart || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== containerRef.current) return;
      const newRect = entries[0].contentRect;
      // Make sure width and height are positive to avoid errors
      if (newRect.width > 0 && newRect.height > 0) {
        chart.applyOptions({ width: newRect.width, height: newRect.height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [chart, containerRef]);
}
