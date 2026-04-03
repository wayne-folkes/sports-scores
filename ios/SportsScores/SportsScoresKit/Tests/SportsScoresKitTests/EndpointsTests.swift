import XCTest
@testable import SportsScoresKit

final class EndpointsTests: XCTestCase {
    func testScoresURL() {
        let url = Endpoints.scores(sport: .nba)
        XCTAssertEqual(url.absoluteString, "https://sports-scores-silk.vercel.app/api/scores/nba")
    }

    func testTeamsURL() {
        let url = Endpoints.teams(sport: .mlb)
        XCTAssertEqual(url.absoluteString, "https://sports-scores-silk.vercel.app/api/teams/mlb")
    }

    func testBoxScoreURL() {
        let url = Endpoints.boxScore(sport: .mensCollegeBasketball, eventId: "12345")
        XCTAssertEqual(url.absoluteString, "https://sports-scores-silk.vercel.app/api/boxscore/mens-college-basketball/12345")
    }

    func testAllSportURLs() {
        for sport in Sport.allCases {
            let url = Endpoints.scores(sport: sport)
            XCTAssertTrue(url.absoluteString.contains(sport.rawValue))
        }
    }
}
