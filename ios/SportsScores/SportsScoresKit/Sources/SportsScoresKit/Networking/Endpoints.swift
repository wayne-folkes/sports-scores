import Foundation

public enum Endpoints: Sendable {
    public static let baseURL = "https://sports-scores-silk.vercel.app"

    public static func scores(sport: Sport) -> URL {
        URL(string: "\(baseURL)/api/scores/\(sport.rawValue)")!
    }

    public static func teams(sport: Sport) -> URL {
        URL(string: "\(baseURL)/api/teams/\(sport.rawValue)")!
    }

    public static func boxScore(sport: Sport, eventId: String) -> URL {
        URL(string: "\(baseURL)/api/boxscore/\(sport.rawValue)/\(eventId)")!
    }
}
