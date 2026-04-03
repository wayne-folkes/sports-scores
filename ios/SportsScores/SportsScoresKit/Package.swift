// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SportsScoresKit",
    platforms: [
        .iOS(.v17),
        .watchOS(.v10),
        .macOS(.v14),
    ],
    products: [
        .library(name: "SportsScoresKit", targets: ["SportsScoresKit"]),
    ],
    targets: [
        .target(
            name: "SportsScoresKit",
            path: "Sources/SportsScoresKit"
        ),
        .testTarget(
            name: "SportsScoresKitTests",
            dependencies: ["SportsScoresKit"],
            path: "Tests/SportsScoresKitTests",
            resources: [.copy("Fixtures")]
        ),
    ]
)
