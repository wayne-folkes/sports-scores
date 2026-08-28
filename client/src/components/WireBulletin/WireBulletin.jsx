import { useState } from 'react';
import { getFinalStatusLabel, formatScheduledTime } from '../../utils/gameStatus';
import { generateHeadline } from '../../utils/generateHeadline';
import './WireBulletin.css';

// Tracks how many times `score` has changed. Used as a React `key` on the
// score element so each change remounts it, replaying the CSS flash
// animation — no timers or effect-driven state needed to turn it back off.
function useChangeCount(score) {
  const [state, setState] = useState({ score, count: 0 });

  if (state.score !== score) {
    setState({ score, count: score != null && state.score != null ? state.count + 1 : state.count });
  }

  return state.count;
}

export default function WireBulletin({ game, onOpenBoxScore }) {
  const {
    status,
    statusDetail,
    startTime,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
  } = game;

  const isLive = status === 'live';
  const isFinal = status === 'final';
  const showScores = isLive || isFinal;
  const canViewBoxScore = Boolean(onOpenBoxScore) && (isLive || isFinal);

  const homeChangeCount = useChangeCount(homeScore);
  const awayChangeCount = useChangeCount(awayScore);
  const justInCount = homeChangeCount + awayChangeCount;

  const headline = generateHeadline(game);
  const dateline = `${(homeTeam?.name || homeTeam?.shortName || 'Home').toUpperCase()} —`;

  let stampText = formatScheduledTime(startTime);
  let stampClass = 'wire-bulletin__stamp--sched';
  if (isLive) {
    stampText = statusDetail ? `Live · ${statusDetail}` : 'Live';
    stampClass = 'wire-bulletin__stamp--live';
  } else if (isFinal) {
    stampText = getFinalStatusLabel(statusDetail);
    stampClass = 'wire-bulletin__stamp--final';
  }

  const handleOpen = () => {
    if (canViewBoxScore) onOpenBoxScore(game);
  };

  return (
    <article className="wire-bulletin">
      <div className="wire-bulletin__top">
        <span className="wire-bulletin__dateline">{dateline}</span>
        <span className="wire-bulletin__status-group">
          <span className={`wire-bulletin__stamp ${stampClass}`}>{stampText}</span>
          {justInCount > 0 && (
            <span key={`just-in-${justInCount}`} className="wire-bulletin__just-in">Just in</span>
          )}
        </span>
      </div>

      <h3 className="wire-bulletin__headline">{headline}</h3>

      <div
        className={`wire-bulletin__row${canViewBoxScore ? ' wire-bulletin__row--clickable' : ''}`}
        onClick={canViewBoxScore ? handleOpen : undefined}
        role={canViewBoxScore ? 'button' : undefined}
        tabIndex={canViewBoxScore ? 0 : undefined}
        onKeyDown={canViewBoxScore ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } } : undefined}
      >
        <span className="wire-bulletin__team">
          {awayTeam?.shortName || awayTeam?.name}
          {awayTeam?.record ? ` (${awayTeam.record})` : ''}
        </span>
        <span
          key={`away-score-${awayChangeCount}`}
          className={`wire-bulletin__score${awayChangeCount > 0 ? ' wire-bulletin__score--flash' : ''}`}
        >
          {showScores ? (awayScore ?? 0) : '--'}
        </span>
      </div>

      <div
        className={`wire-bulletin__row${canViewBoxScore ? ' wire-bulletin__row--clickable' : ''}`}
        onClick={canViewBoxScore ? handleOpen : undefined}
        role={canViewBoxScore ? 'button' : undefined}
        tabIndex={canViewBoxScore ? 0 : undefined}
        onKeyDown={canViewBoxScore ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } } : undefined}
      >
        <span className="wire-bulletin__team">
          {homeTeam?.shortName || homeTeam?.name}
          {homeTeam?.record ? ` (${homeTeam.record})` : ''}
        </span>
        <span
          key={`home-score-${homeChangeCount}`}
          className={`wire-bulletin__score${homeChangeCount > 0 ? ' wire-bulletin__score--flash' : ''}`}
        >
          {showScores ? (homeScore ?? 0) : '--'}
        </span>
      </div>

      {canViewBoxScore && (
        <div className="wire-bulletin__footer">
          <button className="wire-bulletin__action" onClick={handleOpen}>View box score</button>
        </div>
      )}
    </article>
  );
}
