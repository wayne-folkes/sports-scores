import Foundation
import Observation
import SportsScoresKit

@Observable
final class SettingsViewModel {
    var refreshInterval: TimeInterval {
        didSet { defaults.set(refreshInterval, forKey: Keys.refreshInterval) }
    }

    var enabledSports: Set<Sport> {
        didSet {
            let rawValues = enabledSports.map(\.rawValue)
            defaults.set(rawValues, forKey: Keys.enabledSports)
        }
    }

    private let defaults: UserDefaults

    private enum Keys {
        static let refreshInterval = "settings.refreshInterval"
        static let enabledSports = "settings.enabledSports"
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        // Load refresh interval
        let savedInterval = defaults.double(forKey: Keys.refreshInterval)
        self.refreshInterval = savedInterval > 0 ? savedInterval : 30

        // Load enabled sports
        if let savedSports = defaults.stringArray(forKey: Keys.enabledSports) {
            self.enabledSports = Set(savedSports.compactMap { Sport(rawValue: $0) })
        } else {
            self.enabledSports = Set(Sport.allCases)
        }
    }

    func isSportEnabled(_ sport: Sport) -> Bool {
        enabledSports.contains(sport)
    }

    func toggleSport(_ sport: Sport) {
        if enabledSports.contains(sport) {
            // Don't allow disabling all sports
            guard enabledSports.count > 1 else { return }
            enabledSports.remove(sport)
        } else {
            enabledSports.insert(sport)
        }
    }
}
