import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithQuery } from './renderWithQuery';
import { mockFetch, fetchCallsTo } from './fetchMock';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScoreCard from '../components/ScoreCard/ScoreCard';
import SportWidget from '../components/SportWidget/SportWidget';
import type { Game } from '../../../api/_lib/types';

const liveNflGame: Game = {
  id: '401772001',
  status: 'live',
  statusDetail: '3rd 8:42',
  startTime: '2026-09-27T17:00Z',
  awayTeam: { id: '19', name: 'New York Giants', shortName: 'Giants', abbreviation: 'NYG', logo: '', record: '3-0' },
  homeTeam: { id: '6', name: 'Dallas Cowboys', shortName: 'Cowboys', abbreviation: 'DAL', logo: '', record: '1-2' },
  awayScore: 14,
  homeScore: 10,
  prediction: null,
  situation: {
    downDistanceText: '3rd & 7 at DAL 15',
    shortDownDistanceText: '3rd & 7',
    possession: 'away',
    isRedZone: true,
    homeTimeouts: 3,
    awayTimeouts: 2,
    lastPlay: '',
  },
};

const standings = {
  sport: 'nfl',
  season: '2026',
  columns: ['W', 'L', 'T', 'PCT', 'PF', 'PA', 'STRK'],
  groups: [{
    name: 'NFC East',
    abbreviation: 'NFCE',
    parent: 'National Football Conference',
    entries: [
      { team: { id: '19', name: 'New York Giants', abbreviation: 'NYG', logo: '' }, stats: { W: '3', L: '0', T: '0', PCT: '1.000', PF: '80', PA: '40', STRK: 'W3' } },
      { team: { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL', logo: '' }, stats: { W: '1', L: '2', T: '0', PCT: '.333', PF: '60', PA: '70', STRK: 'L1' } },
    ],
  }],
};

describe('ScoreCard NFL situation', () => {
  it('shows clock, down & distance, possession and red zone for live games', () => {
    const { container } = renderWithQuery(<ScoreCard game={liveNflGame} onOpenBoxScore={vi.fn()} />);

    expect(screen.getByText('3rd 8:42')).toBeInTheDocument();
    expect(screen.getByText('3rd & 7 at DAL 15')).toBeInTheDocument();
    expect(screen.getByText('Red zone')).toBeInTheDocument();
    expect(container.querySelector('.scorecard--red-zone')).not.toBeNull();
    // Marker appears in both the full-name and abbreviation spans of the away row only
    const markers = screen.getAllByLabelText('Has possession');
    expect(markers).toHaveLength(2);
    markers.forEach((marker) => expect(marker.parentElement?.textContent).toMatch(/Giants|NYG/));
  });

  it('hides situation once the game is final', () => {
    renderWithQuery(<ScoreCard game={{ ...liveNflGame, status: 'final', statusDetail: 'Final' }} onOpenBoxScore={vi.fn()} />);

    expect(screen.queryByText('3rd & 7 at DAL 15')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Has possession')).not.toBeInTheDocument();
  });
});

describe('SportWidget standings toggle', () => {
  beforeEach(() => {
    mockFetch((url) => {
      if (url.includes('/api/scores')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ games: [liveNflGame] }) });
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ teams: [] }) });
      }
      if (url.includes('/api/standings/nfl')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(standings) });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('switches between scores and standings and highlights favorites', async () => {
    localStorage.setItem('favoriteTeams.nfl', JSON.stringify(['19']));
    renderWithQuery(<SportWidget sport="nfl" />);

    await waitFor(() => expect(screen.getByText('3rd & 7 at DAL 15')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Standings' }));

    await waitFor(() => expect(screen.getByText('NFC East')).toBeInTheDocument());
    expect(screen.queryByText('3rd & 7 at DAL 15')).not.toBeInTheDocument();
    expect(screen.getByText('2026 season')).toBeInTheDocument();
    expect(screen.getByText('W3')).toBeInTheDocument();
    expect(screen.getByText('NYG').closest('tr')).toHaveClass('standings__row--favorite');
    expect(screen.getByText('DAL').closest('tr')).not.toHaveClass('standings__row--favorite');
    expect(JSON.parse(localStorage.getItem('widgetView.nfl')!)).toBe('standings');

    fireEvent.click(screen.getByRole('button', { name: 'Scores' }));
    await waitFor(() => expect(screen.getByText('3rd & 7 at DAL 15')).toBeInTheDocument());
  });

  it('refresh refetches standings while in standings view', async () => {
    localStorage.setItem('widgetView.nfl', JSON.stringify('standings'));
    renderWithQuery(<SportWidget sport="nfl" />);

    await waitFor(() => expect(screen.getByText('NFC East')).toBeInTheDocument());
    const standingsCalls = () => fetchCallsTo('/api/standings');
    expect(standingsCalls()).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh NFL standings' }));
    await waitFor(() => expect(standingsCalls()).toBe(2));
  });

  it('shows no standings toggle for sports without standings', () => {
    renderWithQuery(<SportWidget sport="college-baseball" />);
    expect(screen.queryByRole('button', { name: 'Standings' })).not.toBeInTheDocument();
  });
});
