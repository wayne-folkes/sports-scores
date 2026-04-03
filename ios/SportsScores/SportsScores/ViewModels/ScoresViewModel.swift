import SwiftUI
import Combine
import SportsScoresKit

@Observable
@MainActor
final class ScoresViewModel {
    // MARK: - Properties

    var games: [String: [Game]] = [:]
    var enabledSports: Set<Sport> = Set(Sport.allCases)
    var isLoading = false
    var error: String?

    private let apiClient: APIClient
    private var timerCancellable: AnyCancellable?

    // MARK: - Computed

    /// All games flattened and sorted: live first, then scheduled, then final.
    var allGames: [Game] {
        games.values
            .flatMap { $0 }
            .sorted { lhs, rhs in
                func priority(_ game: Game) -> Int {
                    switch game.status {
                    case .live: 0
                    case .scheduled: 1
                    case .final_: 2
                    }
                }
                let lp = priority(lhs)
                let rp = priority(rhs)
                if lp != rp { return lp < rp }
                return (lhs.startTime ?? "") < (rhs.startTime ?? "")
            }
    }

    /// Games filtered by enabled sports, grouped by sport.
    var filteredGamesBySport: [(sport: Sport, games: [Game])] {
        Sport.allCases.compactMap { sport in
            guard enabledSports.contains(sport),
                  let sportGames = games[sport.rawValue],
                  !sportGames.isEmpty else { return nil }
            let sorted = sportGames.sorted { lhs, rhs in
                func priority(_ game: Game) -> Int {
                    switch game.status {
                    case .live: 0
                    case .scheduled: 1
                    case .final_: 2
                    }
                }
                let lp = priority(lhs)
                let rp = priority(rhs)
                if lp != rp { return lp < rp }
                return (lhs.startTime ?? "") < (rhs.startTime ?? "")
            }
            return (sport, sorted)
        }
    }

    // MARK: - Init

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    // MARK: - Polling

    func startPolling() {
        fetchAllScores()
        timerCancellable = Timer.publish(every: 30, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.fetchAllScores()
            }
    }

    func stopPolling() {
        timerCancellable?.cancel()
        timerCancellable = nil
    }

    func handleScenePhase(_ phase: ScenePhase) {
        switch phase {
        case .active:
            startPolling()
        case .inactive, .background:
            stopPolling()
        @unknown default:
            break
        }
    }

    // MARK: - Fetching

    func fetchAllScores() {
        Task {
            isLoading = games.isEmpty
            error = nil

            let previousGames = games

            await withTaskGroup(of: (String, [Game])?.self) { group in
                for sport in enabledSports {
                    group.addTask { [apiClient] in
                        do {
                            let response: ScoresResponse = try await apiClient.fetchScores(sport: sport)
                            return (sport.rawValue, response.games)
                        } catch {
                            return nil
                        }
                    }
                }

                for await result in group {
                    if let (key, sportGames) = result {
                        games[key] = sportGames
                    }
                }
            }

            if !previousGames.isEmpty {
                HapticManager.shared.checkForScoreChanges(previous: previousGames, current: games)
            }

            isLoading = false

            if games.values.allSatisfy({ $0.isEmpty }) && !enabledSports.isEmpty {
                error = "No games available right now."
            }
        }
    }
}
