import SwiftUI
import SportsScoresKit

struct WatchGameRow: View {
    let game: Game
    let sport: Sport

    private var awayWinning: Bool {
        guard let away = game.awayScore, let home = game.homeScore else { return false }
        return away > home
    }

    private var homeWinning: Bool {
        guard let away = game.awayScore, let home = game.homeScore else { return false }
        return home > away
    }

    private var statusText: String {
        switch game.status {
        case .live:
            return game.statusDetail
        case .final_:
            return "FINAL"
        case .scheduled:
            if let date = game.startDate {
                let formatter = DateFormatter()
                formatter.dateFormat = "h:mm a"
                return formatter.string(from: date)
            }
            return game.statusDetail
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            // Status badge
            HStack(spacing: 4) {
                if game.isLive {
                    Circle()
                        .fill(sport.accentColor)
                        .frame(width: 5, height: 5)
                }
                Text(statusText)
                    .font(.system(size: 10))
                    .foregroundStyle(game.isLive ? sport.accentColor : .secondary)
                    .lineLimit(1)
            }

            // Away team line
            HStack {
                Text(game.awayTeam.abbreviation)
                    .font(.system(size: 13, weight: awayWinning && game.isFinal ? .bold : .regular))
                    .lineLimit(1)
                Spacer()
                if let score = game.awayScore {
                    Text("\(score)")
                        .font(.system(size: 13, weight: awayWinning ? .bold : .regular))
                        .monospacedDigit()
                }
            }

            // Home team line
            HStack {
                Text(game.homeTeam.abbreviation)
                    .font(.system(size: 13, weight: homeWinning && game.isFinal ? .bold : .regular))
                    .lineLimit(1)
                Spacer()
                if let score = game.homeScore {
                    Text("\(score)")
                        .font(.system(size: 13, weight: homeWinning ? .bold : .regular))
                        .monospacedDigit()
                }
            }
        }
        .padding(.vertical, 2)
    }
}
