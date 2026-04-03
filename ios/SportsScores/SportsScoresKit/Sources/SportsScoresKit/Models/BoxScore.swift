import Foundation

// MARK: - BoxScore Response

public struct BoxScoreResponse: Codable, Sendable {
    public let sport: String
    public let eventId: String
    public let status: GameStatus
    public let statusDetail: String
    public let startTime: String?
    public let teams: BoxScoreTeams
    public let statistics: [StatComparison]
    public let players: PlayerData
}

// MARK: - BoxScore Teams

public struct BoxScoreTeams: Codable, Sendable {
    public let away: BoxScoreTeamEntry
    public let home: BoxScoreTeamEntry
}

public struct BoxScoreTeamEntry: Codable, Sendable {
    public let team: TeamInfo
    public let score: Int?
    public let statistics: [TeamStat]
}

public struct TeamStat: Codable, Sendable {
    public let key: String
    public let label: String
    public let value: String
}

// MARK: - Stat Comparison

public struct StatComparison: Codable, Sendable {
    public let key: String
    public let label: String
    public let awayValue: String
    public let homeValue: String

    public init(key: String, label: String, awayValue: String, homeValue: String) {
        self.key = key; self.label = label; self.awayValue = awayValue; self.homeValue = homeValue
    }
}

// MARK: - Player Data

/// Players can be either basketball format (flat arrays) or baseball format (batting + pitching groups).
/// The API returns different shapes depending on sport, so we use a custom decoder.
public enum PlayerData: Codable, Sendable {
    case basketball(away: [BasketballPlayer], home: [BasketballPlayer])
    case baseball(away: BaseballPlayers, home: BaseballPlayers)

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // Try baseball format first (has nested batting/pitching)
        if let away = try? container.decode(BaseballPlayers.self, forKey: .away),
           let home = try? container.decode(BaseballPlayers.self, forKey: .home) {
            self = .baseball(away: away, home: home)
            return
        }

        // Fall back to basketball format (flat arrays)
        let away = (try? container.decode([BasketballPlayer].self, forKey: .away)) ?? []
        let home = (try? container.decode([BasketballPlayer].self, forKey: .home)) ?? []
        self = .basketball(away: away, home: home)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .basketball(let away, let home):
            try container.encode(away, forKey: .away)
            try container.encode(home, forKey: .home)
        case .baseball(let away, let home):
            try container.encode(away, forKey: .away)
            try container.encode(home, forKey: .home)
        }
    }

    private enum CodingKeys: String, CodingKey {
        case away, home
    }
}

// MARK: - Basketball Player

public struct BasketballPlayer: Codable, Sendable, Identifiable {
    public let name: String
    public let shortName: String
    public let starter: Bool
    public let stats: [String: String]

    public var id: String { name }

    public var points: Int { Int(stats["PTS"] ?? "") ?? 0 }
    public var rebounds: String { stats["REB"] ?? "-" }
    public var assists: String { stats["AST"] ?? "-" }
    public var fieldGoals: String { stats["FG"] ?? "-" }
    public var threePointers: String { stats["3PT"] ?? "-" }
    public var freeThrows: String { stats["FT"] ?? "-" }
    public var minutes: String { stats["MIN"] ?? "-" }
    public var turnovers: String { stats["TO"] ?? "-" }
    public var steals: String { stats["STL"] ?? "-" }
    public var blocks: String { stats["BLK"] ?? "-" }
}

// MARK: - Baseball Players

public struct BaseballPlayers: Codable, Sendable {
    public let batting: [BaseballBatter]
    public let pitching: [BaseballPitcher]

    public init(batting: [BaseballBatter] = [], pitching: [BaseballPitcher] = []) {
        self.batting = batting
        self.pitching = pitching
    }
}

public struct BaseballBatter: Codable, Sendable, Identifiable {
    public let name: String
    public let shortName: String
    public let position: String
    public let batOrder: Int?
    public let stats: [String: String]

    public var id: String { "\(name)-\(batOrder ?? 0)" }

    public var atBatResult: String { stats["H-AB"] ?? "-" }
    public var runs: String { stats["R"] ?? "-" }
    public var hits: String { stats["H"] ?? "-" }
    public var rbi: String { stats["RBI"] ?? "-" }
    public var homeRuns: String { stats["HR"] ?? "-" }
    public var walks: String { stats["BB"] ?? "-" }
    public var strikeouts: String { stats["K"] ?? "-" }
    public var average: String { stats["AVG"] ?? "-" }
}

public struct BaseballPitcher: Codable, Sendable, Identifiable {
    public let name: String
    public let shortName: String
    public let stats: [String: String]

    public var id: String { name }

    public var inningsPitched: String { stats["IP"] ?? "-" }
    public var hitsAllowed: String { stats["H"] ?? "-" }
    public var runs: String { stats["R"] ?? "-" }
    public var earnedRuns: String { stats["ER"] ?? "-" }
    public var walks: String { stats["BB"] ?? "-" }
    public var strikeouts: String { stats["K"] ?? "-" }
    public var homeRunsAllowed: String { stats["HR"] ?? "-" }
    public var era: String { stats["ERA"] ?? "-" }
}
