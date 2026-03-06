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

export default function ScoreCard({ game }) {
  const {
    status,
    startTime,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
  } = game;

  const isLive = status === 'live';
  const isFinal = status === 'final';
  const showScores = isLive || isFinal;

  const homeWins = showScores && homeScore != null && awayScore != null && homeScore > awayScore;
  const awayWins = showScores && homeScore != null && awayScore != null && awayScore > homeScore;

  return (
    <article className={`scorecard${isLive ? ' scorecard--live' : ''}`}>
      <div className="scorecard__status">
        {isLive && <span className="scorecard__badge scorecard__badge--live">● LIVE</span>}
        {isFinal && <span className="scorecard__badge scorecard__badge--final">FINAL</span>}
        {status === 'scheduled' && (
          <span className="scorecard__badge scorecard__badge--scheduled">
            {formatTime(startTime)}
          </span>
        )}
      </div>

      <div className={`scorecard__team${awayWins ? ' scorecard__team--winner' : ''}`}>
        <TeamLogo logo={awayTeam.logo} abbreviation={awayTeam.abbreviation} name={awayTeam.name} />
        <span className="scorecard__name scorecard__name--full">{awayTeam.name}</span>
        <span className="scorecard__name scorecard__name--abbr">{awayTeam.abbreviation}</span>
        <span className={`scorecard__score${awayWins ? ' scorecard__score--winner' : ''}`}>
          {showScores ? (awayScore ?? 0) : '--'}
        </span>
      </div>

      <div className={`scorecard__team${homeWins ? ' scorecard__team--winner' : ''}`}>
        <TeamLogo logo={homeTeam.logo} abbreviation={homeTeam.abbreviation} name={homeTeam.name} />
        <span className="scorecard__name scorecard__name--full">{homeTeam.name}</span>
        <span className="scorecard__name scorecard__name--abbr">{homeTeam.abbreviation}</span>
        <span className={`scorecard__score${homeWins ? ' scorecard__score--winner' : ''}`}>
          {showScores ? (homeScore ?? 0) : '--'}
        </span>
      </div>
    </article>
  );
}
