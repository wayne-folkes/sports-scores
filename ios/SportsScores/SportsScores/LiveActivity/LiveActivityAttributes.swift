import ActivityKit
import SportsScoresKit

struct SportsScoresLiveActivityAttributes: ActivityAttributes {
    // Static content — set when the activity is started
    let awayTeamName: String
    let homeTeamName: String
    let awayTeamAbbreviation: String
    let homeTeamAbbreviation: String
    let awayTeamLogo: String
    let homeTeamLogo: String
    let sport: String

    // Dynamic content — updated throughout the game
    struct ContentState: Codable, Hashable {
        let awayScore: Int
        let homeScore: Int
        let statusDetail: String
        let isLive: Bool
    }
}
