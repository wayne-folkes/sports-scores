import Foundation

public enum AppGroupConfig: Sendable {
    public static let suiteName = "group.com.sportsscores.shared"

    public static var containerURL: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName)
    }
}
