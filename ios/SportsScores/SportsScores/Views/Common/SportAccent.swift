import SwiftUI
import SportsScoresKit

extension Color {
    // Sport accent colors matching the web CSS variables.
    // These mirror the `accentColor` property on `Sport` but are provided
    // as static helpers for use outside of a Sport context.

    /// NBA — #ee6730
    static let nbaAccent = Color(red: 238 / 255, green: 103 / 255, blue: 48 / 255)

    /// MLB — #29c99a
    static let mlbAccent = Color(red: 41 / 255, green: 201 / 255, blue: 154 / 255)

    /// Men's College Basketball — #1a5276
    static let mcbbAccent = Color(red: 26 / 255, green: 82 / 255, blue: 118 / 255)

    /// Women's College Basketball — #8e44ad
    static let wcbbAccent = Color(red: 142 / 255, green: 68 / 255, blue: 173 / 255)

    /// College Baseball — #1e6bb8
    static let collegeBaseballAccent = Color(red: 30 / 255, green: 107 / 255, blue: 184 / 255)

    /// College Softball — #d4457a
    static let collegeSoftballAccent = Color(red: 212 / 255, green: 69 / 255, blue: 122 / 255)

    /// Returns the accent color for the given sport.
    static func accent(for sport: Sport) -> Color {
        sport.accentColor
    }
}
