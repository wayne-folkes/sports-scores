import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithQuery } from './renderWithQuery';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SportWidget from '../components/SportWidget/SportWidget';
import BoxScoreModal from '../components/BoxScoreModal/BoxScoreModal';

const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const callsTo = (path) => global.fetch.mock.calls.filter(([url]) => url.includes(path)).length;

const game = {
  id: '401810761',
  status: 'final',
  statusDetail: 'Final',
  homeTeam: { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN' },
  awayTeam: { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL' },
  homeScore: 120,
  awayScore: 113,
};

const boxscore = {
  status: 'final',
  statusDetail: 'Final',
  statistics: [{ key: 'PTS', label: 'Points', awayValue: '113', homeValue: '120' }],
  teams: {},
  players: {},
};

describe('shared data fetching', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('widget and team selector share one teams request', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/scores')) return ok({ games: [] });
      if (url.includes('/api/teams')) return ok({ teams: [{ id: '18', name: 'New York Knicks', abbreviation: 'NY', color: '006bb6' }] });
      return Promise.reject(new Error(`Unexpected ${url}`));
    });

    renderWithQuery(<SportWidget sport="nba" />);
    await waitFor(() => expect(callsTo('/api/teams')).toBe(1));

    fireEvent.click(screen.getByRole('button', { name: /Edit NBA teams/i }));
    await waitFor(() => expect(screen.getByText('New York Knicks')).toBeInTheDocument());

    expect(callsTo('/api/teams')).toBe(1);
  });

  it('box score renders without a summary section when summaries are unavailable', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/boxscore')) return ok(boxscore);
      if (url.includes('/api/summary')) return Promise.resolve({ ok: false, status: 503 });
      return Promise.reject(new Error(`Unexpected ${url}`));
    });

    renderWithQuery(<BoxScoreModal sport="nba" game={game} onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText('Points')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText('Generating summary…')).not.toBeInTheDocument());
    expect(screen.queryByText('Game Summary')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('box score shows the AI summary when one is available', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/boxscore')) return ok(boxscore);
      if (url.includes('/api/summary')) return ok({ summary: 'Denver held off LA late.', gameState: 'post', cached: true });
      return Promise.reject(new Error(`Unexpected ${url}`));
    });

    renderWithQuery(<BoxScoreModal sport="nba" game={game} onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText('Denver held off LA late.')).toBeInTheDocument());
    expect(screen.getByText('Game Summary')).toBeInTheDocument();
  });
});
