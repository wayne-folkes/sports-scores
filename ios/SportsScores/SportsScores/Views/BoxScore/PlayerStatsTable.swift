import SwiftUI
import SportsScoresKit

struct PlayerStatsTable: View {
    let title: String
    let accentColor: Color
    let content: TableContent

    enum TableContent {
        case basketball([BasketballPlayer])
        case batting([BaseballBatter])
        case pitching([BaseballPitcher])
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header
            Text(title)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(accentColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)

            ScrollView(.horizontal, showsIndicators: false) {
                VStack(spacing: 0) {
                    switch content {
                    case .basketball(let players):
                        basketballTable(players)
                    case .batting(let batters):
                        battingTable(batters)
                    case .pitching(let pitchers):
                        pitchingTable(pitchers)
                    }
                }
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Basketball

    private func basketballTable(_ players: [BasketballPlayer]) -> some View {
        let topScorer = players.max(by: { $0.points < $1.points })?.name

        return VStack(spacing: 0) {
            // Header row
            basketballHeaderRow

            // Player rows
            ForEach(Array(players.enumerated()), id: \.element.id) { index, player in
                basketballPlayerRow(
                    player: player,
                    isTopScorer: player.name == topScorer,
                    isAlternate: index.isMultiple(of: 2)
                )
            }
        }
    }

    private var basketballHeaderRow: some View {
        HStack(spacing: 0) {
            Text("Name")
                .frame(width: 130, alignment: .leading)
            Text("PTS")
                .frame(width: 44)
            Text("REB")
                .frame(width: 44)
            Text("AST")
                .frame(width: 44)
            Text("FG")
                .frame(width: 60)
            Text("3PT")
                .frame(width: 60)
            Text("FT")
                .frame(width: 60)
            Text("MIN")
                .frame(width: 44)
        }
        .font(.caption2.weight(.semibold))
        .foregroundStyle(.secondary)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(.tertiarySystemFill))
    }

    private func basketballPlayerRow(
        player: BasketballPlayer,
        isTopScorer: Bool,
        isAlternate: Bool
    ) -> some View {
        HStack(spacing: 0) {
            HStack(spacing: 4) {
                Text(player.shortName)
                    .lineLimit(1)
                if player.starter {
                    Image(systemName: "star.fill")
                        .font(.system(size: 6))
                        .foregroundStyle(.yellow)
                }
            }
            .frame(width: 130, alignment: .leading)

            Text("\(player.points)")
                .fontWeight(isTopScorer ? .bold : .regular)
                .foregroundStyle(isTopScorer ? accentColor : .primary)
                .frame(width: 44)
            Text(player.rebounds)
                .frame(width: 44)
            Text(player.assists)
                .frame(width: 44)
            Text(player.fieldGoals)
                .frame(width: 60)
            Text(player.threePointers)
                .frame(width: 60)
            Text(player.freeThrows)
                .frame(width: 60)
            Text(player.minutes)
                .frame(width: 44)
        }
        .font(.caption)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(isAlternate ? Color(.tertiarySystemFill).opacity(0.5) : .clear)
    }

    // MARK: - Batting

    private func battingTable(_ batters: [BaseballBatter]) -> some View {
        VStack(spacing: 0) {
            battingHeaderRow
            ForEach(Array(batters.enumerated()), id: \.element.id) { index, batter in
                battingRow(batter: batter, isAlternate: index.isMultiple(of: 2))
            }
        }
    }

    private var battingHeaderRow: some View {
        HStack(spacing: 0) {
            Text("Name")
                .frame(width: 130, alignment: .leading)
            Text("Pos")
                .frame(width: 36)
            Text("H-AB")
                .frame(width: 50)
            Text("R")
                .frame(width: 36)
            Text("H")
                .frame(width: 36)
            Text("RBI")
                .frame(width: 36)
            Text("HR")
                .frame(width: 36)
            Text("BB")
                .frame(width: 36)
            Text("K")
                .frame(width: 36)
            Text("AVG")
                .frame(width: 48)
        }
        .font(.caption2.weight(.semibold))
        .foregroundStyle(.secondary)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(.tertiarySystemFill))
    }

