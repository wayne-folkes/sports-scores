import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import ScoreCard from '../ScoreCard';
import TeamSelector from '../TeamSelector';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import './SportWidget.css';

const SPORT_META = {
  nba: { icon: '🏀', label: 'NBA' },
  mlb: { icon: '⚾', label: 'MLB' },
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

  return (
    <div className={`sport-widget sport-widget--${sport}`}>
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
            title={lastUpdatedLabel}
            aria-label={`Refresh ${meta.label} scores`}
          >
            ⟳
          </button>
          <button
            className="sport-widget__edit"
            onClick={() => setShowSelector(true)}
            aria-label={`Edit ${meta.label} teams`}
          >
            ✦
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
          filteredGames.map((game) => <ScoreCard key={game.id} game={game} />)}
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
    </div>
  );
}
