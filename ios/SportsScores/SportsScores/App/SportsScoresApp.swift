import SwiftUI
import SportsScoresKit

@main
struct SportsScoresApp: App {
    @State private var favoritesStore = FavoritesStore()

    var body: some Scene {
        WindowGroup {
            TabView {
                ScoresTab()
                    .tabItem { Label("Scores", systemImage: "sportscourt") }

                FavoritesTab()
                    .tabItem { Label("Favorites", systemImage: "star.fill") }

                SettingsTab()
                    .tabItem { Label("Settings", systemImage: "gearshape") }
            }
            .environment(favoritesStore)
            .preferredColorScheme(.dark)
        }
    }
}
