import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import BoxScoreModal from '../BoxScoreModal';
import ScoreCard from '../ScoreCard';
import TeamSelector from '../TeamSelector';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import './SportWidget.css';

const SPORT_META = {
  nba: { icon: '🏀', label: 'NBA' },
  mlb: { icon: '⚾', label: 'MLB' },
};

const DEFAULT_THEME = {
  nba: {
    primary: '#2563eb',
    secondary: '#ef4444',
  },
  mlb: {
    primary: '#0f766e',
    secondary: '#f97316',
  },
};

const POLL_INTERVAL = 30_000;

function SkeletonCard() {
  return <div className="sport-widget__skeleton" aria-hidden="true" />;
}

function normalizeHexColor(color, fallback) {
  const cleaned = color?.replace('#', '').trim();
  if (!cleaned || !/^[\da-f]{6}$/i.test(cleaned)) {
    return fallback;
  }

  return `#${cleaned}`;
}

function hexToRgb(hexColor) {
  const value = hexColor.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgba(hexColor, alpha) {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixColors(primaryHex, secondaryHex, weight = 0.5) {
  const primary = hexToRgb(primaryHex);
  const secondary = hexToRgb(secondaryHex);
  const mix = (first, second) => Math.round(first * weight + second * (1 - weight));
  return `rgb(${mix(primary.r, secondary.r)}, ${mix(primary.g, secondary.g)}, ${mix(primary.b, secondary.b)})`;
}

export default function SportWidget({ sport }) {
  const meta = SPORT_META[sport] ?? SPORT_META.nba;
  const defaultTheme = DEFAULT_THEME[sport] ?? DEFAULT_THEME.nba;

  const [favorites, setFavorites] = useLocalStorage(`favoriteTeams.${sport}`, []);
  const [games, setGames] = useState([]);
  const [teamColors, setTeamColors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const intervalRef = useRef(null);

  const fetchScores = useCallback(() => {
    if (document.hidden) return;
    setIsLoading(true);
    setError(null);

    fetch(`/api/scores/${sport}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load scores (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setGames(data.games || []);
        setLastUpdated(new Date());
        setIsLoading(false);
        setIsInitialLoad(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
        setIsInitialLoad(false);
      });
  }, [sport]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      fetchScores();
    });

    intervalRef.current = setInterval(fetchScores, POLL_INTERVAL);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchScores();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.cancelAnimationFrame(frameId);
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchScores]);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/teams/${sport}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load team colors (${response.status})`);
        }

        return response.json();
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const colors = Object.fromEntries(
          (data.teams || [])
            .filter((team) => team.id)
            .map((team) => [team.id, team.color || ''])
        );

        setTeamColors(colors);
      })
      .catch(() => {
        if (isMounted) {
          setTeamColors({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sport]);

  const filteredGames = favorites.length > 0
    ? games.filter(
        (game) => favorites.includes(game.homeTeam?.id) || favorites.includes(game.awayTeam?.id)
      )
    : [];

  const lastUpdatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : 'Not yet updated';

  const summaryLabel = favorites.length > 0
    ? `${favorites.length} favorite${favorites.length === 1 ? '' : 's'} · ${filteredGames.length} game${filteredGames.length === 1 ? '' : 's'} today`
    : 'Choose teams to personalize this widget';

  const dynamicPrimary = normalizeHexColor(
    favorites.map((teamId) => teamColors[teamId]).find(Boolean),
    defaultTheme.primary
  );

  const widgetStyle = {
    '--widget-accent-primary': dynamicPrimary,
    '--widget-accent-secondary': mixColors(dynamicPrimary, defaultTheme.secondary, 0.55),
    '--widget-accent-soft': rgba(dynamicPrimary, 0.18),
    '--widget-accent-ring': rgba(dynamicPrimary, 0.3),
  };

  return (
    <div className={`sport-widget sport-widget--${sport}`} style={widgetStyle}>
      <header className="sport-widget__header drag-handle">
        <div className="sport-widget__header-left">
          <span className="sport-widget__icon-shell" aria-hidden="true">
            <span className="sport-widget__icon">{meta.icon}</span>
          </span>
          <div className="sport-widget__title-group">
            <span className="sport-widget__label">{meta.label}</span>
            <span className="sport-widget__subtitle">{summaryLabel}</span>
          </div>
        </div>
        <div className="sport-widget__header-right">
          <span className="sport-widget__updated" aria-live="polite">{lastUpdatedLabel}</span>
          <button
            className={`sport-widget__refresh${isLoading ? ' sport-widget__refresh--spinning' : ''}`}
            onClick={fetchScores}
            title={`Refresh ${meta.label} scores`}
            aria-label={`Refresh ${meta.label} scores`}
          >
            <span className="sport-widget__control-icon" aria-hidden="true">⟳</span>
            <span className="sport-widget__control-label">Refresh</span>
          </button>
          <button
            className="sport-widget__edit"
            onClick={() => setShowSelector(true)}
            title={`Choose ${meta.label} teams`}
            aria-label={`Edit ${meta.label} teams`}
          >
            <span className="sport-widget__control-icon" aria-hidden="true">✦</span>
            <span className="sport-widget__control-label">Teams</span>
          </button>
        </div>
      </header>

      <div className="sport-widget__body">
        {isInitialLoad && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!isInitialLoad && error && (
          <div className="sport-widget__state">
            <p className="sport-widget__state-kicker">Connection issue</p>
            <p className="sport-widget__error">{error}</p>
            <button className="sport-widget__retry" onClick={fetchScores}>Retry</button>
          </div>
        )}

        {!isInitialLoad && !error && favorites.length === 0 && (
          <div className="sport-widget__state">
            <p className="sport-widget__state-kicker">No favorites yet</p>
            <p className="sport-widget__prompt">Pick your teams to turn this widget into a personal scoreboard.</p>
          </div>
        )}

        {!isInitialLoad && !error && favorites.length > 0 && filteredGames.length === 0 && (
          <div className="sport-widget__state">
            <p className="sport-widget__state-kicker">Quiet day</p>
            <p className="sport-widget__prompt">No games are scheduled today for your selected teams.</p>
          </div>
        )}

        {!isInitialLoad && !error && filteredGames.length > 0 &&
          filteredGames.map((game) => (
            <ScoreCard
              key={game.id}
              game={game}
              onOpenBoxScore={() => setSelectedGame(game)}
            />
          ))}
      </div>

      {showSelector && createPortal(
        <TeamSelector
          sport={sport}
          favorites={favorites}
          onFavoritesChange={setFavorites}
          onClose={() => setShowSelector(false)}
        />,
        document.body
      )}

      {selectedGame && createPortal(
        <BoxScoreModal
          sport={sport}
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />,
        document.body
      )}
    </div>
  );
}
