import SwiftUI

struct TeamLogo: View {
    let url: URL?
    let abbreviation: String
    var size: CGFloat = 40

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .scaledToFit()
            case .failure:
                placeholder
            case .empty:
                placeholder
            @unknown default:
                placeholder
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }

    private var placeholder: some View {
        ZStack {
            Circle()
                .fill(Color(.systemGray4))
            Text(abbreviation.prefix(3))
                .font(.system(size: size * 0.3, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    HStack(spacing: 16) {
        TeamLogo(url: nil, abbreviation: "BOS", size: 40)
        TeamLogo(url: nil, abbreviation: "LAL", size: 32)
        TeamLogo(url: URL(string: "https://example.com/logo.png"), abbreviation: "NYK", size: 48)
    }
    .padding()
    .preferredColorScheme(.dark)
}
