import SwiftUI
import SportsScoresKit

struct GameRow: View {
    let game: Game
    let sport: Sport

    var body: some View {
        VStack(spacing: 12) {
            // Status badge
            HStack {
                StatusBadge(status: game.status, detail: game.statusDetail)
                Spacer()
            }

            // Teams
            VStack(spacing: 8) {
                teamLine(
                    team: game.awayTeam,
                    score: game.awayScore,
                    isWinning: isWinning(score: game.awayScore, against: game.homeScore)
                )
                teamLine(
                    team: game.homeTeam,
                    score: game.homeScore,
                    isWinning: isWinning(score: game.homeScore, against: game.awayScore)
                )
            }
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Team Line

    private func teamLine(team: TeamInfo, score: Int?, isWinning: Bool) -> some View {
        HStack(spacing: 10) {
            TeamLogo(url: team.logoURL, abbreviation: team.abbreviation, size: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(team.shortName)
                    .font(.subheadline)
                    .fontWeight(isWinning ? .bold : .regular)
                    .foregroundStyle(.primary)

                if !team.record.isEmpty {
                    Text(team.record)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if let score {
                Text("\(score)")
                    .font(.title2)
                    .fontWeight(isWinning ? .bold : .regular)
                    .foregroundStyle(isWinning ? sport.accentColor : .primary)
                    .monospacedDigit()
            }
        }
    }

    // MARK: - Helpers

    private func isWinning(score: Int?, against other: Int?) -> Bool {
        guard let score, let other, game.isFinal || game.isLive else { return false }
        return score > other
    }
}

#Preview {
    let game = Game(
        id: "1",
        status: .live,
        statusDetail: "Q3 5:42",
        startTime: nil,
        homeTeam: TeamInfo(
            id: "h1", name: "Boston Celtics", shortName: "Celtics",
            abbreviation: "BOS", logo: "", record: "52-18"
        ),
        awayTeam: TeamInfo(
            id: "a1", name: "Los Angeles Lakers", shortName: "Lakers",
            abbreviation: "LAL", logo: "", record: "40-30"
        ),
        homeScore: 89,
        awayScore: 82,
        prediction: nil
    )

    GameRow(game: game, sport: .nba)
        .preferredColorScheme(.dark)
        .padding()
}
