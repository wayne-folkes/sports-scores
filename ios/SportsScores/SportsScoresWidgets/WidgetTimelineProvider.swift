import WidgetKit
import SportsScoresKit

struct SimpleEntry: TimelineEntry {
    let date: Date
    let games: [Game]
    let sport: Sport?
}

struct ScoresTimelineProvider: TimelineProvider {
    private let apiClient = APIClient()
    private let favoritesStore = FavoritesStore()

    // MARK: - Placeholder

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: .now,
            games: Self.sampleGames,
            sport: .nba
        )
    }

    // MARK: - Snapshot

    func getSnapshot(in context: Context, completion: @escaping @Sendable (SimpleEntry) -> Void) {
        if context.isPreview {
            completion(placeholder(in: context))
            return
        }

        let client = apiClient
        Task {
            let games = await Self.fetchAllGames(client: client, favorites: Set<String>())
            let entry = SimpleEntry(date: .now, games: Array(games.prefix(6)), sport: nil)
            completion(entry)
        }
    }

    // MARK: - Timeline

    func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<SimpleEntry>) -> Void) {
        let client = apiClient
        let favoriteIds = favoritesStore.favoriteIds
        Task {
            let allGames = await Self.fetchAllGames(client: client, favorites: favoriteIds)

            let hasLiveGames = allGames.contains { $0.isLive }
            let refreshInterval: TimeInterval = hasLiveGames ? 300 : 900

            let entry = SimpleEntry(
                date: .now,
                games: Array(allGames.prefix(6)),
                sport: nil
            )

            let nextUpdate = Date().addingTimeInterval(refreshInterval)
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    // MARK: - Fetching

    private static func fetchAllGames(client: APIClient, favorites: Set<String>) async -> [Game] {
        await withTaskGroup(of: [Game].self) { group in
            for sport in Sport.allCases {
                group.addTask {
                    do {
                        let response = try await client.fetchScores(sport: sport)
                        return response.games
                    } catch {
                        return []
                    }
                }
            }

            var allGames: [Game] = []
            for await games in group {
                allGames.append(contentsOf: games)
            }

            if !favorites.isEmpty {
                let filtered = allGames.filter { game in
                    favorites.contains(game.homeTeam.id) || favorites.contains(game.awayTeam.id)
                }
                if !filtered.isEmpty {
                    return Self.sortGames(filtered)
                }
            }

            return Self.sortGames(allGames)
        }
    }

    /// Sort games: live first, then scheduled, then final
    private static func sortGames(_ games: [Game]) -> [Game] {
        games.sorted { a, b in
            let order: (Game) -> Int = { game in
                switch game.status {
                case .live: return 0
                case .scheduled: return 1
                case .final_: return 2
                }
            }
            return order(a) < order(b)
        }
    }

    // MARK: - Sample Data

    static let sampleGames: [Game] = [
        Game(
            id: "placeholder-1",
            status: .live,
            statusDetail: "Q3 5:42",
            startTime: nil,
            homeTeam: TeamInfo(id: "lal", name: "Los Angeles Lakers", shortName: "Lakers", abbreviation: "LAL", logo: "", record: "38-24"),
            awayTeam: TeamInfo(id: "bos", name: "Boston Celtics", shortName: "Celtics", abbreviation: "BOS", logo: "", record: "42-19"),
            homeScore: 87,
            awayScore: 92,
            prediction: nil
        ),
        Game(
            id: "placeholder-2",
            status: .final_,
            statusDetail: "Final",
            startTime: nil,
            homeTeam: TeamInfo(id: "gsw", name: "Golden State Warriors", shortName: "Warriors", abbreviation: "GSW", logo: "", record: "35-27"),
            awayTeam: TeamInfo(id: "mia", name: "Miami Heat", shortName: "Heat", abbreviation: "MIA", logo: "", record: "33-29"),
            homeScore: 112,
            awayScore: 105,
            prediction: nil
        ),
        Game(
            id: "placeholder-3",
            status: .scheduled,
            statusDetail: "7:30 PM ET",
            startTime: nil,
            homeTeam: TeamInfo(id: "den", name: "Denver Nuggets", shortName: "Nuggets", abbreviation: "DEN", logo: "", record: "40-22"),
            awayTeam: TeamInfo(id: "phi", name: "Philadelphia 76ers", shortName: "76ers", abbreviation: "PHI", logo: "", record: "30-32"),
            homeScore: nil,
            awayScore: nil,
            prediction: nil
        ),
    ]
}
