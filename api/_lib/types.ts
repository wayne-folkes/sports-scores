// Response shapes returned by the api/ functions. The client imports these
// types too, so changing a shape here surfaces every place that reads it.

// Raw ESPN payloads are untyped external JSON; the normalizers are the
// boundary where that data becomes the typed shapes in this file.
export type EspnJson = any;

export type Sport =
  | 'nfl'
  | 'nba'
  | 'mlb'
  | 'mens-college-basketball'
  | 'womens-college-basketball'
  | 'college-baseball'
  | 'college-softball';

export type GameStatus = 'scheduled' | 'live' | 'final';

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logo: string;
  record: string;
}

export interface Prediction {
  label: string;
  homeWinProbability: number;
  awayWinProbability: number;
}

export interface FootballSituation {
  downDistanceText: string;
  shortDownDistanceText: string;
  possession: 'home' | 'away' | null;
  isRedZone: boolean;
  homeTimeouts: number | null;
  awayTimeouts: number | null;
  lastPlay: string;
}

export interface Game {
  id: string;
  status: GameStatus;
  statusDetail: string;
  startTime: string | null;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number | null;
  awayScore: number | null;
  prediction: Prediction | null;
  /** NFL only; null between live situations. */
  situation?: FootballSituation | null;
}

export interface ScoreboardResponse {
  sport: string;
  lastUpdated: string;
  games: Game[];
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  /** Hex without the leading '#', or '' when ESPN has none. */
  color: string;
}

export interface TeamsResponse {
  sport: string;
  teams: Team[];
}

export interface TeamStat {
  key: string;
  label: string;
  value: string;
}

export interface BoxscoreSide {
  team: TeamInfo;
  score: number | null;
  statistics: TeamStat[];
}

export interface StatRow {
  key: string;
  label: string;
  awayValue: string;
  homeValue: string;
}

export type PlayerStats = Record<string, string>;

export interface BasketballPlayer {
  name: string;
  shortName: string;
  starter: boolean;
  stats: PlayerStats;
}

export interface Batter {
  name: string;
  shortName: string;
  position: string;
  batOrder: number | null;
  stats: PlayerStats;
}

export interface StatLine {
  name: string;
  shortName: string;
  stats: PlayerStats;
}

export interface BaseballSide {
  batting: Batter[];
  pitching: StatLine[];
}

export type FootballCategory = 'passing' | 'rushing' | 'receiving';
export type FootballSide = Record<FootballCategory, StatLine[]>;

export type BoxscorePlayers =
  | { away: BasketballPlayer[]; home: BasketballPlayer[] }
  | { away: BaseballSide; home: BaseballSide }
  | { away: FootballSide; home: FootballSide };

export interface BoxscoreResponse {
  sport: string;
  eventId: string;
  status: GameStatus;
  statusDetail: string;
  startTime: string | null;
  teams: { away: BoxscoreSide; home: BoxscoreSide };
  statistics: StatRow[];
  players: BoxscorePlayers;
}

export interface StandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
}

export interface StandingsEntry {
  team: StandingsTeam;
  stats: Record<string, string>;
}

export interface StandingsGroup {
  name: string;
  abbreviation: string;
  parent: string;
  entries: StandingsEntry[];
}

export interface StandingsResponse {
  sport: string;
  season: string;
  columns: string[];
  groups: StandingsGroup[];
}

export type SummaryGameState = 'pre' | 'in' | 'post';

export interface SummaryResponse {
  summary: string;
  gameState: SummaryGameState;
  model: string;
  generatedAt: string;
  cached: boolean;
}

export interface ErrorResponse {
  error: string;
}
