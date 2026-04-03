import XCTest
@testable import SportsScoresKit

final class SportTests: XCTestCase {
    func testBaseballSports() {
        XCTAssertTrue(Sport.mlb.isBaseball)
        XCTAssertTrue(Sport.collegeBaseball.isBaseball)
        XCTAssertTrue(Sport.collegeSoftball.isBaseball)
        XCTAssertFalse(Sport.nba.isBaseball)
        XCTAssertFalse(Sport.mensCollegeBasketball.isBaseball)
        XCTAssertFalse(Sport.womensCollegeBasketball.isBaseball)
    }

    func testBasketballSports() {
        XCTAssertTrue(Sport.nba.isBasketball)
        XCTAssertTrue(Sport.mensCollegeBasketball.isBasketball)
        XCTAssertTrue(Sport.womensCollegeBasketball.isBasketball)
        XCTAssertFalse(Sport.mlb.isBasketball)
        XCTAssertFalse(Sport.collegeBaseball.isBasketball)
        XCTAssertFalse(Sport.collegeSoftball.isBasketball)
    }

    func testRawValues() {
        XCTAssertEqual(Sport.nba.rawValue, "nba")
        XCTAssertEqual(Sport.mlb.rawValue, "mlb")
        XCTAssertEqual(Sport.mensCollegeBasketball.rawValue, "mens-college-basketball")
        XCTAssertEqual(Sport.womensCollegeBasketball.rawValue, "womens-college-basketball")
        XCTAssertEqual(Sport.collegeBaseball.rawValue, "college-baseball")
        XCTAssertEqual(Sport.collegeSoftball.rawValue, "college-softball")
    }

    func testDisplayNames() {
        XCTAssertEqual(Sport.nba.displayName, "NBA")
        XCTAssertEqual(Sport.mlb.displayName, "MLB")
        XCTAssertFalse(Sport.mensCollegeBasketball.displayName.isEmpty)
    }

    func testSFSymbols() {
        XCTAssertEqual(Sport.nba.sfSymbol, "basketball.fill")
        XCTAssertEqual(Sport.mlb.sfSymbol, "baseball.fill")
    }
}
