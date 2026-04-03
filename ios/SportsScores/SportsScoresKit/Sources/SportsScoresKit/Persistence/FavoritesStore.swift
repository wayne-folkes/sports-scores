import Foundation
import Observation

/// Manages favorite teams using UserDefaults backed by App Group for cross-target sharing.
@Observable
public final class FavoritesStore: @unchecked Sendable {
    private let defaults: UserDefaults
    private let key = "favoriteTeamIds"

    public private(set) var favoriteIds: Set<String>

    public init(defaults: UserDefaults? = nil) {
        let store = defaults ?? UserDefaults(suiteName: AppGroupConfig.suiteName) ?? .standard
        self.defaults = store
        let saved = store.stringArray(forKey: key) ?? []
        self.favoriteIds = Set(saved)
    }

    public func isFavorite(_ teamId: String) -> Bool {
        favoriteIds.contains(teamId)
    }

    public func toggle(_ teamId: String) {
        if favoriteIds.contains(teamId) {
            favoriteIds.remove(teamId)
        } else {
            favoriteIds.insert(teamId)
        }
        persist()
    }

    public func add(_ teamId: String) {
        favoriteIds.insert(teamId)
        persist()
    }

    public func remove(_ teamId: String) {
        favoriteIds.remove(teamId)
        persist()
    }

    private func persist() {
        defaults.set(Array(favoriteIds), forKey: key)
    }
}
