import { useCallback, useEffect, useMemo, useState } from 'react';
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

function StatRow({ label, awayValue, homeValue }) {
  return (
    <div className="box-score-modal__stat-row">
      <span className="box-score-modal__stat-value">{awayValue}</span>
      <span className="box-score-modal__stat-label">{label}</span>
      <span className="box-score-modal__stat-value box-score-modal__stat-value--home">{homeValue}</span>
    </div>
  );
}

export default function BoxScoreModal({ sport, game, onClose }) {
  const [boxscore, setBoxscore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <img className="box-score-modal__team-logo" src={away.team.logo} alt={away.team.name} />
            <span className="box-score-modal__team-name">{away.team.abbreviation || away.team.name}</span>
            <span className="box-score-modal__team-score">{away.score ?? '—'}</span>
          </div>
          <div className="box-score-modal__divider">vs</div>
          <div className="box-score-modal__team-card box-score-modal__team-card--home">
            <img className="box-score-modal__team-logo" src={home.team.logo} alt={home.team.name} />
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
            <div className="box-score-modal__stats">
              <div className="box-score-modal__stats-header">
                <span>{away.team.abbreviation || 'Away'}</span>
                <span>Team Stats</span>
                <span>{home.team.abbreviation || 'Home'}</span>
              </div>
              {statRows.map((stat) => (
                <StatRow
                  key={stat.key}
                  label={stat.label}
                  awayValue={stat.awayValue}
                  homeValue={stat.homeValue}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && statRows.length === 0 && (
            <div className="box-score-modal__state">No box score is available for this game yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
