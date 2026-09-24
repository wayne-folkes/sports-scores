import { useStandings } from '../../api/queries';
import './StandingsTable.css';

export default function StandingsTable({ sport, favorites = [] }) {
  const { data: standings, error: queryError } = useStandings(sport);
  const error = queryError?.message;

  if (error) {
    return (
      <div className="sport-widget__state" role="alert">
        <p className="sport-widget__state-kicker">Connection issue</p>
        <p className="sport-widget__error">{error}</p>
      </div>
    );
  }

  if (!standings) {
    return <div className="standings__state" role="status">Loading standings…</div>;
  }

  if (standings.groups.length === 0) {
    return (
      <div className="sport-widget__state" role="status">
        <p className="sport-widget__state-kicker">No standings yet</p>
        <p className="sport-widget__prompt">Standings will appear once the season is underway.</p>
      </div>
    );
  }

  return (
    <div className="standings">
      {standings.season && <p className="standings__season">{standings.season} season</p>}
      {standings.groups.map((group) => (
        <section key={`${group.parent}-${group.name}`} className="standings__group" aria-label={group.name}>
          <p className="sport-widget__section-label">{group.name}</p>
          <div className="standings__table-wrap">
            <table className="standings__table">
              <thead>
                <tr>
                  <th scope="col" className="standings__team-col">Team</th>
                  {standings.columns.map((col) => (
                    <th key={col} scope="col">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.entries.map(({ team, stats }) => (
                  <tr
                    key={team.id}
                    className={favorites.includes(team.id) ? 'standings__row--favorite' : undefined}
                  >
                    <th scope="row" className="standings__team-col">
                      <span className="standings__team">
                        {team.logo && <img className="standings__logo" src={team.logo} alt="" width={18} height={18} />}
                        <span className="standings__abbr">{team.abbreviation}</span>
                        <span className="standings__name">{team.name}</span>
                      </span>
                    </th>
                    {standings.columns.map((col) => (
                      <td key={col}>{stats[col] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
