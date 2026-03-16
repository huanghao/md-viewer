//
//  AppConfig.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import Foundation

struct AppConfig: Codable {
    var serverPort: Int = 53000
    var launchAtLogin: Bool = false
    var showInDock: Bool = false

    private static let configPath: URL = {
        let configDir = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer")
        try? FileManager.default.createDirectory(
            at: configDir,
            withIntermediateDirectories: true
        )
        return configDir.appendingPathComponent("app-config.json")
    }()

    static func load() -> AppConfig {
        guard let data = try? Data(contentsOf: configPath),
              let config = try? JSONDecoder().decode(AppConfig.self, from: data) else {
            return AppConfig()
        }
        return config
    }

    func save() {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted

        if let data = try? encoder.encode(self) {
            try? data.write(to: Self.configPath)
            print("✅ 配置已保存: \(Self.configPath.path)")
        }
    }
}
