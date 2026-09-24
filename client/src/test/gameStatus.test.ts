import { describe, it, expect } from 'vitest';
import { formatScheduledTime } from '../utils/gameStatus';
import { generateHeadline } from '../utils/generateHeadline';
import type { Game } from '../../../api/_lib/types';

describe('formatScheduledTime', () => {
  it('converts UTC start times to Eastern time (EDT)', () => {
    // Falcons at Packers, Thursday night: 8:15 PM EDT is 00:15 UTC the next day.
    expect(formatScheduledTime('2026-09-25T00:15Z')).toBe('8:15 PM ET');
    expect(formatScheduledTime('2026-09-27T17:00Z')).toBe('1:00 PM ET');
  });

  it('follows the switch to standard time (EST)', () => {
    expect(formatScheduledTime('2026-12-07T01:15Z')).toBe('8:15 PM ET');
  });

  it('returns an empty string when there is no start time', () => {
    expect(formatScheduledTime(null)).toBe('');
    expect(formatScheduledTime('')).toBe('');
  });
});

describe('generateHeadline for scheduled games', () => {
  it('uses the Eastern kickoff time', () => {
    const game: Game = {
      id: '401872948',
      status: 'scheduled',
      statusDetail: '9/24 - 8:15 PM EDT',
      startTime: '2026-09-25T00:15Z',
      homeTeam: { id: '9', name: 'Green Bay Packers', shortName: 'Packers', abbreviation: 'GB', logo: '', record: '1-1' },
      awayTeam: { id: '1', name: 'Atlanta Falcons', shortName: 'Falcons', abbreviation: 'ATL', logo: '', record: '0-2' },
      homeScore: null,
      awayScore: null,
      prediction: null,
    };
    expect(generateHeadline(game)).toBe('Falcons and Packers meet at 8:15 PM ET');
  });
});
