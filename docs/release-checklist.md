# Release Checklist

发布新版本的检查清单。

## 发布前检查

- [ ] 所有功能测试通过
- [ ] 本地构建成功：`./scripts/build-all.sh 0.1.0`
- [ ] 本地打包成功：`./scripts/package.sh 0.1.0`
- [ ] 本地安装测试：`brew install Formula/md-viewer-local.rb`
- [ ] 更新 CHANGELOG.md
- [ ] 更新 README.md 中的版本号（如有）
- [ ] 提交所有更改

## 发布流程

### 1. 打 Tag

```bash
VERSION="0.1.0"
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin "v${VERSION}"
```

### 2. 等待 CI 构建

- 访问 GitHub Actions: https://github.com/huanghao/md-viewer/actions
- 确认 Release workflow 运行成功
- 检查 Release 页面是否有新版本

### 3. 验证 Release

访问 https://github.com/huanghao/md-viewer/releases/tag/v${VERSION}

检查：
- [ ] 所有平台的 tarball 都已上传
  - mdv-darwin-arm64.tar.gz
  - mdv-darwin-x64.tar.gz
  - mdv-linux-x64.tar.gz
  - mdv-linux-arm64.tar.gz
- [ ] SHA256SUMS.txt 已上传
- [ ] Release notes 自动生成

### 4. 更新 Homebrew Formula

```bash
./scripts/update-formula-sha.sh ${VERSION}
git add Formula/md-viewer.rb
git commit -m "chore: update formula for v${VERSION}"
git push
```

### 5. 推送 Formula 到 homebrew-tap

```bash
# 复制 Formula
cp Formula/md-viewer.rb /path/to/homebrew-tap/Formula/

# 提交到 tap 仓库
cd /path/to/homebrew-tap
git add Formula/md-viewer.rb
git commit -m "chore: update md-viewer to v${VERSION}"
git push
```

### 6. 测试安装

```bash
# 更新 tap
brew update

# 安装新版本
brew upgrade md-viewer

# 验证版本
mdv --help | head -1
```

### 6. 发布公告

- [ ] 在 GitHub Release 中添加详细说明
- [ ] 更新项目文档
- [ ] 通知用户（如有）

## 常见问题

### CI 构建失败

1. 检查 GitHub Actions 日志
2. 本地复现问题
3. 修复后重新打 tag：
   ```bash
   git tag -d v${VERSION}
   git push origin :refs/tags/v${VERSION}
   # 修复问题后重新打 tag
   ```

### Formula SHA256 不匹配

1. 从 Release 页面下载 SHA256SUMS.txt
2. 手动更新 Formula/md-viewer.rb 中的 SHA256
3. 提交更新

### 本地测试失败

1. 清理旧版本：`brew uninstall md-viewer`
2. 清理缓存：`brew cleanup`
3. 重新安装：`brew install md-viewer`

## 回滚

如果发现严重问题需要回滚：

```bash
# 删除 tag
git tag -d v${VERSION}
git push origin :refs/tags/v${VERSION}

# 删除 Release
# 在 GitHub Release 页面手动删除

# 恢复 Formula
git revert <commit-hash>
git push
```
