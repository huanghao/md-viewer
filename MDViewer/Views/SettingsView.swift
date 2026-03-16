//
//  SettingsView.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var serverManager: ServerManager
    @State private var config = AppConfig.load()

    var body: some View {
        TabView {
            // 通用设置
            Form {
                Section("服务器") {
                    HStack {
                        Text("默认端口:")
                        TextField("端口", value: $config.serverPort, format: .number)
                            .frame(width: 80)
                        Text("(53000-53099)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Toggle("开机自启动", isOn: $config.launchAtLogin)
                }

                Section("界面") {
                    Toggle("显示 Dock 图标", isOn: $config.showInDock)
                        .help("关闭后仅在状态栏显示")
                }

                Section {
                    Button("保存") {
                        config.save()

                        // 如果端口改变，需要重启服务
                        let oldConfig = AppConfig.load()
                        if oldConfig.serverPort != config.serverPort {
                            Task {
                                await serverManager.restart()
                            }
                        }

                        // 更新 Dock 显示策略
                        NSApp.setActivationPolicy(
                            config.showInDock ? .regular : .accessory
                        )
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            .padding()
            .frame(width: 400, height: 300)
            .tabItem {
                Label("通用", systemImage: "gearshape")
            }

            // 关于
            VStack(spacing: 16) {
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.blue.gradient)

                Text("MD Viewer")
                    .font(.title)
                    .fontWeight(.bold)

                Text("版本 1.0.0")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("一个简洁的 Markdown 阅读工具")
                    .font(.body)
                    .multilineTextAlignment(.center)

                Spacer()

                Link("GitHub", destination: URL(string: "https://github.com/huanghao/md-viewer")!)
                    .font(.caption)
            }
            .padding()
            .frame(width: 400, height: 300)
            .tabItem {
                Label("关于", systemImage: "info.circle")
            }
        }
    }
}
