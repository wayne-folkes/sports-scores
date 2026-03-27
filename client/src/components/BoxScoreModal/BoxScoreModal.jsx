import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BOXSCORE_POLL_INTERVAL } from '../../constants';
import './BoxScoreModal.css';

function getStatusLabel(boxscore) {
  if (boxscore.status === 'scheduled') {
    return 'Matchup';
  }

  if (boxscore.status === 'live') {
    return boxscore.statusDetail || 'Live';
  }

  return boxscore.statusDetail || 'Final';
}

function TeamLogo({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        className="box-score-modal__team-logo"
        src={src}
        alt={alt}
        width={48}
        height={48}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="box-score-modal__team-logo box-score-modal__team-logo--fallback" aria-label={alt}>
      {alt?.slice(0, 3).toUpperCase()}
    </span>
  );
}

export default function BoxScoreModal({ sport, game, onClose }) {
  const [boxscore, setBoxscore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchBoxscore = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetch(`/api/boxscore/${sport}/${game.id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load box score (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        setBoxscore(data);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        setError(fetchError.message);
        setIsLoading(false);
      });
  }, [game.id, sport]);

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [onClose]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      fetchBoxscore();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [fetchBoxscore]);

  // Auto-refresh every 30s while the game is live
  useEffect(() => {
    if (game.status !== 'live') return;

    intervalRef.current = setInterval(fetchBoxscore, BOXSCORE_POLL_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [game.status, fetchBoxscore]);

  const statRows = useMemo(() => {
    const all = boxscore?.statistics || [];
    // Limit to key stats to keep the modal compact
    const basketballStats = ['PTS', 'REB', 'AST', 'FG%', '3P%', 'FT%', 'TO', 'STL', 'BLK'];
    const baseballStats = ['R', 'H', 'HR', 'RBI', 'BB', 'K', 'SO', '2B', '3B', 'AVG'];
    const keyStats = {
      nba: basketballStats,
      'mens-college-basketball': basketballStats,
      'womens-college-basketball': basketballStats,
      mlb: baseballStats,
      'college-baseball': baseballStats,
      'college-softball': baseballStats,
    };
    const allowed = keyStats[sport];
    if (!allowed) return all;
    const filtered = all.filter((s) => allowed.includes(s.key));
    return filtered.length > 0 ? filtered : all.slice(0, 9);
  }, [boxscore, sport]);

  const playersAway = useMemo(() => boxscore?.players?.away || [], [boxscore]);
  const playersHome = useMemo(() => boxscore?.players?.home || [], [boxscore]);
  const isBasketballSport = sport === 'nba' || sport === 'mens-college-basketball' || sport === 'womens-college-basketball';
  const hasPlayers = isBasketballSport && (playersAway.length > 0 || playersHome.length > 0);

  const isBaseballSport = sport === 'mlb' || sport === 'college-baseball' || sport === 'college-softball';

  const mlbPlayers = useMemo(() => {
    if (!isBaseballSport) return null;
    const p = boxscore?.players;
    if (!p) return null;
    const awayHasData = (p.away?.batting?.length > 0) || (p.away?.pitching?.length > 0);
    const homeHasData = (p.home?.batting?.length > 0) || (p.home?.pitching?.length > 0);
    if (!awayHasData && !homeHasData) return null;
    return p;
  }, [isBaseballSport, boxscore]);

  const bodyRef = useRef(null);

  const away = boxscore?.teams?.away || {
    team: game.awayTeam,
    score: game.awayScore,
  };
  const home = boxscore?.teams?.home || {
    team: game.homeTeam,
    score: game.homeScore,
  };

  const scrollToTeam = (side) => {
    const target = bodyRef.current?.querySelector(`[data-team-section="${side}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="box-score-modal__backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className={`box-score-modal box-score-modal--${sport}`} onClick={(event) => event.stopPropagation()}>
        <div className="box-score-modal__header">
          <div>
            <p className="box-score-modal__eyebrow">{sport.toUpperCase()} box score</p>
            <h2 className="box-score-modal__title">{away.team.name} at {home.team.name}</h2>
            <p className="box-score-modal__subtitle">{getStatusLabel(boxscore || game)}</p>
          </div>
          <button className="box-score-modal__close" onClick={onClose} aria-label="Close box score">×</button>
        </div>

        <div className="box-score-modal__scoreboard">
          <div
            className="box-score-modal__team-card box-score-modal__team-card--clickable"
            onClick={() => scrollToTeam('away')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToTeam('away'); } }}
          >
            <TeamLogo src={away.team.logo} alt={away.team.name} />
            <span className="box-score-modal__team-name">{away.team.abbreviation || away.team.name}</span>
            <span className="box-score-modal__team-score">{away.score ?? '—'}</span>
          </div>
          <div className="box-score-modal__divider">vs</div>
          <div
            className="box-score-modal__team-card box-score-modal__team-card--home box-score-modal__team-card--clickable"
            onClick={() => scrollToTeam('home')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToTeam('home'); } }}
          >
            <TeamLogo src={home.team.logo} alt={home.team.name} />
            <span className="box-score-modal__team-name">{home.team.abbreviation || home.team.name}</span>
            <span className="box-score-modal__team-score">{home.score ?? '—'}</span>
          </div>
        </div>

        <div className="box-score-modal__body" ref={bodyRef}>
          {isLoading && <div className="box-score-modal__state">Loading box score…</div>}

          {!isLoading && error && (
            <div className="box-score-modal__state">
              <p className="box-score-modal__error">{error}</p>
              <button className="box-score-modal__retry" onClick={fetchBoxscore}>Retry</button>
            </div>
          )}

          {!isLoading && !error && statRows.length > 0 && (
            <table className="box-score-modal__stats">
              <thead>
                <tr className="box-score-modal__stats-header">
                  <th scope="col">{away.team.abbreviation || 'Away'}</th>
                  <th scope="col">Team Stats</th>
                  <th scope="col">{home.team.abbreviation || 'Home'}</th>
                </tr>
              </thead>
              <tbody>
                {statRows.map((stat) => (
                  <tr key={stat.key} className="box-score-modal__stat-row">
                    <td className="box-score-modal__stat-value">{stat.awayValue}</td>
                    <th scope="row" className="box-score-modal__stat-label">{stat.label}</th>
                    <td className="box-score-modal__stat-value box-score-modal__stat-value--home">{stat.homeValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && !error && statRows.length === 0 && (
            <div className="box-score-modal__state">No box score is available for this game yet.</div>
          )}

          {!isLoading && !error && hasPlayers && (
            <div className="bs-players">
              {[
                { side: 'away', label: `${away.team.abbreviation || 'Away'} Starters + Bench`, players: playersAway },
                { side: 'home', label: `${home.team.abbreviation || 'Home'} Starters + Bench`, players: playersHome },
              ].map(({ side, label, players: teamPlayers }) => (
                <div key={label} className="bs-players__section" data-team-section={side}>
                  <div className="bs-players__heading">{label}</div>
                  <div className="bs-players__table-wrap">
                    <table className="bs-players__table">
                      <thead>
                        <tr className="bs-players__row bs-players__row--head">
                          <th className="bs-players__name bs-players__col-head" scope="col">Player</th>
                          <th className="bs-players__stat bs-players__col-head" scope="col">PTS</th>
                          <th className="bs-players__stat bs-players__col-head" scope="col">REB</th>
                          <th className="bs-players__stat bs-players__col-head" scope="col">AST</th>
                          <th className="bs-players__stat bs-players__stat--secondary bs-players__col-head" scope="col">FG</th>
                          <th className="bs-players__stat bs-players__stat--secondary bs-players__col-head" scope="col">3PT</th>
                          <th className="bs-players__stat bs-players__stat--secondary bs-players__col-head" scope="col">FT</th>
                          <th className="bs-players__stat bs-players__col-head" scope="col">MIN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamPlayers.map((player, idx) => (
                          <tr
                            key={player.name || idx}
                            className={`bs-players__row${idx === 0 ? ' bs-players__row--top' : ''}`}
                          >
                            <td className="bs-players__name">{player.shortName || player.name}</td>
                            <td className="bs-players__stat">{player.stats.PTS ?? '—'}</td>
                            <td className="bs-players__stat">{player.stats.REB ?? '—'}</td>
                            <td className="bs-players__stat">{player.stats.AST ?? '—'}</td>
                            <td className="bs-players__stat bs-players__stat--secondary">{player.stats.FG ?? '—'}</td>
                            <td className="bs-players__stat bs-players__stat--secondary">{player.stats['3PT'] ?? '—'}</td>
                            <td className="bs-players__stat bs-players__stat--secondary">{player.stats.FT ?? '—'}</td>
                            <td className="bs-players__stat">{player.stats.MIN ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && mlbPlayers && (
            <div className="bs-players">
              {[
                { side: 'away', abbr: away.team.abbreviation || 'Away', data: mlbPlayers.away },
                { side: 'home', abbr: home.team.abbreviation || 'Home', data: mlbPlayers.home },
              ].map(({ side, abbr, data }) => (
                <div key={side} className="bs-players__group" data-team-section={side}>
                  {data?.batting?.length > 0 && (
                    <>
                      <p className="bs-players__group-heading">{abbr} Batting</p>
                      <div className="bs-players__table-wrap">
                        <table className="bs-players__table">
                          <thead>
                            <tr className="bs-players__row bs-players__row--head">
                              <th className="bs-players__th bs-players__th--name" scope="col">Player</th>
                              <th className="bs-players__th" scope="col">H-AB</th>
                              <th className="bs-players__th" scope="col">R</th>
                              <th className="bs-players__th" scope="col">H</th>
                              <th className="bs-players__th" scope="col">RBI</th>
                              <th className="bs-players__th" scope="col">HR</th>
                              <th className="bs-players__th" scope="col">BB</th>
                              <th className="bs-players__th" scope="col">K</th>
                              <th className="bs-players__th bs-players__td--secondary" scope="col">AVG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.batting.map((player, idx) => (
                              <tr key={player.name || idx} className="bs-players__row">
                                <td className="bs-players__td-name">
                                  {player.shortName || player.name}
                                  {player.position && <span className="bs-players__pos">&nbsp;{player.position}</span>}
                                </td>
                                <td className="bs-players__td">{player.stats['H-AB'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['R'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['H'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['RBI'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['HR'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['BB'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['K'] || '—'}</td>
                                <td className="bs-players__td bs-players__td--secondary">{player.stats['AVG'] || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {data?.pitching?.length > 0 && (
                    <>
                      <p className="bs-players__group-heading">{abbr} Pitching</p>
                      <div className="bs-players__table-wrap">
                        <table className="bs-players__table">
                          <thead>
                            <tr className="bs-players__row bs-players__row--head">
                              <th className="bs-players__th bs-players__th--name" scope="col">Pitcher</th>
                              <th className="bs-players__th" scope="col">IP</th>
                              <th className="bs-players__th" scope="col">H</th>
                              <th className="bs-players__th" scope="col">R</th>
                              <th className="bs-players__th" scope="col">ER</th>
                              <th className="bs-players__th" scope="col">BB</th>
                              <th className="bs-players__th" scope="col">K</th>
                              <th className="bs-players__th" scope="col">HR</th>
                              <th className="bs-players__th bs-players__td--secondary" scope="col">ERA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.pitching.map((player, idx) => (
                              <tr key={player.name || idx} className="bs-players__row">
                                <td className="bs-players__td-name">{player.shortName || player.name}</td>
                                <td className="bs-players__td">{player.stats['IP'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['H'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['R'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['ER'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['BB'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['K'] || '—'}</td>
                                <td className="bs-players__td">{player.stats['HR'] || '—'}</td>
                                <td className="bs-players__td bs-players__td--secondary">{player.stats['ERA'] || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

