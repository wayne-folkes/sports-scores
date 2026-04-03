import XCTest
@testable import SportsScoresKit

final class FavoritesStoreTests: XCTestCase {
    func testToggleFavorite() {
        let defaults = UserDefaults(suiteName: "test-\(UUID().uuidString)")!
        let store = FavoritesStore(defaults: defaults)

        XCTAssertFalse(store.isFavorite("team-1"))

        store.toggle("team-1")
        XCTAssertTrue(store.isFavorite("team-1"))

        store.toggle("team-1")
        XCTAssertFalse(store.isFavorite("team-1"))
    }

    func testAddRemove() {
        let defaults = UserDefaults(suiteName: "test-\(UUID().uuidString)")!
        let store = FavoritesStore(defaults: defaults)

        store.add("team-1")
        store.add("team-2")
        XCTAssertEqual(store.favoriteIds.count, 2)

        store.remove("team-1")
        XCTAssertEqual(store.favoriteIds.count, 1)
        XCTAssertFalse(store.isFavorite("team-1"))
        XCTAssertTrue(store.isFavorite("team-2"))
    }

    func testPersistence() {
        let suiteName = "test-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!

        let store1 = FavoritesStore(defaults: defaults)
        store1.add("team-1")
        store1.add("team-2")

        let store2 = FavoritesStore(defaults: defaults)
        XCTAssertTrue(store2.isFavorite("team-1"))
        XCTAssertTrue(store2.isFavorite("team-2"))
    }
}
