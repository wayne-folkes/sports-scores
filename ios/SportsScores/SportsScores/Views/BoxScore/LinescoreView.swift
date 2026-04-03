import SwiftUI
import SportsScoresKit

struct LinescoreView: View {
    let statistics: [StatComparison]
    let awayAbbreviation: String
    let homeAbbreviation: String
    let accentColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header
            Text("Team Statistics")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(accentColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)

            // Column headers
            HStack {
                Text("Stat")
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(awayAbbreviation)
                    .frame(width: 60)
                Text(homeAbbreviation)
                    .frame(width: 60)
            }
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(.tertiarySystemFill))

            // Stat rows
            ForEach(Array(statistics.enumerated()), id: \.element.key) { index, stat in
                statRow(stat: stat, isAlternate: index.isMultiple(of: 2))
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func statRow(stat: StatComparison, isAlternate: Bool) -> some View {
        let awayWins = isGreater(stat.awayValue, than: stat.homeValue)
        let homeWins = isGreater(stat.homeValue, than: stat.awayValue)

        return HStack {
            Text(stat.label)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(stat.awayValue)
                .font(.caption)
                .fontWeight(awayWins ? .bold : .regular)
                .foregroundStyle(awayWins ? .primary : .secondary)
                .frame(width: 60)

            Text(stat.homeValue)
                .font(.caption)
                .fontWeight(homeWins ? .bold : .regular)
                .foregroundStyle(homeWins ? .primary : .secondary)
                .frame(width: 60)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(isAlternate ? Color(.tertiarySystemFill).opacity(0.5) : .clear)
    }

    /// Compare two stat value strings numerically; returns true if lhs > rhs.
    private func isGreater(_ lhs: String, than rhs: String) -> Bool {
        // Try parsing as doubles for numeric comparison
        guard let left = Double(lhs.replacingOccurrences(of: "%", with: "")),
              let right = Double(rhs.replacingOccurrences(of: "%", with: "")) else {
            return false
        }
        return left > right
    }
}

#Preview {
    LinescoreView(
        statistics: [
            StatComparison(key: "fg", label: "Field Goal %", awayValue: "45.2%", homeValue: "51.8%"),
            StatComparison(key: "reb", label: "Rebounds", awayValue: "42", homeValue: "38"),
            StatComparison(key: "ast", label: "Assists", awayValue: "24", homeValue: "29"),
        ],
        awayAbbreviation: "BOS",
        homeAbbreviation: "LAL",
        accentColor: Color(red: 238/255, green: 103/255, blue: 48/255)
    )
    .padding()
    .preferredColorScheme(.dark)
}
