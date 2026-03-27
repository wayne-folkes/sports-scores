import { useState, useEffect } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import SportWidget from '../SportWidget';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import './Dashboard.css';

const ALL_SPORTS = ['nba', 'mlb', 'mens-college-basketball', 'womens-college-basketball', 'college-baseball', 'college-softball'];

const SPORT_LABELS = {
  nba: 'NBA',
  mlb: 'MLB',
  'mens-college-basketball': "Men's College Basketball",
  'womens-college-basketball': "Women's College Basketball",
  'college-baseball': 'College Baseball',
  'college-softball': 'College Softball',
};

function buildLayouts(sports) {
  const count = sports.length;
  if (count === 0) return { lg: [], md: [], sm: [], xs: [], xxs: [] };

  // On large screens, fit up to 2 per row
  const colsPerRow = Math.min(count, 2);
  const wLg = Math.floor(12 / colsPerRow);
  const wMd = Math.floor(10 / colsPerRow);

  const makeLayout = (w, cols) =>
    sports.map((sport, i) => ({
      i: sport,
      x: (i % cols) * w,
      y: Math.floor(i / cols) * 8,
      w,
      h: 8,
    }));

  return {
    lg: makeLayout(wLg, colsPerRow),
    md: makeLayout(wMd, colsPerRow),
    sm: sports.map((sport, i) => ({ i: sport, x: 0, y: i * 8, w: 6, h: 8 })),
    xs: sports.map((sport, i) => ({ i: sport, x: 0, y: i * 8, w: 4, h: 8 })),
    xxs: sports.map((sport, i) => ({ i: sport, x: 0, y: i * 8, w: 2, h: 8 })),
  };
}

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

export default function Dashboard() {
  const [visibleSports, setVisibleSports] = useLocalStorage('visibleSports', ['nba', 'mlb']);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const { width, containerRef } = useContainerWidth();
  const isMobile = useIsMobile(768);

  const layouts = buildLayouts(visibleSports);

  const toggleSport = (sport) => {
    setVisibleSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  if (isMobile) {
    return (
      <section className="dashboard">
        <div className="dashboard__toolbar">
          <button
            className="dashboard__toggle-btn"
            onClick={() => setShowSportPicker(!showSportPicker)}
          >
            Sports
          </button>
          {showSportPicker && (
            <div className="dashboard__sport-picker">
              {ALL_SPORTS.map((sport) => (
                <label key={sport} className="dashboard__sport-option">
                  <input
                    type="checkbox"
                    checked={visibleSports.includes(sport)}
                    onChange={() => toggleSport(sport)}
                  />
                  <span>{SPORT_LABELS[sport]}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="dashboard-mobile-stack">
          {visibleSports.map((sport) => (
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
      <div className="dashboard__toolbar">
        <button
          className="dashboard__toggle-btn"
          onClick={() => setShowSportPicker(!showSportPicker)}
        >
          Sports
        </button>
        {showSportPicker && (
          <div className="dashboard__sport-picker">
            {ALL_SPORTS.map((sport) => (
              <label key={sport} className="dashboard__sport-option">
                <input
                  type="checkbox"
                  checked={visibleSports.includes(sport)}
                  onChange={() => toggleSport(sport)}
                />
                <span>{SPORT_LABELS[sport]}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div ref={containerRef} className="dashboard-container">
        {visibleSports.length > 0 && (
          <ResponsiveGridLayout
            className="dashboard-grid"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            draggableHandle=".drag-handle"
            isDraggable={!isMobile}
            isResizable={!isMobile}
            margin={[18, 18]}
            width={width}
          >
            {visibleSports.map((sport) => (
              <div key={sport} className="dashboard-widget-wrapper">
                <SportWidget sport={sport} />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
        {visibleSports.length === 0 && (
          <div className="dashboard__empty">
            No sports selected. Click <strong>Sports</strong> above to add some.
          </div>
        )}
      </div>
    </section>
  );
}
