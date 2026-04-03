import ActivityKit
import SportsScoresKit

@MainActor
final class LiveActivityManager {
    static let shared = LiveActivityManager()

    /// Maps game ID → ActivityKit activity ID string (Sendable)
    private var activityIdsByGame: [String: String] = [:]

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
            activityIdsByGame[game.id] = activity.id
        } catch {
            print("Failed to start live activity for game \(game.id): \(error)")
        }
    }

    // MARK: - Update

    func updateActivity(gameId: String, awayScore: Int, homeScore: Int, statusDetail: String, isLive: Bool) {
        guard let activityId = activityIdsByGame[gameId] else { return }
        let state = SportsScoresLiveActivityAttributes.ContentState(
            awayScore: awayScore,
            homeScore: homeScore,
            statusDetail: statusDetail,
            isLive: isLive
        )
        Task {
            for activity in Activity<SportsScoresLiveActivityAttributes>.activities where activity.id == activityId {
                await activity.update(.init(state: state, staleDate: nil))
            }
        }
    }

    // MARK: - End

    func endActivity(gameId: String) {
        guard let activityId = activityIdsByGame.removeValue(forKey: gameId) else { return }
        Task {
            for activity in Activity<SportsScoresLiveActivityAttributes>.activities where activity.id == activityId {
                await activity.end(nil, dismissalPolicy: .default)
            }
        }
    }

    func endAllActivities() {
        activityIdsByGame.removeAll()
        Task {
            for activity in Activity<SportsScoresLiveActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .default)
            }
        }
    }
}
