import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import BoxScoreModal from '../BoxScoreModal';
import ScoreCard from '../ScoreCard';
import WireBulletin from '../WireBulletin';
import TeamSelector from '../TeamSelector';
import StandingsTable from '../StandingsTable';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useRelativeTime } from '../../hooks/useRelativeTime';
import { useTheme } from '../../theme-context';
import { normalizeHexColor, rgba, mixColors } from '../../utils/colors';
import { useScores, useTeams } from '../../api/queries';
import './SportWidget.css';

const SPORT_META = {
  nba: { icon: '🏀', label: 'NBA' },
  mlb: { icon: '⚾', label: 'MLB' },
  nfl: { icon: '🏈', label: 'NFL' },
  'mens-college-basketball': { icon: '🏀', label: 'NCAAM' },
  'womens-college-basketball': { icon: '🏀', label: 'NCAAW' },
  'college-baseball': { icon: '⚾', label: 'CBASE' },
  'college-softball': { icon: '🥎', label: 'CSOFT' },
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
  nfl: {
    primary: '#013369',
    secondary: '#d50a0a',
  },
  'mens-college-basketball': {
    primary: '#1a5276',
    secondary: '#e67e22',
  },
  'womens-college-basketball': {
    primary: '#8e44ad',
    secondary: '#e74c3c',
  },
  'college-baseball': {
    primary: '#1e6bb8',
    secondary: '#c9a227',
  },
  'college-softball': {
    primary: '#d4457a',
    secondary: '#6b3fa0',
  },
};

const STANDINGS_SPORTS = ['nfl', 'nba', 'mlb'];
const PERFORATION_DOTS = Array.from({ length: 14 });

function SkeletonCard() {
  return <div className="sport-widget__skeleton" aria-hidden="true" />;
}

export default function SportWidget({ sport, isReorderable = true }) {
  const meta = SPORT_META[sport] ?? SPORT_META.nba;
  const defaultTheme = DEFAULT_THEME[sport] ?? DEFAULT_THEME.nba;
  const theme = useTheme();
  const isWire = theme === 'wire';

  const [favorites, setFavorites] = useLocalStorage(`favoriteTeams.${sport}`, []);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [view, setView] = useLocalStorage(`widgetView.${sport}`, 'scores');
  const hasStandings = STANDINGS_SPORTS.includes(sport);
  const showStandings = hasStandings && view === 'standings';

  const queryClient = useQueryClient();
  const scoresQuery = useScores(sport);
  const { data: teamsData } = useTeams(sport);
  const isStandingsLoading = useIsFetching({ queryKey: ['standings', sport] }) > 0;

  const games = scoresQuery.data?.games ?? [];
  const isLoading = scoresQuery.isFetching;
  const isInitialLoad = scoresQuery.isPending;
  const error = scoresQuery.isError ? scoresQuery.error.message : null;
  const lastUpdated = scoresQuery.dataUpdatedAt ? new Date(scoresQuery.dataUpdatedAt) : null;
  const relativeUpdated = useRelativeTime(lastUpdated);
  const fetchScores = () => scoresQuery.refetch();
  const refreshStandings = () => queryClient.invalidateQueries({ queryKey: ['standings', sport] });

  const teamColors = useMemo(
    () => Object.fromEntries(
      (teamsData?.teams || [])
        .filter((team) => team.id)
        .map((team) => [team.id, team.color || ''])
    ),
    [teamsData]
  );

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

  const renderGame = (game) => (
    isWire
      ? (
        <WireBulletin
          key={game.id}
          game={game}
          onOpenBoxScore={() => setSelectedGame(game)}
        />
      )
      : (
        <ScoreCard
          key={game.id}
          game={game}
          onOpenBoxScore={() => setSelectedGame(game)}
        />
      )
  );

  return (
    <div className={`sport-widget sport-widget--${sport}${isWire ? ' sport-widget--wire' : ''}`} style={widgetStyle}>
      <header className={`sport-widget__header${isReorderable ? ' drag-handle' : ''}`} data-sport-label={meta.label}>
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
          {isWire ? (
            <span className="sport-widget__updated sport-widget__updated--wire" aria-live="polite">
              <i className="sport-widget__live-dot" aria-hidden="true"></i>
              Receiving · updated {relativeUpdated}
            </span>
          ) : (
            <span className="sport-widget__updated" aria-live="polite">{lastUpdatedLabel}</span>
          )}
          <button
            className={`sport-widget__refresh${(showStandings ? isStandingsLoading : isLoading) ? ' sport-widget__refresh--spinning' : ''}`}
            onClick={showStandings ? refreshStandings : fetchScores}
            title={`Refresh ${meta.label} ${showStandings ? 'standings' : 'scores'}`}
            aria-label={`Refresh ${meta.label} ${showStandings ? 'standings' : 'scores'}`}
            aria-busy={showStandings ? isStandingsLoading : isLoading}
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

      {isWire && (
        <div className="sport-widget__perf" aria-hidden="true">
          {PERFORATION_DOTS.map((_, i) => <i key={i} />)}
        </div>
      )}

      {hasStandings && (
        <div className="sport-widget__view-toggle" role="group" aria-label={`${meta.label} view`}>
          {['scores', 'standings'].map((option) => (
            <button
              key={option}
              className={`sport-widget__view-option${(showStandings ? 'standings' : 'scores') === option ? ' sport-widget__view-option--active' : ''}`}
              onClick={() => setView(option)}
              aria-pressed={(showStandings ? 'standings' : 'scores') === option}
            >
              {option === 'scores' ? 'Scores' : 'Standings'}
            </button>
          ))}
        </div>
      )}

      <div className="sport-widget__body" aria-live="polite" aria-atomic="false">
        {showStandings && (
          <StandingsTable sport={sport} favorites={favorites} />
        )}

        {!showStandings && isInitialLoad && (
          <div aria-label="Loading scores" role="status">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!showStandings && !isInitialLoad && error && (
          <div className="sport-widget__state" role="alert">
            <p className="sport-widget__state-kicker">Connection issue</p>
            <p className="sport-widget__error">{error}</p>
            <button className="sport-widget__retry" onClick={fetchScores}>Retry</button>
          </div>
        )}

        {!showStandings && !isInitialLoad && !error && games.length === 0 && (
          <div className="sport-widget__state" role="status">
            <p className="sport-widget__state-kicker">No games today</p>
            <p className="sport-widget__prompt">Check back later for today's schedule.</p>
          </div>
        )}

        {!showStandings && !isInitialLoad && !error && games.length > 0 && (
          <>
            {favoriteGames.length > 0 && (
              <section aria-label="Favorite teams' games">
                {favorites.length > 0 && (
                  <p className="sport-widget__section-label">⭐ Favorites</p>
                )}
                {favoriteGames.map(renderGame)}
              </section>
            )}

            {otherGames.length > 0 && (
              <section aria-label="All other games">
                {favoriteGames.length > 0 && (
                  <p className="sport-widget__section-label">All games</p>
                )}
                {otherGames.map(renderGame)}
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
