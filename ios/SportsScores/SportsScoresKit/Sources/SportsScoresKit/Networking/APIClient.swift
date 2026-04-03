import Foundation

// MARK: - API Errors

public enum APIError: Error, LocalizedError, Sendable {
    case invalidURL
    case networkError(Error)
    case invalidResponse(statusCode: Int)
    case decodingError(Error)

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            "Invalid URL"
        case .networkError(let error):
            "Network error: \(error.localizedDescription)"
        case .invalidResponse(let code):
            "Server error (HTTP \(code))"
        case .decodingError(let error):
            "Data error: \(error.localizedDescription)"
        }
    }
}

// MARK: - API Client Protocol

public protocol APIClientProtocol: Sendable {
    func fetch<T: Decodable & Sendable>(_ url: URL) async throws -> T
}

// MARK: - Live API Client

public final class APIClient: APIClientProtocol, Sendable {
    private let session: URLSession
    private let decoder: JSONDecoder

    public init(session: URLSession = .shared) {
        self.session = session
        let decoder = JSONDecoder()
        self.decoder = decoder
    }

    public func fetch<T: Decodable & Sendable>(_ url: URL) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(from: url)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse(statusCode: -1)
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse(statusCode: httpResponse.statusCode)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Convenience Methods

    public func fetchScores(sport: Sport) async throws -> ScoresResponse {
        try await fetch(Endpoints.scores(sport: sport))
    }

    public func fetchTeams(sport: Sport) async throws -> TeamsResponse {
        try await fetch(Endpoints.teams(sport: sport))
    }

    public func fetchBoxScore(sport: Sport, eventId: String) async throws -> BoxScoreResponse {
        try await fetch(Endpoints.boxScore(sport: sport, eventId: eventId))
    }
}
