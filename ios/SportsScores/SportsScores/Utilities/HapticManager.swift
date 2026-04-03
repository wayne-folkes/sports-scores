import UIKit
import SportsScoresKit

@MainActor
final class HapticManager {
    static let shared = HapticManager()

    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let notificationFeedback = UINotificationFeedbackGenerator()

    init() {
        lightImpact.prepare()
        mediumImpact.prepare()
        notificationFeedback.prepare()
    }

    /// Compares previous and current game states, triggering appropriate haptics for changes.
    func checkForScoreChanges(previous: [String: [Game]], current: [String: [Game]]) {
        let previousGames = indexById(previous)
        let currentGames = indexById(current)

        for (id, currentGame) in currentGames {
            guard let previousGame = previousGames[id] else { continue }

            // Game went from live to final
            if previousGame.status == .live && currentGame.status == .final_ {
                notificationFeedback.notificationOccurred(.success)
                continue
            }

            let prevHome = previousGame.homeScore ?? 0
            let prevAway = previousGame.awayScore ?? 0
            let curHome = currentGame.homeScore ?? 0
            let curAway = currentGame.awayScore ?? 0

            let scoreChanged = prevHome != curHome || prevAway != curAway
            guard scoreChanged else { continue }

            // Check if the lead changed
            let previousLeader = leadingTeam(home: prevHome, away: prevAway)
            let currentLeader = leadingTeam(home: curHome, away: curAway)

            if previousLeader != currentLeader && previousLeader != .tied && currentLeader != .tied {
                mediumImpact.impactOccurred()
            } else {
                lightImpact.impactOccurred()
            }
        }
    }

    // MARK: - Private

    private enum Leader {
        case home, away, tied
    }

    private func leadingTeam(home: Int, away: Int) -> Leader {
        if home > away { return .home }
        if away > home { return .away }
        return .tied
    }

    private func indexById(_ gamesByKey: [String: [Game]]) -> [String: Game] {
        var result: [String: Game] = [:]
        for games in gamesByKey.values {
            for game in games {
                result[game.id] = game
            }
        }
        return result
    }
}
