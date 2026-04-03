import SwiftUI
import SportsScoresKit

struct SportPicker: View {
    @Binding var enabledSports: Set<Sport>

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(Sport.allCases) { sport in
                    SportChip(
                        sport: sport,
                        isSelected: enabledSports.contains(sport),
                        onTap: { toggleSport(sport) }
                    )
                }
            }
            .padding(.horizontal)
        }
    }

    private func toggleSport(_ sport: Sport) {
        withAnimation(.easeInOut(duration: 0.2)) {
            if enabledSports.contains(sport) {
                // Don't allow deselecting the last sport
                if enabledSports.count > 1 {
                    enabledSports.remove(sport)
                }
            } else {
                enabledSports.insert(sport)
            }
        }
    }
}

// MARK: - Sport Chip

private struct SportChip: View {
    let sport: Sport
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 6) {
                Image(systemName: sport.sfSymbol)
                    .font(.caption)
                Text(sport.displayName)
                    .font(.caption)
                    .fontWeight(.semibold)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                isSelected
                    ? sport.accentColor.opacity(0.2)
                    : Color(.systemGray5)
            )
            .foregroundStyle(isSelected ? sport.accentColor : .secondary)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .strokeBorder(
                        isSelected ? sport.accentColor : Color.clear,
                        lineWidth: 1.5
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    SportPicker(enabledSports: .constant(Set(Sport.allCases)))
        .preferredColorScheme(.dark)
        .padding()
}
