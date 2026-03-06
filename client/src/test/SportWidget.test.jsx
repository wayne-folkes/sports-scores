import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SportWidget from '../components/SportWidget/SportWidget';

const mockGames = [
  {
    id: '401810761',
    status: 'final',
    statusDetail: 'Final',
    startTime: '2026-03-06T03:00Z',
    homeTeam: { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN', logo: 'https://example.com/den.png', record: '39-24' },
    awayTeam: { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', logo: 'https://example.com/lal.png', record: '37-25' },
    homeScore: 120,
    awayScore: 113,
  },
];

const mockTeams = [
  { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', logo: '', color: '552583' },
  { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN', logo: '', color: '0e2240' },
];

describe('SportWidget', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/scores')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ games: mockGames }) });
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ teams: mockTeams }) });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sport label', () => {
    render(<SportWidget sport="nba" />);
    expect(screen.getByText('NBA')).toBeInTheDocument();
  });

  it('shows skeleton cards during initial load', () => {
    render(<SportWidget sport="nba" />);
    expect(screen.getByLabelText('Loading scores')).toBeInTheDocument();
  });

  it('shows "no favorites" prompt when favorites list is empty', async () => {
    render(<SportWidget sport="nba" />);

    await waitFor(() => {
      expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument();
    });
  });

  it('shows score cards when favorites match games', async () => {
    localStorage.setItem('favoriteTeams.nba', JSON.stringify(['13']));

    render(<SportWidget sport="nba" />);

    await waitFor(() => {
      expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
    });
  });

  it('shows "quiet day" when favorites are set but no games match', async () => {
    localStorage.setItem('favoriteTeams.nba', JSON.stringify(['99']));

    render(<SportWidget sport="nba" />);

    await waitFor(() => {
      expect(screen.getByText(/Quiet day/i)).toBeInTheDocument();
    });
  });

  it('shows error state when scores fetch fails', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/scores')) {
        return Promise.resolve({ ok: false, status: 502 });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ teams: [] }) });
    });

    render(<SportWidget sport="nba" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('renders MLB widget correctly', () => {
    render(<SportWidget sport="mlb" />);
    expect(screen.getByText('MLB')).toBeInTheDocument();
  });

  it('opens TeamSelector when Teams button is clicked', async () => {
    render(<SportWidget sport="nba" />);

    fireEvent.click(screen.getByRole('button', { name: /Edit NBA teams/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
