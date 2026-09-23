'use strict';

// NFL-specific normalization shared by the Vercel functions (api/) and the
// Express dev server (server/).

function toCount(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

// ESPN only attaches `situation` to live games; between plays it may omit
// the down/distance text (e.g. during kickoffs or timeouts).
function normalizeFootballSituation(situation, homeTeamId, awayTeamId) {
  if (!situation) return null;

  const possessionId = String(situation.possession || '');
  let possession = null;
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

const FOOTBALL_PLAYER_CATEGORIES = {
  passing: ['C/ATT', 'YDS', 'TD', 'INT', 'QBR'],
  rushing: ['CAR', 'YDS', 'AVG', 'TD', 'LONG'],
  receiving: ['REC', 'YDS', 'TD', 'LONG', 'TGTS'],
};

function emptyFootballSide() {
  return Object.fromEntries(Object.keys(FOOTBALL_PLAYER_CATEGORIES).map((name) => [name, []]));
}

// ESPN groups football player stats by category, each with a `labels` array
// whose indexes line up with every athlete's `stats` array.
function normalizeFootballPlayers(boxscorePlayers, awayTeamId, homeTeamId) {
  const players = { away: emptyFootballSide(), home: emptyFootballSide() };

  (boxscorePlayers || []).forEach((entry, index) => {
    const teamId = String(entry.team?.id || '');
    let side = index === 0 ? 'away' : 'home';
    if (teamId && teamId === awayTeamId) side = 'away';
    else if (teamId && teamId === homeTeamId) side = 'home';

    for (const category of entry.statistics || []) {
      const wanted = FOOTBALL_PLAYER_CATEGORIES[category.name];
      if (!wanted) continue;

      const labels = category.labels || [];
      players[side][category.name] = (category.athletes || []).map((a) => {
        const stats = {};
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

module.exports = { normalizeFootballSituation, normalizeFootballPlayers, FOOTBALL_PLAYER_CATEGORIES };
