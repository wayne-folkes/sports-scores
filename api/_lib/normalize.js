'use strict';

const ESPN_STATUS_MAP = {
  STATUS_IN_PROGRESS: 'live',
  STATUS_FINAL: 'final',
};

function normalizeStatus(espnStatusName) {
  return ESPN_STATUS_MAP[espnStatusName] || 'scheduled';
}

function getCompetition(data) {
  return data?.header?.competitions?.[0] || data?.competitions?.[0] || {};
}

function normalizeTeamInfo(team, competitor = {}) {
  const logo = (team.logos || [])[0]?.href || team.logo || '';
  const record = (competitor.records || []).find((item) => item.type === 'total')?.summary
    || (competitor.records || [])[0]?.summary
    || '';
  return {
    id: String(team.id || ''),
    name: team.displayName || team.name || '',
    shortName: team.name || team.displayName || '',
    abbreviation: team.abbreviation || '',
    logo,
    record,
  };
}

function parseScore(competitor) {
  const score = competitor?.score;
  if (score === undefined || score === null || score === '') return null;
  const num = Number(score);
  return Number.isNaN(num) ? null : num;
}

function parseProbability(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizePrediction(predictor, homeCompetitor, awayCompetitor, status) {
  if (status !== 'scheduled' || !predictor) return null;

  const homeTeamId = String(homeCompetitor?.team?.id || '');
  const awayTeamId = String(awayCompetitor?.team?.id || '');
  const homePredictor = predictor.homeTeam?.id === homeTeamId ? predictor.homeTeam : predictor.awayTeam?.id === homeTeamId ? predictor.awayTeam : null;
  const awayPredictor = predictor.awayTeam?.id === awayTeamId ? predictor.awayTeam : predictor.homeTeam?.id === awayTeamId ? predictor.homeTeam : null;

  let homeWinProbability = parseProbability(homePredictor?.gameProjection);
  let awayWinProbability = parseProbability(awayPredictor?.gameProjection);

  if (homeWinProbability == null && awayWinProbability != null) {
    homeWinProbability = 100 - awayWinProbability;
  }
  if (awayWinProbability == null && homeWinProbability != null) {
    awayWinProbability = 100 - homeWinProbability;
  }
  if (homeWinProbability == null || awayWinProbability == null) {
    return null;
  }

  return {
    label: predictor.header || 'Matchup Predictor',
    homeWinProbability,
    awayWinProbability,
  };
}

function normalizeScoreboard(data, sport, predictorsByEventId = {}) {
  const events = data.events || [];

  const games = events.map((event) => {
    const competition = (event.competitions || [])[0] || {};
    const competitors = competition.competitors || [];
    const statusObj = competition.status || event.status || {};
    const statusType = statusObj.type || {};

    const home = competitors.find((c) => c.homeAway === 'home') || {};
    const away = competitors.find((c) => c.homeAway === 'away') || {};
    const prediction = normalizePrediction(predictorsByEventId[String(event.id)], home, away, normalizeStatus(statusType.name));

    return {
      id: String(event.id || ''),
      status: normalizeStatus(statusType.name),
      statusDetail: statusType.shortDetail || statusType.description || '',
      startTime: event.date || null,
      homeTeam: normalizeTeamInfo(home.team || {}, home),
      awayTeam: normalizeTeamInfo(away.team || {}, away),
      homeScore: parseScore(home),
      awayScore: parseScore(away),
      prediction,
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

  const homeCompetitor = competitors.find((c) => c.homeAway === 'home') || {};
  const awayCompetitor = competitors.find((c) => c.homeAway === 'away') || {};

  const teamStats = (data.boxscore?.teams || []).reduce((acc, entry) => {
    const homeAway = entry.homeAway || 'unknown';
    const rawStats = entry.statistics || [];

    // Detect MLB nested format: [{ name: 'batting', stats: [...] }, ...]
    // vs NBA flat format: [{ abbreviation, displayValue, label }, ...]
    const isNested = rawStats.length > 0 && Array.isArray(rawStats[0].stats);

    let flatStats;
    if (isNested) {
      // MLB: flatten each category's stats array into one list
      const MLB_BATTING_KEYS = new Set(['R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'AVG', 'OBP', 'SLG']);
      const MLB_PITCHING_KEYS = new Set(['IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'ERA', 'PC-ST']);
      const allowedKeys = new Set([...MLB_BATTING_KEYS, ...MLB_PITCHING_KEYS]);

      flatStats = rawStats.flatMap((category) =>
        (category.stats || [])
          .filter((s) => allowedKeys.has(s.abbreviation))
          .map((s) => ({
            key: `${category.name}:${s.abbreviation}`,
            label: s.shortDisplayName || s.abbreviation || s.name || '',
            value: s.displayValue || String(s.value ?? ''),
          }))
      );
    } else {
      // NBA flat format
      flatStats = rawStats.map((stat) => ({
        key: stat.abbreviation || stat.name || stat.label || '',
        label: stat.label || stat.abbreviation || stat.name || '',
        value: stat.displayValue || '',
      }));
    }

    acc[homeAway] = {
      team: normalizeTeamInfo(entry.team || {}),
      statistics: flatStats,
    };
    return acc;
  }, {});

  const away = {
    team: normalizeTeamInfo(awayCompetitor.team || teamStats.away?.team || {}, awayCompetitor),
    score: parseScore(awayCompetitor),
    statistics: teamStats.away?.statistics || [],
  };

  const home = {
    team: normalizeTeamInfo(homeCompetitor.team || teamStats.home?.team || {}, homeCompetitor),
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
    if (statMap.has(stat.key)) statMap.get(stat.key).awayValue = stat.value || '—';
  }
  for (const stat of home.statistics) {
    if (statMap.has(stat.key)) statMap.get(stat.key).homeValue = stat.value || '—';
  }

  // Extract MLB player stats (batting + pitching)
  const MLB_BATTING_DISPLAY = ['H-AB', 'R', 'H', 'RBI', 'HR', 'BB', 'K', 'AVG'];
  const MLB_PITCHING_DISPLAY = ['IP', 'H', 'R', 'ER', 'BB', 'K', 'HR', 'ERA'];

  let players = sport === 'mlb'
    ? { away: { batting: [], pitching: [] }, home: { batting: [], pitching: [] } }
    : { away: [], home: [] };

  if (sport === 'mlb' && data.boxscore?.players?.length) {
    const awayTeamId = String(awayCompetitor?.team?.id || '');
    const homeTeamId = String(homeCompetitor?.team?.id || '');

    const isBattingGroup = (group) =>
      group.type === 'batting' || (group.names || []).includes('H-AB') || (group.names || []).includes('AB');

    const isPitchingGroup = (group) =>
      group.type === 'pitching' || ((group.names || []).includes('IP') && !(group.names || []).includes('H-AB'));

    const mapBatters = (group) => {
      const names = group.names || [];
      const abIdx = names.indexOf('AB');
      return (group.athletes || [])
        .filter((a) => {
          // atBats can be a play-by-play array OR a numeric count depending on the game
          if (Array.isArray(a.atBats)) return a.atBats.length > 0;
          if (a.atBats != null && !Number.isNaN(Number(a.atBats))) return Number(a.atBats) > 0;
          // fall back to the AB column in the stats array
          if (abIdx >= 0 && a.stats?.[abIdx] != null) return Number(a.stats[abIdx]) > 0;
          return (a.stats || []).some((s) => s !== '0' && s !== '' && s !== '.000' && s !== '0.000');
        })
        .sort((a, b) => (Number(a.batOrder) || 99) - (Number(b.batOrder) || 99))
        .map((a) => {
          const statsObj = {};
          names.forEach((name, i) => {
            if (MLB_BATTING_DISPLAY.includes(name)) {
              statsObj[name] = a.stats?.[i] ?? '';
            }
          });
          return {
            name: a.athlete?.displayName || '',
            shortName: a.athlete?.shortName || a.athlete?.shortDisplayName || '',
            position: a.position?.abbreviation || a.athlete?.position?.abbreviation || '',
            batOrder: Number(a.batOrder) || null,
            stats: statsObj,
          };
        });
    };

    const mapPitchers = (group) => {
      const names = group.names || [];
      return (group.athletes || []).map((a) => {
        const statsObj = {};
        names.forEach((name, i) => {
          if (MLB_PITCHING_DISPLAY.includes(name)) {
            statsObj[name] = a.stats?.[i] ?? '';
          }
        });
        return {
          name: a.athlete?.displayName || '',
          shortName: a.athlete?.shortName || a.athlete?.shortDisplayName || '',
          stats: statsObj,
        };
      });
    };

    const resolveHomeAway = (entry, index) => {
      if (entry.displayOrder != null) {
        return entry.displayOrder === 1 ? 'away' : 'home';
      }
      if (entry.team?.id) {
        const id = String(entry.team.id);
        if (id === awayTeamId) return 'away';
        if (id === homeTeamId) return 'home';
      }
      return index === 0 ? 'away' : 'home';
    };

    for (let i = 0; i < data.boxscore.players.length; i++) {
      const entry = data.boxscore.players[i];
      const side = resolveHomeAway(entry, i);
      const stats = entry.statistics || [];

      const battingGroup = stats.find(isBattingGroup);
      const pitchingGroup = stats.find(isPitchingGroup);

      if (battingGroup) players[side].batting = mapBatters(battingGroup);
      if (pitchingGroup) players[side].pitching = mapPitchers(pitchingGroup);
    }
  }

  // Extract NBA player stats
  if (sport === 'nba' && data.boxscore?.players?.length) {
    const PLAYER_STAT_KEYS = ['MIN', 'PTS', 'FG', '3PT', 'FT', 'REB', 'AST', 'TO', 'STL', 'BLK'];

    // Match each players entry to away/home using competitor ids or display order
    const awayTeamId = String(awayCompetitor?.team?.id || '');
    const homeTeamId = String(homeCompetitor?.team?.id || '');

    const mapTeamPlayers = (entry) => {
      const statsBlock = (entry.statistics || [])[0] || {};
      const names = statsBlock.names || [];
      const athletes = statsBlock.athletes || [];

      return athletes
        .filter((a) => !a.didNotPlay && a.stats && a.stats.length > 0)
        .map((a) => {
          const statsObj = {};
          names.forEach((name, i) => {
            if (PLAYER_STAT_KEYS.includes(name)) {
              statsObj[name] = a.stats[i] || '';
            }
          });
          return {
            name: a.athlete?.displayName || '',
            shortName: a.athlete?.shortName || a.athlete?.shortDisplayName || '',
            starter: a.starter || false,
            stats: statsObj,
          };
        })
        .sort((a, b) => (parseInt(b.stats.PTS, 10) || 0) - (parseInt(a.stats.PTS, 10) || 0));
    };

    // Try to match by team id, fall back to index order (0 = away, 1 = home)
    const findEntry = (teamId, fallbackIndex) => {
      if (teamId) {
        const byId = data.boxscore.players.find(
          (e) => String(e.team?.id || '') === teamId
        );
        if (byId) return byId;
      }
      return data.boxscore.players[fallbackIndex] || null;
    };

    const awayEntry = findEntry(awayTeamId, 0);
    const homeEntry = findEntry(homeTeamId, 1);

    if (awayEntry) players.away = mapTeamPlayers(awayEntry);
    if (homeEntry) players.home = mapTeamPlayers(homeEntry);
  }

  return {
    sport,
    eventId: String(eventId || competition.id || ''),
    status: normalizeStatus(statusType.name),
    statusDetail: statusType.shortDetail || statusType.description || '',
    startTime: competition.date || null,
    teams: { away, home },
    statistics: statOrder.map((key) => statMap.get(key)),
    players,
  };
}

module.exports = { normalizeStatus, normalizeScoreboard, normalizeBoxscore };
