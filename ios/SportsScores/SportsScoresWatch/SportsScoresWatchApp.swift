import SwiftUI
import SportsScoresKit

@main
struct SportsScoresWatchApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                WatchScoresView()
            }
        }
    }
}
