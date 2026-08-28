import { getFinalStatusLabel, formatScheduledTime } from './gameStatus';

function teamLabel(team) {
  return team?.shortName || team?.name || 'Team';
}

function marginVerb(margin) {
  if (margin <= 4) return 'edge';
  if (margin <= 14) return 'beat';
  return 'rout';
}

export function generateHeadline(game) {
  const { status, statusDetail, startTime, homeTeam, awayTeam, homeScore, awayScore } = game;

  const home = teamLabel(homeTeam);
  const away = teamLabel(awayTeam);

  if (status === 'scheduled') {
    const time = formatScheduledTime(startTime);
    return time ? `${away} and ${home} meet at ${time}` : `${away} and ${home} face off today`;
  }

  if (homeScore == null || awayScore == null) {
    return `${away} at ${home}`;
  }

  if (status === 'live') {
    if (homeScore === awayScore) {
      return `${home} and ${away} tied at ${homeScore}${statusDetail ? ` (${statusDetail})` : ''}`;
    }
    const leader = homeScore > awayScore ? home : away;
    const trailer = homeScore > awayScore ? away : home;
    const leaderScore = Math.max(homeScore, awayScore);
    const trailerScore = Math.min(homeScore, awayScore);
    return `${leader} leads ${trailer}, ${leaderScore}-${trailerScore}${statusDetail ? ` (${statusDetail})` : ''}`;
  }

  // status === 'final'
  const winner = homeScore > awayScore ? home : away;
  const loser = homeScore > awayScore ? away : home;
  const winnerScore = Math.max(homeScore, awayScore);
  const loserScore = Math.min(homeScore, awayScore);
  const margin = winnerScore - loserScore;

  const finalLabel = getFinalStatusLabel(statusDetail);
  const isOvertime = /OT/i.test(finalLabel);

  if (isOvertime) {
    return `${winner} outlasts ${loser} in overtime, ${winnerScore}-${loserScore}`;
  }

  return `${winner} ${marginVerb(margin)} ${loser}, ${winnerScore}-${loserScore}`;
}
