//
//  PortScanner.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import Foundation

struct PortScanner {
    /// 查找可用端口
    /// - Parameters:
    ///   - starting: 起始端口
    ///   - range: 搜索范围
    /// - Returns: 可用端口，如果没有则返回 nil
    static func findAvailablePort(starting: Int, range: Int = 100) -> Int? {
        for port in starting..<(starting + range) {
            if isPortAvailable(port) {
                return port
            }
        }
        return nil
    }

    /// 检查端口是否可用
    /// - Parameter port: 端口号
    /// - Returns: 是否可用
    static func isPortAvailable(_ port: Int) -> Bool {
        let socketFD = socket(AF_INET, SOCK_STREAM, 0)
        guard socketFD != -1 else {
            return false
        }
        defer {
            close(socketFD)
        }

        // 设置地址重用（避免 TIME_WAIT 状态影响）
        var reuseAddr: Int32 = 1
        setsockopt(
            socketFD,
            SOL_SOCKET,
            SO_REUSEADDR,
            &reuseAddr,
            socklen_t(MemoryLayout<Int32>.size)
        )

        // 绑定端口
        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = in_port_t(port).bigEndian
        addr.sin_addr.s_addr = INADDR_ANY

        let bindResult = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(socketFD, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }

        return bindResult == 0
    }
}
