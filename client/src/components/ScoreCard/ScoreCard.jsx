import { useState } from 'react';
import { formatScheduledTime, getFinalStatusLabel } from '../../utils/gameStatus';
import './ScoreCard.css';

function TeamLogo({ logo, abbreviation, name }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (logo && !imgFailed) {
    return (
      <img
        className="scorecard__logo"
        src={logo}
        alt={name}
        width={32}
        height={32}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <span className="scorecard__logo scorecard__logo--fallback">{abbreviation}</span>;
}

export default function ScoreCard({ game, onOpenBoxScore }) {
  const {
    status,
    statusDetail,
    startTime,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    prediction,
    situation,
  } = game;

  const isLive = status === 'live';
  const isFinal = status === 'final';
  const showScores = isLive || isFinal;
  // NFL only: down & distance, possession, red zone (live games).
  const liveSituation = isLive ? situation : null;
  const possessionMarker = (side) => (
    liveSituation?.possession === side
      ? <span className="scorecard__possession" role="img" aria-label="Has possession"> 🏈</span>
      : null
  );
  const canViewBoxScore = Boolean(onOpenBoxScore) && (isLive || isFinal);
  const awayRecordLabel = awayTeam.record
    ? `${awayTeam.shortName || awayTeam.name} · ${awayTeam.record}`
    : awayTeam.shortName || awayTeam.name;
  const homeRecordLabel = homeTeam.record
    ? `${homeTeam.shortName || homeTeam.name} · ${homeTeam.record}`
    : homeTeam.shortName || homeTeam.name;

  const homeWins = showScores && homeScore != null && awayScore != null && homeScore > awayScore;
  const awayWins = showScores && homeScore != null && awayScore != null && awayScore > homeScore;
  const showPrediction = status === 'scheduled'
    && prediction?.homeWinProbability != null
    && prediction?.awayWinProbability != null;

  return (
    <article className={`scorecard${isLive ? ' scorecard--live' : ''}${liveSituation?.isRedZone ? ' scorecard--red-zone' : ''}`}>
      <div className="scorecard__status">
        {isLive && <span className="scorecard__badge scorecard__badge--live">● LIVE</span>}
        {isFinal && (
          <span className="scorecard__badge scorecard__badge--final">
            {getFinalStatusLabel(statusDetail)}
          </span>
        )}
        {status === 'scheduled' && (
          <span className="scorecard__badge scorecard__badge--scheduled">
            {formatScheduledTime(startTime)}
          </span>
        )}
      </div>

      {liveSituation && (
        <div className="scorecard__situation">
          {statusDetail && <span className="scorecard__situation-clock">{statusDetail}</span>}
          {liveSituation.downDistanceText && <span>{liveSituation.downDistanceText}</span>}
          {liveSituation.isRedZone && <span className="scorecard__red-zone">Red zone</span>}
        </div>
      )}

      {showPrediction && (
        <div className="scorecard__prediction" aria-label={prediction.label || 'Matchup predictor'}>
          {prediction.label || 'Matchup Predictor'}
        </div>
      )}

      <div
        className={`scorecard__team${awayWins ? ' scorecard__team--winner' : ''}${canViewBoxScore ? ' scorecard__team--clickable' : ''}`}
        onClick={canViewBoxScore ? () => onOpenBoxScore(game) : undefined}
        role={canViewBoxScore ? 'button' : undefined}
        tabIndex={canViewBoxScore ? 0 : undefined}
        onKeyDown={canViewBoxScore ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenBoxScore(game); } } : undefined}
      >
        <TeamLogo logo={awayTeam.logo} abbreviation={awayTeam.abbreviation} name={awayTeam.name} />
        <div className="scorecard__team-copy">
          <span className="scorecard__name scorecard__name--full">{awayTeam.name}{possessionMarker('away')}</span>
          <span className="scorecard__name scorecard__name--abbr">{awayTeam.abbreviation}{possessionMarker('away')}</span>
          <span className="scorecard__meta">{awayRecordLabel}</span>
        </div>
        <span className={`scorecard__score${awayWins ? ' scorecard__score--winner' : ''}${showPrediction ? ' scorecard__score--prediction' : ''}`}>
          {showScores ? (awayScore ?? 0) : showPrediction ? `${prediction.awayWinProbability}%` : '--'}
        </span>
      </div>

      <div
        className={`scorecard__team${homeWins ? ' scorecard__team--winner' : ''}${canViewBoxScore ? ' scorecard__team--clickable' : ''}`}
        onClick={canViewBoxScore ? () => onOpenBoxScore(game) : undefined}
        role={canViewBoxScore ? 'button' : undefined}
        tabIndex={canViewBoxScore ? 0 : undefined}
        onKeyDown={canViewBoxScore ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenBoxScore(game); } } : undefined}
      >
        <TeamLogo logo={homeTeam.logo} abbreviation={homeTeam.abbreviation} name={homeTeam.name} />
        <div className="scorecard__team-copy">
          <span className="scorecard__name scorecard__name--full">{homeTeam.name}{possessionMarker('home')}</span>
          <span className="scorecard__name scorecard__name--abbr">{homeTeam.abbreviation}{possessionMarker('home')}</span>
          <span className="scorecard__meta">{homeRecordLabel}</span>
        </div>
        <span className={`scorecard__score${homeWins ? ' scorecard__score--winner' : ''}${showPrediction ? ' scorecard__score--prediction' : ''}`}>
          {showScores ? (homeScore ?? 0) : showPrediction ? `${prediction.homeWinProbability}%` : '--'}
        </span>
      </div>

      {canViewBoxScore && (
        <div className="scorecard__footer">
          <button className="scorecard__action" onClick={() => onOpenBoxScore(game)}>
            View box score
          </button>
        </div>
      )}
    </article>
  );
}
