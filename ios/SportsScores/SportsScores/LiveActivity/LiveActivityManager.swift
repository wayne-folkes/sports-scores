import ActivityKit
import SportsScoresKit

final class LiveActivityManager {
    static let shared = LiveActivityManager()

    private var activeActivities: [String: Activity<SportsScoresLiveActivityAttributes>] = [:]

    private init() {}

    // MARK: - Start

    func startActivity(game: Game, sport: Sport) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let attributes = SportsScoresLiveActivityAttributes(
            awayTeamName: game.awayTeam.name,
            homeTeamName: game.homeTeam.name,
            awayTeamAbbreviation: game.awayTeam.abbreviation,
            homeTeamAbbreviation: game.homeTeam.abbreviation,
            awayTeamLogo: game.awayTeam.logo,
            homeTeamLogo: game.homeTeam.logo,
            sport: sport.rawValue
        )

        let state = SportsScoresLiveActivityAttributes.ContentState(
            awayScore: game.awayScore ?? 0,
            homeScore: game.homeScore ?? 0,
            statusDetail: game.statusDetail,
            isLive: game.isLive
        )

        do {
            let activity = try Activity<SportsScoresLiveActivityAttributes>.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil)
            )
            activeActivities[game.id] = activity
        } catch {
            print("Failed to start live activity for game \(game.id): \(error)")
        }
    }

    // MARK: - Update

    func updateActivity(gameId: String, awayScore: Int, homeScore: Int, statusDetail: String, isLive: Bool) {
        guard let activity = activeActivities[gameId] else { return }

        let state = SportsScoresLiveActivityAttributes.ContentState(
            awayScore: awayScore,
            homeScore: homeScore,
            statusDetail: statusDetail,
            isLive: isLive
        )

        Task {
            await activity.update(.init(state: state, staleDate: nil))
        }
    }

    // MARK: - End

    func endActivity(gameId: String) {
        guard let activity = activeActivities.removeValue(forKey: gameId) else { return }

        Task {
            await activity.end(nil, dismissalPolicy: .default)
        }
    }

    func endAllActivities() {
        for (gameId, activity) in activeActivities {
            Task {
                await activity.end(nil, dismissalPolicy: .default)
            }
            activeActivities.removeValue(forKey: gameId)
        }
    }
}
