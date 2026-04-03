import WidgetKit
import SwiftUI
import SportsScoresKit

// MARK: - Scores Widget

struct ScoresWidget: Widget {
    let kind: String = "ScoresWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ScoresTimelineProvider()) { entry in
            ScoresWidgetEntryView(entry: entry)
                .containerBackground(Color(red: 6/255, green: 7/255, blue: 12/255), for: .widget)
        }
        .configurationDisplayName("Sports Scores")
        .description("Live scores and game updates.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Entry View

struct ScoresWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: ScoresTimelineProvider.Entry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(games: entry.games)
        case .systemMedium:
            MediumWidgetView(games: entry.games)
        case .systemLarge:
            LargeWidgetView(games: entry.games)
        default:
            SmallWidgetView(games: entry.games)
        }
    }
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    let games: [Game]

    var body: some View {
        if let game = games.first {
            VStack(spacing: 8) {
                // Status badge
                GameStatusBadge(game: game)

                // Teams and scores
                HStack(spacing: 0) {
                    // Away team
                    VStack(spacing: 4) {
                        TeamLogoView(url: game.awayTeam.logoURL, size: 28)
                        Text(game.awayTeam.abbreviation)
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                        if let score = game.awayScore {
                            Text("\(score)")
                                .font(.title2.bold())
                                .foregroundStyle(.white)
                        } else {
                            Text("-")
                                .font(.title2)
                                .foregroundStyle(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity)

                    Text("@")
                        .font(.caption2)
                        .foregroundStyle(.gray)

                    // Home team
                    VStack(spacing: 4) {
                        TeamLogoView(url: game.homeTeam.logoURL, size: 28)
                        Text(game.homeTeam.abbreviation)
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                        if let score = game.homeScore {
                            Text("\(score)")
                                .font(.title2.bold())
                                .foregroundStyle(.white)
                        } else {
                            Text("-")
                                .font(.title2)
                                .foregroundStyle(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.vertical, 4)
        } else {
            noGamesView
        }
    }
}

// MARK: - Medium Widget

struct MediumWidgetView: View {
    let games: [Game]

    var body: some View {
        if games.isEmpty {
            noGamesView
        } else {
            VStack(spacing: 6) {
                ForEach(Array(games.prefix(3))) { game in
                    CompactGameRow(game: game)
                    if game.id != games.prefix(3).last?.id {
                        Divider()
                            .background(Color.white.opacity(0.15))
                    }
                }
            }
            .padding(.vertical, 2)
        }
    }
}

// MARK: - Large Widget

struct LargeWidgetView: View {
    let games: [Game]

    var body: some View {
        if games.isEmpty {
            noGamesView
        } else {
            VStack(spacing: 4) {
                HStack {
                    Text("Scores")
                        .font(.caption.bold())
                        .foregroundStyle(.white.opacity(0.6))
                        .textCase(.uppercase)
                    Spacer()
                }

                ForEach(Array(games.prefix(6))) { game in
                    CompactGameRow(game: game)
                    if game.id != games.prefix(6).last?.id {
                        Divider()
                            .background(Color.white.opacity(0.15))
                    }
                }

                Spacer(minLength: 0)
            }
            .padding(.vertical, 2)
        }
    }
}

// MARK: - Compact Game Row

struct CompactGameRow: View {
    let game: Game

    var body: some View {
        HStack(spacing: 8) {
            // Live indicator
            if game.isLive {
                Circle()
                    .fill(Color.red)
                    .frame(width: 6, height: 6)
            }

            // Away team
            HStack(spacing: 4) {
                TeamLogoView(url: game.awayTeam.logoURL, size: 18)
                Text(game.awayTeam.abbreviation)
                    .font(.caption.bold())
                    .foregroundStyle(.white)
            }
            .frame(width: 60, alignment: .leading)

            // Score or time
            if game.isScheduled {
                Text(game.statusDetail)
                    .font(.caption2)
                    .foregroundStyle(.gray)
                    .frame(maxWidth: .infinity)
            } else {
                HStack(spacing: 4) {
                    Text("\(game.awayScore ?? 0)")
                        .font(.caption.bold().monospacedDigit())
                        .foregroundStyle(awayWinning ? .white : .gray)
                    Text("-")
                        .font(.caption2)
                        .foregroundStyle(.gray)
                    Text("\(game.homeScore ?? 0)")
                        .font(.caption.bold().monospacedDigit())
                        .foregroundStyle(homeWinning ? .white : .gray)
                }
                .frame(maxWidth: .infinity)
            }

            // Home team
            HStack(spacing: 4) {
                Text(game.homeTeam.abbreviation)
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                TeamLogoView(url: game.homeTeam.logoURL, size: 18)
            }
            .frame(width: 60, alignment: .trailing)

            // Status
            GameStatusBadge(game: game)
                .frame(width: 50)
        }
        .padding(.vertical, 2)
    }

    private var homeWinning: Bool {
        guard let home = game.homeScore, let away = game.awayScore else { return false }
        return home >= away
    }

    private var awayWinning: Bool {
        guard let home = game.homeScore, let away = game.awayScore else { return false }
        return away >= home
    }
}

// MARK: - Supporting Views

struct GameStatusBadge: View {
    let game: Game

    var body: some View {
        Text(statusText)
            .font(.system(size: 9, weight: .bold))
            .foregroundStyle(statusColor)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(statusColor.opacity(0.2))
            .clipShape(Capsule())
    }

    private var statusText: String {
        switch game.status {
        case .live: return game.statusDetail
        case .final_: return "FINAL"
        case .scheduled: return game.statusDetail
        }
    }

    private var statusColor: Color {
        switch game.status {
        case .live: return .red
        case .final_: return .gray
        case .scheduled: return .blue
        }
    }
}

struct TeamLogoView: View {
    let url: URL?
    let size: CGFloat

    var body: some View {
        if let url {
            // WidgetKit doesn't support AsyncImage, use a placeholder
            // Real logos would need to be cached/downloaded in the timeline provider
            Image(systemName: "sportscourt.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .foregroundStyle(.white.opacity(0.5))
        } else {
            Image(systemName: "sportscourt.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .foregroundStyle(.white.opacity(0.3))
        }
    }
}

private var noGamesView: some View {
    VStack(spacing: 8) {
        Image(systemName: "sportscourt")
            .font(.title2)
            .foregroundStyle(.gray)
        Text("No Games")
            .font(.caption)
            .foregroundStyle(.gray)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
}

// MARK: - Previews

#Preview("Small", as: .systemSmall) {
    ScoresWidget()
} timeline: {
    SimpleEntry(date: .now, games: ScoresTimelineProvider.sampleGames, sport: .nba)
}

#Preview("Medium", as: .systemMedium) {
    ScoresWidget()
} timeline: {
    SimpleEntry(date: .now, games: ScoresTimelineProvider.sampleGames, sport: .nba)
}

#Preview("Large", as: .systemLarge) {
    ScoresWidget()
} timeline: {
    SimpleEntry(date: .now, games: ScoresTimelineProvider.sampleGames, sport: .nba)
}
