import SwiftUI
import SportsScoresKit

struct StatusBadge: View {
    let status: GameStatus
    let detail: String

    @State private var isPulsing = false

    var body: some View {
        Text(detail)
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor.opacity(isPulsing ? 0.3 : 0.2))
            .foregroundStyle(foregroundColor)
            .clipShape(Capsule())
            .onAppear {
                if status == .live {
                    withAnimation(
                        .easeInOut(duration: 1.0)
                        .repeatForever(autoreverses: true)
                    ) {
                        isPulsing = true
                    }
                }
            }
    }

    private var backgroundColor: Color {
        switch status {
        case .live: .red
        case .final_: .gray
        case .scheduled: .teal
        }
    }

    private var foregroundColor: Color {
        switch status {
        case .live: .red
        case .final_: .secondary
        case .scheduled: .teal
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        StatusBadge(status: .live, detail: "Q3 5:42")
        StatusBadge(status: .final_, detail: "Final")
        StatusBadge(status: .scheduled, detail: "7:00 PM ET")
    }
    .padding()
    .preferredColorScheme(.dark)
}
