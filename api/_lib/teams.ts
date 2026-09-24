import type { EspnJson, Team, TeamsResponse } from './types';

export function normalizeTeams(data: EspnJson, sport: string): TeamsResponse {
  const items: EspnJson[] = (data.sports || [])
    .flatMap((s: EspnJson) => s.leagues || [])
    .flatMap((l: EspnJson) => l.teams || [])
    .map((entry: EspnJson) => entry.team || entry);

  const teams: Team[] = items.map((team) => {
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
