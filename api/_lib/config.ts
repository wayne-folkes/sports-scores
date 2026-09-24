export const ESPN_API_BASE = process.env.ESPN_API_BASE || 'https://site.api.espn.com';

export const SUMMARY_BASE_URLS: Record<string, string> = {
  nfl: `${ESPN_API_BASE}/apis/site/v2/sports/football/nfl/summary?event=`,
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/summary?event=`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/summary?event=`,
  'college-baseball': `${ESPN_API_BASE}/apis/site/v2/sports/baseball/college-baseball/summary?event=`,
  'college-softball': `${ESPN_API_BASE}/apis/site/v2/sports/baseball/college-softball/summary?event=`,
  'mens-college-basketball': `${ESPN_API_BASE}/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=`,
  'womens-college-basketball': `${ESPN_API_BASE}/apis/site/v2/sports/basketball/womens-college-basketball/summary?event=`,
};
