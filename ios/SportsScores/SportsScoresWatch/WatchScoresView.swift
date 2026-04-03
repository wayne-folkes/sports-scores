import SwiftUI
import Combine
import SportsScoresKit

// MARK: - ViewModel

@Observable
@MainActor
final class WatchScoresViewModel {
    var games: [String: [Game]] = [:]
    var isLoading = false
    var error: String?

    private let apiClient: APIClient
    private var timerCancellable: AnyCancellable?

    /// Games grouped by sport, sorted: live first, then scheduled, then final.
    var gamesBySport: [(sport: Sport, games: [Game])] {
        Sport.allCases.compactMap { sport in
            guard let sportGames = games[sport.rawValue],
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

    var hasGames: Bool {
        games.values.contains { !$0.isEmpty }
    }

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    // MARK: - Polling

    func startPolling() {
        fetchAllScores()
        timerCancellable = Timer.publish(every: 60, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.fetchAllScores()
            }
    }

    func stopPolling() {
        timerCancellable?.cancel()
        timerCancellable = nil
    }

    // MARK: - Fetching

    func fetchAllScores() {
        Task {
            isLoading = games.isEmpty
            error = nil

            await withTaskGroup(of: (String, [Game])?.self) { group in
                for sport in Sport.allCases {
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

            isLoading = false

            if !hasGames {
                error = "No games available."
            }
        }
    }
}

// MARK: - View

struct WatchScoresView: View {
    @State private var viewModel = WatchScoresViewModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView("Loading...")
                    .font(.caption2)
            } else if let error = viewModel.error, !viewModel.hasGames {
                VStack(spacing: 4) {
                    Image(systemName: "sportscourt")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                    Text(error)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            } else {
                List {
                    ForEach(viewModel.gamesBySport, id: \.sport) { section in
                        Section {
                            ForEach(section.games) { game in
                                WatchGameRow(game: game, sport: section.sport)
                            }
                        } header: {
                            Label(section.sport.displayName, systemImage: section.sport.sfSymbol)
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundStyle(section.sport.accentColor)
                        }
                    }
                }
                .listStyle(.carousel)
                .refreshable {
                    viewModel.fetchAllScores()
                }
            }
        }
        .navigationTitle("Scores")
        .onAppear {
            viewModel.startPolling()
        }
        .onDisappear {
            viewModel.stopPolling()
        }
        .onChange(of: scenePhase) { _, newPhase in
            switch newPhase {
            case .active:
                viewModel.startPolling()
            case .inactive, .background:
                viewModel.stopPolling()
            @unknown default:
                break
            }
        }
    }
}
