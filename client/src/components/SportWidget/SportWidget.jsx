import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import BoxScoreModal from '../BoxScoreModal';
import ScoreCard from '../ScoreCard';
import TeamSelector from '../TeamSelector';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { normalizeHexColor, rgba, mixColors } from '../../utils/colors';
import { SCORES_POLL_INTERVAL } from '../../constants';
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

const POLL_INTERVAL = SCORES_POLL_INTERVAL;

function SkeletonCard() {
  return <div className="sport-widget__skeleton" aria-hidden="true" />;
}

export default function SportWidget({ sport, isReorderable = true }) {
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

  const isFavoriteGame = (game) =>
    favorites.includes(game.homeTeam?.id) || favorites.includes(game.awayTeam?.id);

  const favoriteGames = games.filter(isFavoriteGame);
  const otherGames = games.filter((game) => !isFavoriteGame(game));

  const lastUpdatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : 'Not yet updated';

  const summaryLabel = favorites.length > 0
    ? `${favoriteGames.length} favorite game${favoriteGames.length === 1 ? '' : 's'} · ${games.length} total today`
    : `${games.length} game${games.length === 1 ? '' : 's'} today`;

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
      <header className={`sport-widget__header${isReorderable ? ' drag-handle' : ''}`}>
        <div className="sport-widget__header-left">
          <span className="sport-widget__icon-shell" aria-hidden="true">
            <span className="sport-widget__icon">{meta.icon}</span>
          </span>
          <div className="sport-widget__title-group">
            <span className="sport-widget__label">{meta.label}</span>
            <span className="sport-widget__subtitle" aria-live="polite" aria-atomic="true">{summaryLabel}</span>
          </div>
        </div>
        <div className="sport-widget__header-right">
          <span className="sport-widget__updated" aria-live="polite">{lastUpdatedLabel}</span>
          <button
            className={`sport-widget__refresh${isLoading ? ' sport-widget__refresh--spinning' : ''}`}
            onClick={fetchScores}
            title={`Refresh ${meta.label} scores`}
            aria-label={`Refresh ${meta.label} scores`}
            aria-busy={isLoading}
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

      <div className="sport-widget__body" aria-live="polite" aria-atomic="false">
        {isInitialLoad && (
          <div aria-label="Loading scores" role="status">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!isInitialLoad && error && (
          <div className="sport-widget__state" role="alert">
            <p className="sport-widget__state-kicker">Connection issue</p>
            <p className="sport-widget__error">{error}</p>
            <button className="sport-widget__retry" onClick={fetchScores}>Retry</button>
          </div>
        )}

        {!isInitialLoad && !error && games.length === 0 && (
          <div className="sport-widget__state" role="status">
            <p className="sport-widget__state-kicker">No games today</p>
            <p className="sport-widget__prompt">Check back later for today's schedule.</p>
          </div>
        )}

        {!isInitialLoad && !error && games.length > 0 && (
          <>
            {favoriteGames.length > 0 && (
              <section aria-label="Favorite teams' games">
                {favorites.length > 0 && (
                  <p className="sport-widget__section-label">⭐ Favorites</p>
                )}
                {favoriteGames.map((game) => (
                  <ScoreCard
                    key={game.id}
                    game={game}
                    onOpenBoxScore={() => setSelectedGame(game)}
                  />
                ))}
              </section>
            )}

            {otherGames.length > 0 && (
              <section aria-label="All other games">
                {favoriteGames.length > 0 && (
                  <p className="sport-widget__section-label">All games</p>
                )}
                {otherGames.map((game) => (
                  <ScoreCard
                    key={game.id}
                    game={game}
                    onOpenBoxScore={() => setSelectedGame(game)}
                  />
                ))}
              </section>
            )}
          </>
        )}
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
