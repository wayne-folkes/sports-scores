import SwiftUI
import SportsScoresKit

struct ScoresTab: View {
    @State private var viewModel = ScoresViewModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                SportPicker(enabledSports: $viewModel.enabledSports)
                    .padding(.vertical, 8)

                Group {
                    if viewModel.isLoading && viewModel.games.isEmpty {
                        loadingView
                    } else if let error = viewModel.error, viewModel.games.values.allSatisfy({ $0.isEmpty }) {
                        emptyView(message: error)
                    } else if viewModel.filteredGamesBySport.isEmpty {
                        emptyView(message: "No games for selected sports.")
                    } else {
                        gamesList
                    }
                }
            }
            .background(Color(.systemBackground))
            .navigationTitle("Scores")
            .refreshable {
                viewModel.fetchAllScores()
                // Brief delay so the refresh indicator feels responsive
                try? await Task.sleep(for: .seconds(0.5))
            }
        }
        .onAppear {
            viewModel.startPolling()
        }
        .onDisappear {
            viewModel.stopPolling()
        }
        .onChange(of: scenePhase) { _, newPhase in
            viewModel.handleScenePhase(newPhase)
        }
    }

    // MARK: - Games List

    private var gamesList: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                ForEach(viewModel.filteredGamesBySport, id: \.sport) { section in
                    Section {
                        ForEach(section.games) { game in
                            NavigationLink {
                                BoxScoreView(sport: section.sport, eventId: game.id)
                            } label: {
                                GameRow(game: game, sport: section.sport)
                            }
                            .buttonStyle(.plain)
                        }
                    } header: {
                        HStack {
                            Image(systemName: section.sport.sfSymbol)
                                .foregroundStyle(section.sport.accentColor)
                            Text(section.sport.displayName)
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Spacer()
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
                    }
                }
            }
            .padding(.vertical, 8)
        }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading scores...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Empty

    private func emptyView(message: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "sportscourt")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .padding()
    }
}

#Preview {
    ScoresTab()
        .preferredColorScheme(.dark)
}
