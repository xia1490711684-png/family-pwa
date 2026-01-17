# 📺 电视直播 PWA

一个简洁的 HLS 直播源播放器，支持 iOS Safari 原生播放，可作为 PWA 安装到主屏幕。

## ✨ 功能特性

- **频道列表**：支持分类、搜索、筛选
- **收藏功能**：收藏的频道置顶显示，本地存储
- **最近观看**：自动记录最近播放的频道
- **多线路切换**：一个频道可配置多条播放源
- **自动重试**：播放失败自动重试，超过次数自动切换线路
- **离线支持**：PWA 离线可打开应用壳
- **iOS 优化**：Safari 原生 HLS 播放，添加到主屏幕体验佳

## 🚀 部署到 GitHub Pages

### 方式一：根目录部署（推荐）

1. 创建仓库，如 `username.github.io` 或任意仓库名
2. 将所有文件上传到仓库根目录
3. 进入 Settings → Pages → 选择 `main` 分支，目录选 `/root`
4. 保存后等待部署完成

访问地址：
- `https://username.github.io/` （用户主页仓库）
- `https://username.github.io/repo-name/` （普通仓库）

### 方式二：使用现有仓库

如果你已有仓库，直接将所有文件放入根目录即可。

## 📱 iOS 安装说明

1. 用 Safari 打开网站
2. 点击底部分享按钮 ↑
3. 选择「添加到主屏幕」
4. 点击「添加」

安装后会以独立 App 形式运行，没有浏览器地址栏。

## 📝 添加频道

编辑 `channels.json` 文件：

```json
{
  "notice": "提示信息（可选）",
  "categories": ["央视", "卫视", "体育", "少儿"],
  "channels": [
    {
      "id": "cctv1",
      "name": "CCTV-1 综合",
      "category": "央视",
      "logo": "",
      "tags": ["央视", "综合", "新闻"],
      "region": "",
      "disabled": false,
      "sources": [
        {
          "label": "线路1",
          "url": "https://example.com/cctv1.m3u8",
          "type": "hls",
          "priority": 1
        },
        {
          "label": "线路2（备用）",
          "url": "https://backup.com/cctv1.m3u8",
          "type": "hls",
          "priority": 2
        }
      ]
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✅ | 唯一标识符 |
| `name` | ✅ | 频道名称 |
| `category` | ✅ | 分类，用于筛选 |
| `logo` | ❌ | 频道 logo 图片 URL |
| `tags` | ❌ | 搜索关键词数组 |
| `region` | ❌ | 地区标记 |
| `disabled` | ❌ | 是否禁用（下线） |
| `sources` | ✅ | 播放源数组 |
| `sources[].label` | ✅ | 线路名称 |
| `sources[].url` | ✅ | m3u8 播放地址 |
| `sources[].priority` | ❌ | 优先级，数字越小越优先 |

## ⚠️ 重要提醒

**请仅添加你有权观看/转载的直播源**，例如：
- 你自己购买/授权的 IPTV 服务
- 公开授权的 HLS 流
- 官方提供的免费直播源

本工具仅提供播放功能，不提供任何直播源。

## 🔧 更新频道

只需修改 `channels.json` 文件并推送到 GitHub，用户刷新页面即可获取最新频道列表。

Service Worker 使用 stale-while-revalidate 策略：
- 首先返回缓存数据（快速显示）
- 后台请求最新数据
- 下次打开时使用新数据

## 📂 文件结构

```
/
├── index.html          # 首页（频道列表）
├── player.html         # 播放页
├── channels.json       # 频道数据
├── manifest.webmanifest # PWA 配置
├── sw.js               # Service Worker
├── icon-192.png        # 图标 192x192
├── icon-512.png        # 图标 512x512
└── apple-touch-icon.png # iOS 图标
```

## 🌐 浏览器兼容性

| 浏览器 | HLS 支持 |
|--------|---------|
| Safari (iOS/macOS) | ✅ 原生支持 |
| Chrome | ⚡ hls.js |
| Firefox | ⚡ hls.js |
| Edge | ⚡ hls.js |

iOS Safari 原生支持 HLS，体验最佳。其他浏览器通过 hls.js 库实现支持。

## 📄 许可

MIT License
