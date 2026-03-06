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

export default function Dashboard() {
  const [layouts, setLayouts] = useLocalStorage('widgetLayout', DEFAULT_LAYOUTS);
  const { width, containerRef } = useContainerWidth();

  const handleLayoutChange = (_currentLayout, allLayouts) => {
    setLayouts(allLayouts);
  };

  return (
    <section className="dashboard">
      <div className="dashboard__hero">
        <div className="dashboard__hero-copy">
          <span className="dashboard__eyebrow">Built for your favorites</span>
          <h2 className="dashboard__title">Track the matchups that matter.</h2>
          <p className="dashboard__description">
            Drag your sports around, save your teams locally, and keep scores refreshed automatically.
          </p>
        </div>
        <div className="dashboard__hero-pills" aria-label="Dashboard features">
          <span className="dashboard__hero-pill">30s refresh</span>
          <span className="dashboard__hero-pill">Drag & resize</span>
          <span className="dashboard__hero-pill">Local favorites</span>
        </div>
      </div>

      <div ref={containerRef} className="dashboard-container">
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          draggableHandle=".drag-handle"
          margin={[18, 18]}
          width={width}
        >
          <div key="nba" className="dashboard-widget-wrapper">
            <SportWidget sport="nba" />
          </div>
          <div key="mlb" className="dashboard-widget-wrapper">
            <SportWidget sport="mlb" />
          </div>
        </ResponsiveGridLayout>
      </div>
    </section>
  );
}
