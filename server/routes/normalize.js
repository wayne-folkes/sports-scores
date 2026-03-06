'use strict';

const ESPN_STATUS_MAP = {
  STATUS_IN_PROGRESS: 'live',
  STATUS_FINAL: 'final',
};

/**
 * Maps an ESPN status type name to a normalized status string.
 * @param {string} espnStatusName
 * @returns {'live'|'final'|'scheduled'}
 */
function normalizeStatus(espnStatusName) {
  return ESPN_STATUS_MAP[espnStatusName] || 'scheduled';
}

/**
 * Normalizes ESPN scoreboard API response into a consistent shape.
 * @param {object} data - Raw ESPN scoreboard API response
 * @param {string} sport - Sport identifier (e.g. 'nba', 'mlb')
 */
function normalizeScoreboard(data, sport) {
  const events = data.events || [];

  const games = events.map((event) => {
    const competition = (event.competitions || [])[0] || {};
    const competitors = competition.competitors || [];
    const statusObj = competition.status || event.status || {};
    const statusType = statusObj.type || {};

    const home = competitors.find((c) => c.homeAway === 'home') || {};
    const away = competitors.find((c) => c.homeAway === 'away') || {};

    const teamInfo = (competitor) => {
      const team = competitor.team || {};
      const logo = (team.logos || [])[0]?.href || team.logo || '';
      return {
        id: String(team.id || ''),
        name: team.displayName || team.name || '',
        abbreviation: team.abbreviation || '',
        logo,
      };
    };

    const parseScore = (competitor) => {
      const score = competitor.score;
      if (score === undefined || score === null || score === '') return null;
      const num = Number(score);
      return isNaN(num) ? null : num;
    };

    return {
      id: String(event.id || ''),
      status: normalizeStatus(statusType.name),
      statusDetail: statusType.shortDetail || statusType.description || '',
      startTime: event.date || null,
      homeTeam: teamInfo(home),
      awayTeam: teamInfo(away),
      homeScore: parseScore(home),
      awayScore: parseScore(away),
    };
  });

  return {
    sport,
    lastUpdated: new Date().toISOString(),
    games,
  };
}

module.exports = { normalizeStatus, normalizeScoreboard };
