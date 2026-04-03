import SwiftUI
import SportsScoresKit

struct BoxScoreView: View {
    @State private var viewModel: BoxScoreViewModel

    init(sport: Sport, eventId: String, apiClient: APIClientProtocol = APIClient()) {
        _viewModel = State(wrappedValue: BoxScoreViewModel(
            sport: sport,
            eventId: eventId,
            apiClient: apiClient
        ))
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                loadingView
            } else if let error = viewModel.error {
                errorView(error)
            } else if let boxScore = viewModel.boxScore {
                contentView(boxScore)
            }
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.load()
        }
        .onDisappear {
            viewModel.stopPolling()
        }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
                .tint(viewModel.sport.accentColor)
            Text("Loading box score...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Error

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.largeTitle)
                .foregroundStyle(.yellow)
            Text("Unable to load box score")
                .font(.headline)
            Text(message)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            Button {
                viewModel.load()
            } label: {
                Label("Retry", systemImage: "arrow.clockwise")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(viewModel.sport.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Content

    private func contentView(_ boxScore: BoxScoreResponse) -> some View {
        ScrollView {
            VStack(spacing: 0) {
                scoreHeader(boxScore)

                Divider()
                    .padding(.vertical, 8)

                // Statistics comparison
                if !boxScore.statistics.isEmpty {
                    LinescoreView(
                        statistics: boxScore.statistics,
                        awayAbbreviation: boxScore.teams.away.team.abbreviation,
                        homeAbbreviation: boxScore.teams.home.team.abbreviation,
                        accentColor: viewModel.sport.accentColor
                    )
                    .padding(.horizontal)
                    .padding(.bottom, 16)
                }

                // Player stats
                playerStatsSection(boxScore)
            }
            .padding(.vertical)
        }
        .onChange(of: boxScore.status) { _, newStatus in
            if newStatus == .live {
                viewModel.startPolling()
            } else {
                viewModel.stopPolling()
            }
        }
        .onAppear {
            if boxScore.status == .live {
                viewModel.startPolling()
            }
        }
    }

    // MARK: - Score Header

    private func scoreHeader(_ boxScore: BoxScoreResponse) -> some View {
        VStack(spacing: 12) {
            // Status badge
            statusBadge(boxScore)

            HStack(spacing: 0) {
                // Away team
                teamColumn(
                    team: boxScore.teams.away.team,
                    score: boxScore.teams.away.score
                )

                // Divider
                Text("@")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 8)

                // Home team
                teamColumn(
                    team: boxScore.teams.home.team,
                    score: boxScore.teams.home.score
                )
            }
            .padding(.horizontal)
        }
    }

    private func statusBadge(_ boxScore: BoxScoreResponse) -> some View {
        Text(boxScore.statusDetail)
            .font(.caption.weight(.semibold))
            .foregroundStyle(boxScore.status == .live ? .white : .secondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
            .background {
                if boxScore.status == .live {
                    Capsule().fill(viewModel.sport.accentColor)
                } else {
                    Capsule().fill(Color(.tertiarySystemFill))
                }
            }
    }

    private func teamColumn(team: TeamInfo, score: Int?) -> some View {
        VStack(spacing: 8) {
            AsyncImage(url: team.logoURL) { image in
                image.resizable().scaledToFit()
            } placeholder: {
                Image(systemName: viewModel.sport.sfSymbol)
                    .font(.title)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 48, height: 48)

            Text(team.abbreviation)
                .font(.headline)
                .foregroundStyle(.primary)

            Text(team.record)
                .font(.caption2)
                .foregroundStyle(.secondary)

            if let score {
                Text("\(score)")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)
            } else {
                Text("-")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Player Stats

    @ViewBuilder
    private func playerStatsSection(_ boxScore: BoxScoreResponse) -> some View {
        switch boxScore.players {
        case .basketball(let away, let home):
            basketballStats(
                away: away,
                home: home,
                awayTeam: boxScore.teams.away.team,
                homeTeam: boxScore.teams.home.team
            )
        case .baseball(let away, let home):
            baseballStats(
                away: away,
                home: home,
                awayTeam: boxScore.teams.away.team,
                homeTeam: boxScore.teams.home.team
            )
        }
    }

    private func basketballStats(
        away: [BasketballPlayer],
        home: [BasketballPlayer],
        awayTeam: TeamInfo,
        homeTeam: TeamInfo
    ) -> some View {
        VStack(spacing: 20) {
            if !away.isEmpty {
                PlayerStatsTable.basketball(
                    players: away,
                    teamName: awayTeam.shortName,
                    accentColor: viewModel.sport.accentColor
                )
            }
            if !home.isEmpty {
                PlayerStatsTable.basketball(
                    players: home,
                    teamName: homeTeam.shortName,
                    accentColor: viewModel.sport.accentColor
                )
            }
        }
        .padding(.horizontal)
    }

    private func baseballStats(
        away: BaseballPlayers,
        home: BaseballPlayers,
        awayTeam: TeamInfo,
        homeTeam: TeamInfo
    ) -> some View {
        VStack(spacing: 20) {
            if !away.batting.isEmpty {
                PlayerStatsTable.batting(
                    batters: away.batting,
                    teamName: awayTeam.shortName,
                    accentColor: viewModel.sport.accentColor
                )
            }
            if !away.pitching.isEmpty {
                PlayerStatsTable.pitching(
                    pitchers: away.pitching,
                    teamName: "\(awayTeam.shortName) Pitching",
                    accentColor: viewModel.sport.accentColor
                )
            }
            if !home.batting.isEmpty {
                PlayerStatsTable.batting(
                    batters: home.batting,
                    teamName: homeTeam.shortName,
                    accentColor: viewModel.sport.accentColor
                )
            }
            if !home.pitching.isEmpty {
                PlayerStatsTable.pitching(
                    pitchers: home.pitching,
                    teamName: "\(homeTeam.shortName) Pitching",
                    accentColor: viewModel.sport.accentColor
                )
            }
        }
        .padding(.horizontal)
    }
}

#Preview {
    NavigationStack {
        BoxScoreView(sport: .nba, eventId: "401584793")
    }
    .preferredColorScheme(.dark)
}
