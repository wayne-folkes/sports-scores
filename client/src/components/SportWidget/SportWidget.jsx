import { useState, useEffect, useCallback, useRef } from 'react';
import ScoreCard from '../ScoreCard';
import TeamSelector from '../TeamSelector';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import './SportWidget.css';

const SPORT_META = {
  nba: { icon: '🏀', label: 'NBA', accentVar: '--accent-nba', accentLightVar: '--accent-nba-light' },
  mlb: { icon: '⚾', label: 'MLB', accentVar: '--accent-mlb', accentLightVar: '--accent-mlb-light' },
};

const POLL_INTERVAL = 30_000;

function SkeletonCard() {
  return <div className="sport-widget__skeleton" aria-hidden="true" />;
}

export default function SportWidget({ sport }) {
  const meta = SPORT_META[sport] ?? SPORT_META.nba;

  const [favorites, setFavorites] = useLocalStorage(`favoriteTeams.${sport}`, []);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSelector, setShowSelector] = useState(false);

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
        setGames(data);
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

  // Initial fetch + polling
  useEffect(() => {
    fetchScores();

    intervalRef.current = setInterval(fetchScores, POLL_INTERVAL);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchScores();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchScores]);

  const filteredGames =
    favorites.length > 0
      ? games.filter(
          (g) => favorites.includes(g.homeTeam?.id) || favorites.includes(g.awayTeam?.id)
        )
      : [];

  const lastUpdatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : null;

  return (
    <div className={`sport-widget sport-widget--${sport}`}>
      {/* Header — drag handle */}
      <header className="sport-widget__header drag-handle">
        <div className="sport-widget__header-left">
          <span className="sport-widget__icon" aria-hidden="true">{meta.icon}</span>
          <span className="sport-widget__label">{meta.label}</span>
        </div>
        <div className="sport-widget__header-right">
          {lastUpdated && (
            <span className="sport-widget__updated" aria-live="polite">
              {lastUpdatedLabel}
            </span>
          )}
          <button
            className={`sport-widget__refresh${isLoading ? ' sport-widget__refresh--spinning' : ''}`}
            onClick={fetchScores}
            title={lastUpdatedLabel ?? 'Not yet updated'}
            aria-label={`Refresh ${meta.label} scores`}
          >
            ⟳
          </button>
          <button
            className="sport-widget__edit"
            onClick={() => setShowSelector(true)}
            aria-label={`Edit ${meta.label} teams`}
          >
            ✏️
          </button>
        </div>
      </header>

      {/* Body */}
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
            <p className="sport-widget__error">{error}</p>
            <button className="sport-widget__retry" onClick={fetchScores}>
              Retry
            </button>
          </div>
        )}

        {!isInitialLoad && !error && favorites.length === 0 && (
          <div className="sport-widget__state">
            <p className="sport-widget__prompt">
              No teams selected — click ✏️ to pick your teams
            </p>
          </div>
        )}

        {!isInitialLoad && !error && favorites.length > 0 && filteredGames.length === 0 && (
          <div className="sport-widget__state">
            <p className="sport-widget__prompt">No games today for your teams</p>
          </div>
        )}

        {!isInitialLoad && !error && filteredGames.length > 0 &&
          filteredGames.map((game) => <ScoreCard key={game.id} game={game} />)
        }
      </div>

      {/* TeamSelector modal */}
      {showSelector && (
        <TeamSelector
          sport={sport}
          favorites={favorites}
          onFavoritesChange={setFavorites}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}
