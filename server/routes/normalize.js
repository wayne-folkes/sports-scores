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

function getCompetition(data) {
  return data?.header?.competitions?.[0] || data?.competitions?.[0] || {};
}

function normalizeTeamInfo(team) {
  const logo = (team.logos || [])[0]?.href || team.logo || '';
  return {
    id: String(team.id || ''),
    name: team.displayName || team.name || '',
    abbreviation: team.abbreviation || '',
    logo,
  };
}

function parseScore(competitor) {
  const score = competitor?.score;
  if (score === undefined || score === null || score === '') return null;
  const num = Number(score);
  return Number.isNaN(num) ? null : num;
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

    return {
      id: String(event.id || ''),
      status: normalizeStatus(statusType.name),
      statusDetail: statusType.shortDetail || statusType.description || '',
      startTime: event.date || null,
      homeTeam: normalizeTeamInfo(home.team || {}),
      awayTeam: normalizeTeamInfo(away.team || {}),
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

function normalizeBoxscore(data, sport, eventId) {
  const competition = getCompetition(data);
  const competitors = competition.competitors || [];
  const statusType = competition.status?.type || {};

  const homeCompetitor = competitors.find((competitor) => competitor.homeAway === 'home') || {};
  const awayCompetitor = competitors.find((competitor) => competitor.homeAway === 'away') || {};

  const teamStats = (data.boxscore?.teams || []).reduce((accumulator, entry) => {
    const homeAway = entry.homeAway || 'unknown';
    accumulator[homeAway] = {
      team: normalizeTeamInfo(entry.team || {}),
      statistics: (entry.statistics || []).map((stat) => ({
        key: stat.abbreviation || stat.name || stat.label || '',
        label: stat.label || stat.abbreviation || stat.name || '',
        value: stat.displayValue || '',
      })),
    };
    return accumulator;
  }, {});

  const away = {
    team: normalizeTeamInfo(awayCompetitor.team || teamStats.away?.team || {}),
    score: parseScore(awayCompetitor),
    statistics: teamStats.away?.statistics || [],
  };

  const home = {
    team: normalizeTeamInfo(homeCompetitor.team || teamStats.home?.team || {}),
    score: parseScore(homeCompetitor),
    statistics: teamStats.home?.statistics || [],
  };

  const statOrder = [];
  const statMap = new Map();

  for (const side of [away, home]) {
    for (const stat of side.statistics) {
      if (!stat.key) continue;
      if (!statMap.has(stat.key)) {
        statOrder.push(stat.key);
        statMap.set(stat.key, { key: stat.key, label: stat.label, awayValue: '—', homeValue: '—' });
      }
    }
  }

  for (const stat of away.statistics) {
    if (statMap.has(stat.key)) {
      statMap.get(stat.key).awayValue = stat.value || '—';
    }
  }

  for (const stat of home.statistics) {
    if (statMap.has(stat.key)) {
      statMap.get(stat.key).homeValue = stat.value || '—';
    }
  }

  return {
    sport,
    eventId: String(eventId || competition.id || ''),
    status: normalizeStatus(statusType.name),
    statusDetail: statusType.shortDetail || statusType.description || '',
    startTime: competition.date || null,
    teams: { away, home },
    statistics: statOrder.map((key) => statMap.get(key)),
  };
}

module.exports = { normalizeStatus, normalizeScoreboard, normalizeBoxscore };
