import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TeamSelector from '../components/TeamSelector/TeamSelector';

const mockTeams = [
  { id: '1', name: 'Boston Celtics', abbreviation: 'BOS', logo: 'https://example.com/bos.png', color: '007a33' },
  { id: '2', name: 'Los Angeles Lakers', abbreviation: 'LAL', logo: 'https://example.com/lal.png', color: '552583' },
  { id: '3', name: 'Golden State Warriors', abbreviation: 'GS', logo: 'https://example.com/gs.png', color: '1d428a' },
];

describe('TeamSelector', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ teams: mockTeams }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the dialog with sport label', async () => {
    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={() => {}} onClose={() => {}} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Select NBA Teams/i)).toBeInTheDocument();
  });

  it('shows teams after loading', async () => {
    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={() => {}} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText('Boston Celtics')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
    });
  });

  it('shows selected state for favorite teams', async () => {
    render(
      <TeamSelector sport="nba" favorites={['1']} onFavoritesChange={() => {}} onClose={() => {}} />
    );

    await waitFor(() => {
      const bostonButton = screen.getByText('Boston Celtics').closest('button');
      expect(bostonButton).toHaveAttribute('aria-pressed', 'true');

      const lakersButton = screen.getByText('Los Angeles Lakers').closest('button');
      expect(lakersButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('calls onFavoritesChange when a team is toggled', async () => {
    const onFavoritesChange = vi.fn();
    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={onFavoritesChange} onClose={() => {}} />
    );

    await waitFor(() => screen.getByText('Boston Celtics'));
    fireEvent.click(screen.getByText('Boston Celtics').closest('button'));
    expect(onFavoritesChange).toHaveBeenCalledWith(['1']);
  });

  it('removes a team from favorites when toggled off', async () => {
    const onFavoritesChange = vi.fn();
    render(
      <TeamSelector sport="nba" favorites={['1']} onFavoritesChange={onFavoritesChange} onClose={() => {}} />
    );

    await waitFor(() => screen.getByText('Boston Celtics'));
    fireEvent.click(screen.getByText('Boston Celtics').closest('button'));
    expect(onFavoritesChange).toHaveBeenCalledWith([]);
  });

  it('filters teams by search input', async () => {
    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={() => {}} onClose={() => {}} />
    );

    await waitFor(() => screen.getByText('Boston Celtics'));

    fireEvent.change(screen.getByPlaceholderText('Search teams'), { target: { value: 'lakers' } });

    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
    expect(screen.queryByText('Boston Celtics')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={() => {}} onClose={() => {}} />
    );

    await waitFor(() => screen.getByText('Boston Celtics'));
    fireEvent.change(screen.getByPlaceholderText('Search teams'), { target: { value: 'zzznomatch' } });

    expect(screen.getByText(/No teams match/i)).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={() => {}} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error state when fetch fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={() => {}} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('shows logo fallback when image fails to load', async () => {
    render(
      <TeamSelector sport="nba" favorites={[]} onFavoritesChange={() => {}} onClose={() => {}} />
    );

    await waitFor(() => screen.getByText('Boston Celtics'));

    const img = screen.getAllByRole('img')[0];
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText('BOS')).toBeInTheDocument();
    });
  });
});
