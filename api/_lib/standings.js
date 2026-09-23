'use strict';

const { ESPN_API_BASE } = require('./config');

const STANDINGS_URLS = {
  nfl: `${ESPN_API_BASE}/apis/v2/sports/football/nfl/standings`,
  nba: `${ESPN_API_BASE}/apis/v2/sports/basketball/nba/standings`,
  mlb: `${ESPN_API_BASE}/apis/v2/sports/baseball/mlb/standings`,
};

// Column label -> ESPN stat `name`, in display order.
const STANDINGS_COLUMNS = {
  nfl: [['W', 'wins'], ['L', 'losses'], ['T', 'ties'], ['PCT', 'winPercent'], ['PF', 'pointsFor'], ['PA', 'pointsAgainst'], ['STRK', 'streak']],
  nba: [['W', 'wins'], ['L', 'losses'], ['PCT', 'winPercent'], ['GB', 'gamesBehind'], ['STRK', 'streak']],
  mlb: [['W', 'wins'], ['L', 'losses'], ['PCT', 'winPercent'], ['GB', 'gamesBehind'], ['STRK', 'streak']],
};

function statValue(stat) {
  if (!stat) return null;
  if (stat.value !== undefined && stat.value !== null && !Number.isNaN(Number(stat.value))) return Number(stat.value);
  return null;
}

function normalizeEntry(entry, columns) {
  const team = entry.team || {};
  const statsByName = new Map((entry.stats || []).map((stat) => [stat.name || stat.type, stat]));

  const stats = {};
  for (const [label, name] of columns) {
    const stat = statsByName.get(name);
    stats[label] = stat?.displayValue ?? (stat?.value != null ? String(stat.value) : '');
  }

  return {
    team: {
      id: String(team.id || ''),
      name: team.displayName || team.name || '',
      abbreviation: team.abbreviation || '',
      logo: (team.logos || [])[0]?.href || team.logo || '',
    },
    seed: statValue(statsByName.get('playoffSeed')),
    winPercent: statValue(statsByName.get('winPercent')),
    stats,
  };
}

// Depending on the league ESPN nests groups as conference -> division, or
// returns conferences/leagues with entries directly. Any node carrying
// `standings.entries` becomes one group.
function collectGroups(node, columns, groups, parentName = '') {
  const entries = node.standings?.entries || [];
  if (entries.length > 0) {
    const normalized = entries.map((entry) => normalizeEntry(entry, columns));
    normalized.sort((a, b) => {
      if (a.seed != null && b.seed != null) return a.seed - b.seed;
      if (a.seed != null) return -1;
      if (b.seed != null) return 1;
      return (b.winPercent ?? 0) - (a.winPercent ?? 0);
    });
    groups.push({
      name: node.name || '',
      abbreviation: node.abbreviation || '',
      parent: parentName,
      entries: normalized.map(({ team, stats }) => ({ team, stats })),
    });
  }

  for (const child of node.children || []) {
    collectGroups(child, columns, groups, node.name || parentName);
  }
}

function normalizeStandings(data, sport) {
  const columns = STANDINGS_COLUMNS[sport] || [];
  const groups = [];
  // Skip the league-level root as a parent name; groups are named by
  // conference (and division, where ESPN nests them).
  for (const child of data?.children || []) {
    collectGroups(child, columns, groups);
  }

  const firstStandings = (data?.children || []).find((child) => child.standings)?.standings || {};

  return {
    sport,
    season: firstStandings.seasonDisplayName || String(firstStandings.season || ''),
    columns: columns.map(([label]) => label),
    groups,
  };
}

module.exports = { STANDINGS_URLS, STANDINGS_COLUMNS, normalizeStandings };
