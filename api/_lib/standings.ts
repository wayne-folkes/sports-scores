import { ESPN_API_BASE } from './config';
import type { EspnJson, StandingsGroup, StandingsResponse, StandingsTeam } from './types';

export const STANDINGS_URLS: Record<string, string> = {
  nfl: `${ESPN_API_BASE}/apis/v2/sports/football/nfl/standings`,
  nba: `${ESPN_API_BASE}/apis/v2/sports/basketball/nba/standings`,
  mlb: `${ESPN_API_BASE}/apis/v2/sports/baseball/mlb/standings`,
};

// Column label -> ESPN stat `name`, in display order.
export const STANDINGS_COLUMNS: Record<string, [label: string, statName: string][]> = {
  nfl: [['W', 'wins'], ['L', 'losses'], ['T', 'ties'], ['PCT', 'winPercent'], ['PF', 'pointsFor'], ['PA', 'pointsAgainst'], ['STRK', 'streak']],
  nba: [['W', 'wins'], ['L', 'losses'], ['PCT', 'winPercent'], ['GB', 'gamesBehind'], ['STRK', 'streak']],
  mlb: [['W', 'wins'], ['L', 'losses'], ['PCT', 'winPercent'], ['GB', 'gamesBehind'], ['STRK', 'streak']],
};

function statValue(stat: EspnJson): number | null {
  if (!stat) return null;
  if (stat.value !== undefined && stat.value !== null && !Number.isNaN(Number(stat.value))) return Number(stat.value);
  return null;
}

interface RankedEntry {
  team: StandingsTeam;
  seed: number | null;
  winPercent: number | null;
  stats: Record<string, string>;
}

function normalizeEntry(entry: EspnJson, columns: [string, string][]): RankedEntry {
  const team = entry.team || {};
  const statsByName = new Map<string, EspnJson>((entry.stats || []).map((stat: EspnJson) => [stat.name || stat.type, stat]));

  const stats: Record<string, string> = {};
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
function collectGroups(node: EspnJson, columns: [string, string][], groups: StandingsGroup[], parentName = ''): void {
  const entries: EspnJson[] = node.standings?.entries || [];
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

export function normalizeStandings(data: EspnJson, sport: string): StandingsResponse {
  const columns = STANDINGS_COLUMNS[sport] || [];
  const groups: StandingsGroup[] = [];
  // Skip the league-level root as a parent name; groups are named by
  // conference (and division, where ESPN nests them).
  for (const child of data?.children || []) {
    collectGroups(child, columns, groups);
  }

  const firstStandings = (data?.children || []).find((child: EspnJson) => child.standings)?.standings || {};

  return {
    sport,
    season: firstStandings.seasonDisplayName || String(firstStandings.season || ''),
    columns: columns.map(([label]) => label),
    groups,
  };
}
