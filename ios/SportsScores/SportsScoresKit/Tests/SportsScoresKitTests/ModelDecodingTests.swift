import XCTest
@testable import SportsScoresKit

final class ModelDecodingTests: XCTestCase {
    private let decoder = JSONDecoder()

    private func loadFixture(_ name: String) throws -> Data {
        let url = Bundle.module.url(forResource: name, withExtension: "json", subdirectory: "Fixtures")!
        return try Data(contentsOf: url)
    }

    // MARK: - Scores

    func testDecodeNBAScores() throws {
        let data = try loadFixture("scores_nba")
        let response = try decoder.decode(ScoresResponse.self, from: data)

        XCTAssertEqual(response.sport, "nba")
        XCTAssertFalse(response.games.isEmpty)
        XCTAssertFalse(response.lastUpdated.isEmpty)

        let game = response.games[0]
        XCTAssertFalse(game.id.isEmpty)
        XCTAssertFalse(game.homeTeam.name.isEmpty)
        XCTAssertFalse(game.awayTeam.name.isEmpty)
        XCTAssertFalse(game.homeTeam.abbreviation.isEmpty)
        XCTAssertFalse(game.awayTeam.abbreviation.isEmpty)
        XCTAssertFalse(game.homeTeam.logo.isEmpty)
        XCTAssertNotNil(game.homeTeam.logoURL)
    }

    func testDecodeMLBScores() throws {
        let data = try loadFixture("scores_mlb")
        let response = try decoder.decode(ScoresResponse.self, from: data)

        XCTAssertEqual(response.sport, "mlb")
        XCTAssertFalse(response.games.isEmpty)

        let game = response.games[0]
        XCTAssertFalse(game.statusDetail.isEmpty)
    }

    func testGameStatusDecoding() throws {
        let liveJSON = #"{"id":"1","status":"live","statusDetail":"Q3","startTime":null,"homeTeam":{"id":"1","name":"A","shortName":"A","abbreviation":"A","logo":"","record":""},"awayTeam":{"id":"2","name":"B","shortName":"B","abbreviation":"B","logo":"","record":""},"homeScore":50,"awayScore":40,"prediction":null}"#
        let game = try decoder.decode(Game.self, from: Data(liveJSON.utf8))
        XCTAssertEqual(game.status, .live)
        XCTAssertTrue(game.isLive)
        XCTAssertFalse(game.isFinal)

        let finalJSON = #"{"id":"2","status":"final","statusDetail":"Final","startTime":null,"homeTeam":{"id":"1","name":"A","shortName":"A","abbreviation":"A","logo":"","record":""},"awayTeam":{"id":"2","name":"B","shortName":"B","abbreviation":"B","logo":"","record":""},"homeScore":100,"awayScore":90,"prediction":null}"#
        let game2 = try decoder.decode(Game.self, from: Data(finalJSON.utf8))
        XCTAssertEqual(game2.status, .final_)
        XCTAssertTrue(game2.isFinal)
    }

    // MARK: - Box Scores

    func testDecodeNBABoxScore() throws {
        let data = try loadFixture("boxscore_nba")
        let response = try decoder.decode(BoxScoreResponse.self, from: data)

        XCTAssertEqual(response.sport, "nba")
        XCTAssertFalse(response.eventId.isEmpty)
        XCTAssertFalse(response.teams.away.team.name.isEmpty)
        XCTAssertFalse(response.teams.home.team.name.isEmpty)
        XCTAssertNotNil(response.teams.away.score)
        XCTAssertNotNil(response.teams.home.score)
        XCTAssertFalse(response.statistics.isEmpty)

        // Verify player data is basketball format
        if case .basketball(let away, let home) = response.players {
            XCTAssertFalse(away.isEmpty)
            XCTAssertFalse(home.isEmpty)
            XCTAssertFalse(away[0].name.isEmpty)
            XCTAssertFalse(away[0].stats.isEmpty)
            XCTAssertNotNil(away[0].stats["PTS"])
        } else {
            XCTFail("Expected basketball player format for NBA")
        }
    }

    func testDecodeMLBBoxScore() throws {
        let data = try loadFixture("boxscore_mlb")
        let response = try decoder.decode(BoxScoreResponse.self, from: data)

        XCTAssertEqual(response.sport, "mlb")
        XCTAssertFalse(response.eventId.isEmpty)

        // Verify player data is baseball format
        if case .baseball(let away, let home) = response.players {
            XCTAssertFalse(away.batting.isEmpty)
            XCTAssertFalse(away.pitching.isEmpty)
            XCTAssertFalse(home.batting.isEmpty)
            XCTAssertFalse(home.pitching.isEmpty)

            let batter = away.batting[0]
            XCTAssertFalse(batter.name.isEmpty)
            XCTAssertFalse(batter.stats.isEmpty)
        } else {
            XCTFail("Expected baseball player format for MLB")
        }
    }

    // MARK: - Teams

    func testDecodeNBATeams() throws {
        let data = try loadFixture("teams_nba")
        let response = try decoder.decode(TeamsResponse.self, from: data)

        XCTAssertEqual(response.sport, "nba")
        XCTAssertFalse(response.teams.isEmpty)

        let team = response.teams[0]
        XCTAssertFalse(team.id.isEmpty)
        XCTAssertFalse(team.name.isEmpty)
        XCTAssertFalse(team.abbreviation.isEmpty)
        XCTAssertNotNil(team.logoURL)
    }

    func testDecodeMLBTeams() throws {
        let data = try loadFixture("teams_mlb")
        let response = try decoder.decode(TeamsResponse.self, from: data)

        XCTAssertEqual(response.sport, "mlb")
        XCTAssertFalse(response.teams.isEmpty)
    }
}
