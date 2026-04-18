// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MDViewer",
    platforms: [
        .macOS(.v13),
    ],
    products: [
        .executable(
            name: "MDViewer",
            targets: ["MDViewer"]
        ),
    ],
    targets: [
        .executableTarget(
            name: "MDViewer",
            path: "MDViewer",
            exclude: ["Resources/.gitkeep", "Info.plist"]
        ),
    ]
)