    private func battingRow(batter: BaseballBatter, isAlternate: Bool) -> some View {
        HStack(spacing: 0) {
            Text(batter.shortName)
                .lineLimit(1)
                .frame(width: 130, alignment: .leading)
            Text(batter.position)
                .frame(width: 36)
            Text(batter.atBatResult)
                .frame(width: 50)
            Text(batter.runs)
                .frame(width: 36)
            Text(batter.hits)
                .frame(width: 36)
            Text(batter.rbi)
                .frame(width: 36)
            Text(batter.homeRuns)
                .frame(width: 36)
            Text(batter.walks)
                .frame(width: 36)
            Text(batter.strikeouts)
                .frame(width: 36)
            Text(batter.average)
                .frame(width: 48)
        }
        .font(.caption)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(isAlternate ? Color(.tertiarySystemFill).opacity(0.5) : .clear)
    }

    // MARK: - Pitching

    private func pitchingTable(_ pitchers: [BaseballPitcher]) -> some View {
        VStack(spacing: 0) {
            pitchingHeaderRow
            ForEach(Array(pitchers.enumerated()), id: \.element.id) { index, pitcher in
                pitchingRow(pitcher: pitcher, isAlternate: index.isMultiple(of: 2))
            }
        }
    }

    private var pitchingHeaderRow: some View {
        HStack(spacing: 0) {
            Text("Name")
                .frame(width: 130, alignment: .leading)
            Text("IP")
                .frame(width: 40)
            Text("H")
                .frame(width: 36)
            Text("R")
                .frame(width: 36)
            Text("ER")
                .frame(width: 36)
            Text("BB")
                .frame(width: 36)
            Text("K")
                .frame(width: 36)
            Text("HR")
                .frame(width: 36)
            Text("ERA")
                .frame(width: 48)
        }
        .font(.caption2.weight(.semibold))
        .foregroundStyle(.secondary)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(.tertiarySystemFill))
    }

    private func pitchingRow(pitcher: BaseballPitcher, isAlternate: Bool) -> some View {
        HStack(spacing: 0) {
            Text(pitcher.shortName)
                .lineLimit(1)
                .frame(width: 130, alignment: .leading)
            Text(pitcher.inningsPitched)
                .frame(width: 40)
            Text(pitcher.hitsAllowed)
                .frame(width: 36)
            Text(pitcher.runs)
                .frame(width: 36)
            Text(pitcher.earnedRuns)
                .frame(width: 36)
            Text(pitcher.walks)
                .frame(width: 36)
            Text(pitcher.strikeouts)
                .frame(width: 36)
            Text(pitcher.homeRunsAllowed)
                .frame(width: 36)
            Text(pitcher.era)
                .frame(width: 48)
        }
        .font(.caption)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(isAlternate ? Color(.tertiarySystemFill).opacity(0.5) : .clear)
    }

    // MARK: - Factory Methods

    static func basketball(
        players: [BasketballPlayer],
        teamName: String,
        accentColor: Color
    ) -> PlayerStatsTable {
        PlayerStatsTable(
            title: teamName,
            accentColor: accentColor,
            content: .basketball(players)
        )
    }

    static func batting(
        batters: [BaseballBatter],
        teamName: String,
        accentColor: Color
    ) -> PlayerStatsTable {
        PlayerStatsTable(
            title: "\(teamName) Batting",
            accentColor: accentColor,
            content: .batting(batters)
        )
    }

    static func pitching(
        pitchers: [BaseballPitcher],
        teamName: String,
        accentColor: Color
    ) -> PlayerStatsTable {
        PlayerStatsTable(
            title: teamName,
            accentColor: accentColor,
            content: .pitching(pitchers)
        )
    }
}
