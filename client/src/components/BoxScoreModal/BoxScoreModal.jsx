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

  const statRows = useMemo(() => boxscore?.statistics || [], [boxscore]);

  const away = boxscore?.teams?.away || {
    team: game.awayTeam,
    score: game.awayScore,
  };
  const home = boxscore?.teams?.home || {
    team: game.homeTeam,
    score: game.homeScore,
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
          <div className="box-score-modal__team-card">
            <TeamLogo src={away.team.logo} alt={away.team.name} />
            <span className="box-score-modal__team-name">{away.team.abbreviation || away.team.name}</span>
            <span className="box-score-modal__team-score">{away.score ?? '—'}</span>
          </div>
          <div className="box-score-modal__divider">vs</div>
          <div className="box-score-modal__team-card box-score-modal__team-card--home">
            <TeamLogo src={home.team.logo} alt={home.team.name} />
            <span className="box-score-modal__team-name">{home.team.abbreviation || home.team.name}</span>
            <span className="box-score-modal__team-score">{home.score ?? '—'}</span>
          </div>
        </div>

        <div className="box-score-modal__body">
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
        </div>
      </div>
    </div>
  );
}

