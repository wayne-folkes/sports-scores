import SwiftUI

public enum Sport: String, CaseIterable, Codable, Identifiable, Sendable {
    case nba = "nba"
    case mlb = "mlb"
    case mensCollegeBasketball = "mens-college-basketball"
    case womensCollegeBasketball = "womens-college-basketball"
    case collegeBaseball = "college-baseball"
    case collegeSoftball = "college-softball"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .nba: "NBA"
        case .mlb: "MLB"
        case .mensCollegeBasketball: "MCBB"
        case .womensCollegeBasketball: "WCBB"
        case .collegeBaseball: "College Baseball"
        case .collegeSoftball: "College Softball"
        }
    }

    public var fullName: String {
        switch self {
        case .nba: "NBA Basketball"
        case .mlb: "MLB Baseball"
        case .mensCollegeBasketball: "Men's College Basketball"
        case .womensCollegeBasketball: "Women's College Basketball"
        case .collegeBaseball: "College Baseball"
        case .collegeSoftball: "College Softball"
        }
    }

    public var accentColor: Color {
        switch self {
        case .nba: Color(red: 238/255, green: 103/255, blue: 48/255)
        case .mlb: Color(red: 41/255, green: 201/255, blue: 154/255)
        case .mensCollegeBasketball: Color(red: 26/255, green: 82/255, blue: 118/255)
        case .womensCollegeBasketball: Color(red: 142/255, green: 68/255, blue: 173/255)
        case .collegeBaseball: Color(red: 30/255, green: 107/255, blue: 184/255)
        case .collegeSoftball: Color(red: 212/255, green: 69/255, blue: 122/255)
        }
    }

    public var isBaseball: Bool {
        switch self {
        case .mlb, .collegeBaseball, .collegeSoftball: true
        default: false
        }
    }

    public var isBasketball: Bool {
        switch self {
        case .nba, .mensCollegeBasketball, .womensCollegeBasketball: true
        default: false
        }
    }

    public var sfSymbol: String {
        switch self {
        case .nba, .mensCollegeBasketball, .womensCollegeBasketball: "basketball.fill"
        case .mlb, .collegeBaseball, .collegeSoftball: "baseball.fill"
        }
    }
}
