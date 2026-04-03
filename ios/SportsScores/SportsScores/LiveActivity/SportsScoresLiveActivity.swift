import ActivityKit
import WidgetKit
import SwiftUI

struct SportsScoresLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SportsScoresLiveActivityAttributes.self) { context in
            // Lock screen / banner view
            lockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) {
                        Text(context.attributes.awayTeamAbbreviation)
                            .font(.headline)
                        Text(context.attributes.homeTeamAbbreviation)
                            .font(.headline)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) {
                        Text("\(context.state.awayScore)")
                            .font(.headline)
                            .fontWeight(.bold)
                        Text("\(context.state.homeScore)")
                            .font(.headline)
                            .fontWeight(.bold)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.statusDetail)
                        .font(.caption)
                        .foregroundStyle(context.state.isLive ? sportColor(for: context.attributes.sport) : .secondary)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.attributes.awayTeamName)
                            .font(.caption2)
                        Spacer()
                        Text(context.attributes.homeTeamName)
                            .font(.caption2)
                    }
                    .padding(.horizontal)
                }
            } compactLeading: {
                Text("\(context.attributes.awayTeamAbbreviation) \(context.state.awayScore)")
                    .font(.caption)
                    .fontWeight(.semibold)
            } compactTrailing: {
                Text("\(context.attributes.homeTeamAbbreviation) \(context.state.homeScore)")
                    .font(.caption)
                    .fontWeight(.semibold)
            } minimal: {
                Text("\(context.state.awayScore)-\(context.state.homeScore)")
                    .font(.caption2)
            }
        }
    }

    // MARK: - Lock Screen View

    @ViewBuilder
    private func lockScreenView(context: ActivityViewContext<SportsScoresLiveActivityAttributes>) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(context.attributes.awayTeamAbbreviation)
                        .font(.headline)
                    Spacer()
                    Text("\(context.state.awayScore)")
                        .font(.title2)
                        .fontWeight(.bold)
                }
                HStack {
                    Text(context.attributes.homeTeamAbbreviation)
                        .font(.headline)
                    Spacer()
                    Text("\(context.state.homeScore)")
                        .font(.title2)
                        .fontWeight(.bold)
                }
            }
            Spacer()
            Text(context.state.statusDetail)
                .font(.caption)
                .foregroundStyle(context.state.isLive ? sportColor(for: context.attributes.sport) : .secondary)
                .multilineTextAlignment(.trailing)
        }
        .padding()
        .activityBackgroundTint(Color.black.opacity(0.8))
    }

    // MARK: - Sport Color

    private func sportColor(for sport: String) -> Color {
        switch sport {
        case "nba":
            Color(red: 238/255, green: 103/255, blue: 48/255)
        case "mlb":
            Color(red: 41/255, green: 201/255, blue: 154/255)
        case "mens-college-basketball":
            Color(red: 26/255, green: 82/255, blue: 118/255)
        case "womens-college-basketball":
            Color(red: 142/255, green: 68/255, blue: 173/255)
        case "college-baseball":
            Color(red: 30/255, green: 107/255, blue: 184/255)
        case "college-softball":
            Color(red: 212/255, green: 69/255, blue: 122/255)
        default:
            Color.blue
        }
    }
}
