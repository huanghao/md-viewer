# MD Viewer 配置策略

## 设计原则

1. **约定优于配置**: 提供合理的默认值，用户无需配置即可使用
2. **分层配置**: 支持多种配置来源，按优先级覆盖
3. **配置即代码**: 配置文件使用 JSON 格式，便于版本控制和工具处理
4. **向前兼容**: 新增配置项时有默认值，不破坏现有配置

## 配置来源优先级（从高到低）

```
1. 命令行参数（最高优先级）
   - 例如: -p 3001, --host 0.0.0.0

2. 环境变量
   - 例如: PORT=8080, HOST=0.0.0.0

3. 用户配置文件 (~/.config/md-viewer/config.json)

4. 内置默认值（最低优先级）
```

## 配置项说明

### server.* - 服务器配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| server.port | number | 3000 | HTTP 服务器端口 |
| server.host | string | "localhost" | 绑定的主机地址 |

**使用场景**:
- 端口冲突时修改为其他端口
- 需要局域网访问时改为 "0.0.0.0"

### client.* - 客户端行为

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| client.defaultFocus | boolean | true | 添加文件后是否自动切换 |
| client.theme | string | "light" | UI 主题: "light", "dark", "auto" |

**使用场景**:
- 不喜欢自动切换时设为 false
- 喜欢深色主题时设为 "dark"

### editor.* - 编辑器显示

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| editor.fontSize | number | 14 | 预览字体大小（像素） |
| editor.lineHeight | number | 1.6 | 行高倍数 |

**使用场景**:
- 需要更大字体时调整
- 需要更紧凑/宽松的排版时调整

### files.* - 文件处理

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| files.autoRefresh | boolean | true | 文件变更时自动刷新 |
| files.rememberOpenFiles | boolean | true | 重启后恢复打开的文件 |

**使用场景**:
- 不需要自动刷新时关闭
- 不需要持久化时关闭

## 配置验证策略

1. **类型检查**: 配置加载时验证类型，类型不匹配则忽略该项
2. **范围检查**: 数值型配置检查合理范围（如 port: 1-65535）
3. **默认值回退**: 无效配置使用默认值，并输出警告
4. **静默失败**: 配置文件不存在或格式错误时不中断程序

## 配置更新策略

### 添加新配置项

1. 在 `DEFAULT_CONFIG` 中添加默认值
2. 更新 `Config` 接口
3. 更新 `man/md-viewer.config.5`
4. 更新 `docs/design/20260227-config-strategy.md`（本文档）

### 废弃配置项

1. 在配置加载时检测旧配置名，输出弃用警告
2. 维持向后兼容至少一个主要版本
3. 在文档中标记为 deprecated

## 示例配置文件

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "client": {
    "defaultFocus": true,
    "theme": "light"
  },
  "editor": {
    "fontSize": 14,
    "lineHeight": 1.6
  },
  "files": {
    "autoRefresh": true,
    "rememberOpenFiles": true
  }
}
```

## 相关文档

- [md-viewer(1)](../../man/md-viewer.1) - 命令行手册
- [md-viewer.config(5)](../../man/md-viewer.config.5) - 配置文件手册
