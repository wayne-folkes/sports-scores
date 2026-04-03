import SwiftUI
import SportsScoresKit

struct TeamSelector: View {
    @Environment(FavoritesStore.self) private var favoritesStore
    @Environment(\.dismiss) private var dismiss
    @State private var teamsBySport: [(sport: Sport, teams: [TeamListItem])] = []
    @State private var isLoading = true
    @State private var searchText = ""

    private let apiClient = APIClient()

    // MARK: - Computed

    private var filteredTeamsBySport: [(sport: Sport, teams: [TeamListItem])] {
        if searchText.isEmpty {
            return teamsBySport
        }
        return teamsBySport.compactMap { section in
            let filtered = section.teams.filter { team in
                team.name.localizedCaseInsensitiveContains(searchText) ||
                team.abbreviation.localizedCaseInsensitiveContains(searchText)
            }
            guard !filtered.isEmpty else { return nil }
            return (section.sport, filtered)
        }
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading teams...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    teamsList
                }
            }
            .navigationTitle("Select Teams")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .searchable(text: $searchText, prompt: "Search teams")
        }
        .task {
            await fetchAllTeams()
        }
    }

    // MARK: - Teams List

    private var teamsList: some View {
        List {
            ForEach(filteredTeamsBySport, id: \.sport) { section in
                Section {
                    ForEach(section.teams) { team in
                        teamRow(team: team)
                    }
                } header: {
                    HStack {
                        Image(systemName: section.sport.sfSymbol)
                            .foregroundStyle(section.sport.accentColor)
                        Text(section.sport.fullName)
                    }
                }
            }
        }
    }

    private func teamRow(team: TeamListItem) -> some View {
        HStack(spacing: 12) {
            AsyncImage(url: team.logoURL) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt")
                    .foregroundStyle(.secondary)
            }
            .frame(width: 32, height: 32)

            Text(team.name)
                .font(.body)

            Spacer()

            Button {
                favoritesStore.toggle(team.id)
            } label: {
                Image(systemName: favoritesStore.isFavorite(team.id) ? "star.fill" : "star")
                    .foregroundStyle(favoritesStore.isFavorite(team.id) ? .yellow : .secondary)
                    .font(.title3)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Fetching

    private func fetchAllTeams() async {
        isLoading = true
        var results: [(sport: Sport, teams: [TeamListItem])] = []

        await withTaskGroup(of: (Sport, [TeamListItem])?.self) { group in
            for sport in Sport.allCases {
                group.addTask {
                    do {
                        let response = try await apiClient.fetchTeams(sport: sport)
                        return (sport, response.teams)
                    } catch {
                        return nil
                    }
                }
            }

            for await result in group {
                if let (sport, teams) = result {
                    results.append((sport, teams))
                }
            }
        }

        // Sort by Sport.allCases order
        let order = Sport.allCases
        teamsBySport = results.sorted { a, b in
            (order.firstIndex(of: a.sport) ?? 0) < (order.firstIndex(of: b.sport) ?? 0)
        }
        isLoading = false
    }
}

#Preview {
    TeamSelector()
        .environment(FavoritesStore())
        .preferredColorScheme(.dark)
}
