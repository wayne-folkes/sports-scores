import { useState, useEffect, useCallback } from 'react';
import './TeamSelector.css';

function TeamLogo({ logo, abbreviation, name }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (logo && !imgFailed) {
    return (
      <img
        className="team-selector__logo"
        src={logo}
        alt={name}
        width={32}
        height={32}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <span className="team-selector__logo team-selector__logo--fallback">{abbreviation}</span>;
}

export default function TeamSelector({ sport, favorites, onFavoritesChange, onClose }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchTeams = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/teams/${sport}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load teams (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setTeams(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sport]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const toggleTeam = (id) => {
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    onFavoritesChange(next);
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const accentClass = `team-selector--${sport}`;

  return (
    <div className="team-selector__backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className={`team-selector__panel ${accentClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="team-selector__header">
          <h2 className="team-selector__title">Select {sport.toUpperCase()} Teams</h2>
          <button className="team-selector__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Search */}
        <div className="team-selector__search-wrap">
          <input
            className="team-selector__search"
            type="search"
            placeholder="Search teams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search teams"
          />
        </div>

        {/* Body */}
        <div className="team-selector__body">
          {loading && (
            <div className="team-selector__state">
              <span className="team-selector__spinner" aria-label="Loading" />
            </div>
          )}

          {error && !loading && (
            <div className="team-selector__state">
              <p className="team-selector__error">{error}</p>
              <button className="team-selector__retry" onClick={fetchTeams}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="team-selector__grid">
              {filteredTeams.map((team) => {
                const selected = favorites.includes(team.id);
                return (
                  <button
                    key={team.id}
                    className={`team-selector__card${selected ? ' team-selector__card--selected' : ''}`}
                    onClick={() => toggleTeam(team.id)}
                    aria-pressed={selected}
                  >
                    <TeamLogo logo={team.logo} abbreviation={team.abbreviation} name={team.name} />
                    <span className="team-selector__team-name">{team.name}</span>
                  </button>
                );
              })}
              {filteredTeams.length === 0 && (
                <p className="team-selector__empty">No teams match "{search}"</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="team-selector__footer">
          <span className="team-selector__count">
            {favorites.length} {favorites.length === 1 ? 'team' : 'teams'} selected
          </span>
          <button className="team-selector__done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
