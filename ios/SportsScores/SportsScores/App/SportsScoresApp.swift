import SwiftUI
import SportsScoresKit

@main
struct SportsScoresApp: App {
    @State private var favoritesStore = FavoritesStore()

    var body: some Scene {
        WindowGroup {
            TabView {
                Tab("Scores", systemImage: "sportscourt") {
                    ScoresTab()
                }

                Tab("Favorites", systemImage: "star.fill") {
                    Text("Favorites")
                }

                Tab("Settings", systemImage: "gearshape") {
                    Text("Settings")
                }
            }
            .environment(favoritesStore)
            .preferredColorScheme(.dark)
        }
    }
}
