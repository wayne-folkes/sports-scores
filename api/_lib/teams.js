'use strict';

function normalizeTeams(data, sport) {
  const items = (data.sports || [])
    .flatMap((s) => s.leagues || [])
    .flatMap((l) => l.teams || [])
    .map((entry) => entry.team || entry);

  const teams = items.map((team) => {
    const logo = (team.logos || [])[0]?.href || team.logo || '';
    const color = (team.color || '').replace(/^#/, '');
    return {
      id: String(team.id || ''),
      name: team.displayName || team.name || '',
      abbreviation: team.abbreviation || '',
      logo,
      color,
    };
  });

  teams.sort((a, b) => a.name.localeCompare(b.name));

  return { sport, teams };
}

module.exports = { normalizeTeams };
