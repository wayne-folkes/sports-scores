import { useState, useEffect } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import SportWidget from '../SportWidget';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import './Dashboard.css';

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'nba', x: 0, y: 0, w: 6, h: 8 },
    { i: 'mlb', x: 6, y: 0, w: 6, h: 8 },
  ],
  md: [
    { i: 'nba', x: 0, y: 0, w: 5, h: 8 },
    { i: 'mlb', x: 5, y: 0, w: 5, h: 8 },
  ],
  sm: [
    { i: 'nba', x: 0, y: 0, w: 6, h: 8 },
    { i: 'mlb', x: 0, y: 8, w: 6, h: 8 },
  ],
  xs: [
    { i: 'nba', x: 0, y: 0, w: 4, h: 8 },
    { i: 'mlb', x: 0, y: 8, w: 4, h: 8 },
  ],
  xxs: [
    { i: 'nba', x: 0, y: 0, w: 2, h: 8 },
    { i: 'mlb', x: 0, y: 8, w: 2, h: 8 },
  ],
};

const DEFAULT_WIDGET_ORDER = ['nba', 'mlb'];

// Read matchMedia on first render so isMobile is correct before any touch fires.
function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
}

function getMobileWidgetOrder(layouts) {
  const mobileLayout = Array.isArray(layouts?.xs) && layouts.xs.length > 0
    ? layouts.xs
    : DEFAULT_LAYOUTS.xs;

  const orderedKeys = [...mobileLayout]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((item) => item.i);

  return [
    ...DEFAULT_WIDGET_ORDER.filter((key) => orderedKeys.includes(key)),
    ...DEFAULT_WIDGET_ORDER.filter((key) => !orderedKeys.includes(key)),
  ];
}

export default function Dashboard() {
  const [layouts, setLayouts] = useLocalStorage('widgetLayout', DEFAULT_LAYOUTS);
  const { width, containerRef } = useContainerWidth();
  const isMobile = useIsMobile(768);
  const mobileWidgetOrder = getMobileWidgetOrder(layouts);

  const handleLayoutChange = (_currentLayout, allLayouts) => {
    setLayouts(allLayouts);
  };

  if (isMobile) {
    return (
      <section className="dashboard">
        <div className="dashboard-mobile-stack">
          {mobileWidgetOrder.map((sport) => (
            <div key={sport} className="dashboard-mobile-stack__item">
              <SportWidget sport={sport} isReorderable={false} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <div ref={containerRef} className="dashboard-container">
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          draggableHandle=".drag-handle"
          isDraggable={!isMobile}
          isResizable={!isMobile}
          margin={[18, 18]}
          width={width}
        >
          {DEFAULT_WIDGET_ORDER.map((sport) => (
            <div key={sport} className="dashboard-widget-wrapper">
              <SportWidget sport={sport} />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </section>
  );
}
