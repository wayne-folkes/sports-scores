import Foundation

// MARK: - Scores Response

public struct ScoresResponse: Codable, Sendable {
    public let sport: String
    public let lastUpdated: String
    public let games: [Game]
}

// MARK: - Game

public struct Game: Codable, Identifiable, Sendable {
    public let id: String
    public let status: GameStatus
    public let statusDetail: String
    public let startTime: String?
    public let homeTeam: TeamInfo
    public let awayTeam: TeamInfo
    public let homeScore: Int?
    public let awayScore: Int?
    public let prediction: Prediction?

    public var isLive: Bool { status == .live }
    public var isFinal: Bool { status == .final_ }
    public var isScheduled: Bool { status == .scheduled }

    public var startDate: Date? {
        guard let startTime else { return nil }
        return ISO8601DateFormatter().date(from: startTime)
    }
}

// MARK: - GameStatus

public enum GameStatus: String, Codable, Sendable {
    case live
    case final_ = "final"
    case scheduled

    public init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer().decode(String.self)
        switch value {
        case "live": self = .live
        case "final": self = .final_
        case "scheduled": self = .scheduled
        default: self = .scheduled
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .live: try container.encode("live")
        case .final_: try container.encode("final")
        case .scheduled: try container.encode("scheduled")
        }
    }
}

// MARK: - TeamInfo

public struct TeamInfo: Codable, Sendable, Identifiable {
    public let id: String
    public let name: String
    public let shortName: String
    public let abbreviation: String
    public let logo: String
    public let record: String

    public var logoURL: URL? { URL(string: logo) }

    public init(id: String, name: String, shortName: String, abbreviation: String, logo: String, record: String) {
        self.id = id
        self.name = name
        self.shortName = shortName
        self.abbreviation = abbreviation
        self.logo = logo
        self.record = record
    }
}

// MARK: - Prediction

public struct Prediction: Codable, Sendable {
    public let label: String
    public let homeWinProbability: Int
    public let awayWinProbability: Int
}
