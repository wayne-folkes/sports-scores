import SwiftUI
import SportsScoresKit

struct SettingsTab: View {
    @State private var viewModel = SettingsViewModel()

    private let refreshOptions: [(label: String, interval: TimeInterval)] = [
        ("15 seconds", 15),
        ("30 seconds", 30),
        ("60 seconds", 60),
    ]

    var body: some View {
        NavigationStack {
            List {
                sportsSection
                refreshSection
                aboutSection
            }
            .navigationTitle("Settings")
        }
    }

    // MARK: - Sports Section

    private var sportsSection: some View {
        Section("Sports") {
            ForEach(Sport.allCases) { sport in
                HStack {
                    Image(systemName: sport.sfSymbol)
                        .foregroundStyle(sport.accentColor)
                        .frame(width: 24)
                    Text(sport.fullName)
                    Spacer()
                    Toggle("", isOn: Binding(
                        get: { viewModel.isSportEnabled(sport) },
                        set: { _ in viewModel.toggleSport(sport) }
                    ))
                    .labelsHidden()
                }
            }
        }
    }

    // MARK: - Refresh Section

    private var refreshSection: some View {
        Section("Refresh") {
            Picker("Refresh Interval", selection: $viewModel.refreshInterval) {
                ForEach(refreshOptions, id: \.interval) { option in
                    Text(option.label).tag(option.interval)
                }
            }
        }
    }

    // MARK: - About Section

    private var aboutSection: some View {
        Section("About") {
            HStack {
                Text("App")
                Spacer()
                Text("Sports Scores")
                    .foregroundStyle(.secondary)
            }
            HStack {
                Text("Version")
                Spacer()
                Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                    .foregroundStyle(.secondary)
            }
            HStack {
                Text("Data")
                Spacer()
                Text("ESPN")
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    SettingsTab()
        .preferredColorScheme(.dark)
}
