// NFL-specific normalization used by the scoreboard and box score functions.
import type { EspnJson, FootballCategory, FootballSide, FootballSituation, PlayerStats } from './types';

function toCount(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

// ESPN only attaches `situation` to live games; between plays it may omit
// the down/distance text (e.g. during kickoffs or timeouts).
export function normalizeFootballSituation(situation: EspnJson, homeTeamId: string, awayTeamId: string): FootballSituation | null {
  if (!situation) return null;

  const possessionId = String(situation.possession || '');
  let possession: FootballSituation['possession'] = null;
  if (possessionId && possessionId === homeTeamId) possession = 'home';
  else if (possessionId && possessionId === awayTeamId) possession = 'away';

  return {
    downDistanceText: situation.downDistanceText || '',
    shortDownDistanceText: situation.shortDownDistanceText || '',
    possession,
    isRedZone: Boolean(situation.isRedZone),
    homeTimeouts: toCount(situation.homeTimeouts),
    awayTimeouts: toCount(situation.awayTimeouts),
    lastPlay: situation.lastPlay?.text || '',
  };
}

export const FOOTBALL_PLAYER_CATEGORIES: Record<FootballCategory, string[]> = {
  passing: ['C/ATT', 'YDS', 'TD', 'INT', 'QBR'],
  rushing: ['CAR', 'YDS', 'AVG', 'TD', 'LONG'],
  receiving: ['REC', 'YDS', 'TD', 'LONG', 'TGTS'],
};

function emptyFootballSide(): FootballSide {
  return { passing: [], rushing: [], receiving: [] };
}

function isFootballCategory(name: unknown): name is FootballCategory {
  return typeof name === 'string' && Object.hasOwn(FOOTBALL_PLAYER_CATEGORIES, name);
}

// ESPN groups football player stats by category, each with a `labels` array
// whose indexes line up with every athlete's `stats` array.
export function normalizeFootballPlayers(
  boxscorePlayers: EspnJson,
  awayTeamId: string,
  homeTeamId: string
): { away: FootballSide; home: FootballSide } {
  const players = { away: emptyFootballSide(), home: emptyFootballSide() };

  (boxscorePlayers || []).forEach((entry: EspnJson, index: number) => {
    const teamId = String(entry.team?.id || '');
    let side: 'away' | 'home' = index === 0 ? 'away' : 'home';
    if (teamId && teamId === awayTeamId) side = 'away';
    else if (teamId && teamId === homeTeamId) side = 'home';

    for (const category of entry.statistics || []) {
      const name: unknown = category.name;
      if (!isFootballCategory(name)) continue;
      const wanted = FOOTBALL_PLAYER_CATEGORIES[name];

      const labels: string[] = category.labels || [];
      players[side][name] = (category.athletes || []).map((a: EspnJson) => {
        const stats: PlayerStats = {};
        labels.forEach((label, i) => {
          if (wanted.includes(label)) stats[label] = a.stats?.[i] ?? '';
        });
        return {
          name: a.athlete?.displayName || '',
          shortName: a.athlete?.shortName || a.athlete?.shortDisplayName || '',
          stats,
        };
      });
    }
  });

  return players;
}
