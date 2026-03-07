import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScoreCard from '../components/ScoreCard/ScoreCard';

const scheduledGame = {
  id: '401810776',
  status: 'scheduled',
  statusDetail: '7:30 PM ET',
  startTime: '2026-03-08T00:30:00Z',
  awayTeam: { id: '2', name: 'Boston Celtics', abbreviation: 'BOS', logo: '', record: '42-21' },
  homeTeam: { id: '5', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logo: '', record: '48-14' },
  awayScore: null,
  homeScore: null,
  prediction: {
    label: 'Matchup Predictor',
    awayWinProbability: 43,
    homeWinProbability: 57,
  },
};

describe('ScoreCard', () => {
  it('shows ESPN win predictions for scheduled matchups when available', () => {
    render(<ScoreCard game={scheduledGame} onOpenBoxScore={vi.fn()} />);

    expect(screen.getByLabelText('Matchup Predictor')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();
    expect(screen.getByText('57%')).toBeInTheDocument();
  });

  it('does not show win predictions for final games', () => {
    render(
      <ScoreCard
        game={{
          ...scheduledGame,
          status: 'final',
          statusDetail: 'Final',
          awayScore: 101,
          homeScore: 109,
        }}
        onOpenBoxScore={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Matchup Predictor')).not.toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('109')).toBeInTheDocument();
  });
});
