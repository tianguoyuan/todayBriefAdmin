<h1 align="center">今日快讯管理后台 · Today Brief Admin</h1>

<p align="center">基于 Vue 3 的桌面端内容管理后台 Demo，与「今日快讯」资讯应用配套。</p>

<p align="center">
<b><a href="README.md">English</a></b> · <b>简体中文</b>
</p>

## 简介

今日快讯管理后台是「今日快讯」资讯阅读应用配套的后台管理系统 Demo，用于管理新闻、分类、评论与用户，并查看平台整体数据。

它延续了阅读端「纯演示」的设计思路：所有数据均为本地模拟（见 `src/data`），保存在浏览器 `localStorage` 中，键前缀为 `today-brief:admin:`，不会上传任何服务器。

## 页面

| 路由          | 页面                             |
| ------------- | -------------------------------- |
| `/`           | 仪表盘（平台整体统计）           |
| `/news`       | 新闻列表（搜索 / 筛选）          |
| `/news/new`   | 新建新闻                         |
| `/news/:id`   | 编辑新闻                         |
| `/categories` | 分类管理（名称、配色、删除保护） |
| `/comments`   | 评论管理（隐藏 / 恢复 / 删除）   |
| `/users`      | 用户管理（角色、禁用 / 解禁）    |
| `/settings`   | 主题、数据导出 / 导入 / 重置     |

## 特性

- Vue 3 `<script setup>` + TypeScript
- [Vue Router](https://github.com/vuejs/vue-router) 文件式路由，路由自动生成
- [UnoCSS](https://github.com/unocss/unocss) 按需原子化 CSS，纯 CSS 图标
- 组件与组合式函数自动导入
- VueUse `useLocalStorage` 本地持久化
- 深色模式、可折叠侧边栏、响应式布局
- JSON 备份导出 / 导入、按模块重置数据
- [Vitest](https://vitest.dev/) 单元与组件测试
- ESLint（[`@antfu/eslint-config`](https://github.com/antfu/eslint-config)）

## 快速开始

```bash
pnpm i      # 安装依赖（需要 pnpm）
pnpm dev    # 开发服务器 http://localhost:3334
pnpm build  # 生产构建，输出到 dist/
pnpm test   # 运行测试
pnpm lint   # 代码检查
pnpm typecheck
pnpm preview
```

## 项目结构

```
src/
├── pages/         # 文件式路由页面
├── components/    # 自动导入的组件（侧边栏、顶栏、表单、弹窗等）
├── composables/   # 自动导入的 store：newsStore、categoryStore、commentStore、userStore
├── data/          # 模拟新闻与评论数据（与「今日快讯」保持一致）
└── utils/         # constants、hash、palettes、params
```

## 说明

- 后台是独立 Demo，维护自己的一份数据，不与阅读端或任何服务器联通。
- 在 `/settings` 中可导出 JSON 备份、导入备份或按模块重置为初始演示数据。
- 「推荐」分类为内置分类（锁定），不可删除。
- 后台数据使用的 localStorage 键以 `today-brief:admin:` 为前缀。

## 致谢

基于 [antfu](https://github.com/antfu) 的 [Vitesse Lite](https://github.com/antfu-collective/vitesse-lite) 模板构建。
