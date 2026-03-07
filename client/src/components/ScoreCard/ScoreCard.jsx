import { useState } from 'react';
import './ScoreCard.css';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mm = minutes === 0 ? '00' : String(minutes).padStart(2, '0');
  return `${hours}:${mm} ${ampm} ET`;
}

function getFinalStatusLabel(statusDetail) {
  if (!statusDetail) return 'FINAL';

  const overtimeMatch = statusDetail.match(/(?:final\/)?(\d*ot)/i);
  if (overtimeMatch) {
    return `FINAL / ${overtimeMatch[1].toUpperCase()}`;
  }

  const extraInningsMatch = statusDetail.match(/(?:final\/|f\/)(\d{2}|\d{1})/i);
  if (extraInningsMatch) {
    return `FINAL / ${extraInningsMatch[1]} INN`;
  }

  return 'FINAL';
}

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
  } = game;

  const isLive = status === 'live';
  const isFinal = status === 'final';
  const showScores = isLive || isFinal;
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
    <article className={`scorecard${isLive ? ' scorecard--live' : ''}`}>
      <div className="scorecard__status">
        {isLive && <span className="scorecard__badge scorecard__badge--live">● LIVE</span>}
        {isFinal && (
          <span className="scorecard__badge scorecard__badge--final">
            {getFinalStatusLabel(statusDetail)}
          </span>
        )}
        {status === 'scheduled' && (
          <span className="scorecard__badge scorecard__badge--scheduled">
            {formatTime(startTime)}
          </span>
        )}
      </div>

      {showPrediction && (
        <div className="scorecard__prediction" aria-label={prediction.label || 'Matchup predictor'}>
          {prediction.label || 'Matchup Predictor'}
        </div>
      )}

      <div className={`scorecard__team${awayWins ? ' scorecard__team--winner' : ''}`}>
        <TeamLogo logo={awayTeam.logo} abbreviation={awayTeam.abbreviation} name={awayTeam.name} />
        <div className="scorecard__team-copy">
          <span className="scorecard__name scorecard__name--full">{awayTeam.name}</span>
          <span className="scorecard__name scorecard__name--abbr">{awayTeam.abbreviation}</span>
          <span className="scorecard__meta">{awayRecordLabel}</span>
        </div>
        <span className={`scorecard__score${awayWins ? ' scorecard__score--winner' : ''}${showPrediction ? ' scorecard__score--prediction' : ''}`}>
          {showScores ? (awayScore ?? 0) : showPrediction ? `${prediction.awayWinProbability}%` : '--'}
        </span>
      </div>

      <div className={`scorecard__team${homeWins ? ' scorecard__team--winner' : ''}`}>
        <TeamLogo logo={homeTeam.logo} abbreviation={homeTeam.abbreviation} name={homeTeam.name} />
        <div className="scorecard__team-copy">
          <span className="scorecard__name scorecard__name--full">{homeTeam.name}</span>
          <span className="scorecard__name scorecard__name--abbr">{homeTeam.abbreviation}</span>
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
