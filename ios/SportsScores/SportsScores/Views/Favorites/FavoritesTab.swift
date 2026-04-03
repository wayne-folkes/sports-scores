import SwiftUI
import SportsScoresKit

struct FavoritesTab: View {
    @Environment(FavoritesStore.self) private var favoritesStore
    @State private var viewModel = ScoresViewModel()
    @State private var showingTeamSelector = false
    @Environment(\.scenePhase) private var scenePhase

    // MARK: - Computed

    private var favoriteGamesBySport: [(sport: Sport, games: [Game])] {
        viewModel.filteredGamesBySport.compactMap { section in
            let filtered = section.games.filter { game in
                favoritesStore.isFavorite(game.homeTeam.id) ||
                favoritesStore.isFavorite(game.awayTeam.id)
            }
            guard !filtered.isEmpty else { return nil }
            return (section.sport, filtered)
        }
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            Group {
                if favoritesStore.favoriteIds.isEmpty {
                    noFavoritesView
                } else if viewModel.isLoading && viewModel.games.isEmpty {
                    loadingView
                } else if favoriteGamesBySport.isEmpty {
                    noGamesView
                } else {
                    gamesList
                }
            }
            .background(Color(.systemBackground))
            .navigationTitle("Favorites")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingTeamSelector = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingTeamSelector) {
                TeamSelector()
            }
            .refreshable {
                viewModel.fetchAllScores()
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
                ForEach(favoriteGamesBySport, id: \.sport) { section in
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

    // MARK: - Empty States

    private var noFavoritesView: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "star")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Add favorite teams to see their games here")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button {
                showingTeamSelector = true
            } label: {
                Text("Select Teams")
                    .fontWeight(.semibold)
            }
            .buttonStyle(.borderedProminent)
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .padding()
    }

    private var noGamesView: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "sportscourt")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No games today for your favorite teams")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .padding()
    }

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
}

#Preview {
    FavoritesTab()
        .environment(FavoritesStore())
        .preferredColorScheme(.dark)
}
