import Foundation

// MARK: - Teams Response

public struct TeamsResponse: Codable, Sendable {
    public let sport: String
    public let teams: [TeamListItem]
}

public struct TeamListItem: Codable, Sendable, Identifiable {
    public let id: String
    public let name: String
    public let abbreviation: String
    public let logo: String
    public let color: String

    public var logoURL: URL? { URL(string: logo) }
}
