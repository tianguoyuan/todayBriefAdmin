<h1 align="center">今日快讯管理后台 · Today Brief Admin</h1>

<p align="center">Content-management demo built with Vue 3, companion to the <b>Today Brief</b> news reader.</p>

<p align="center">
<b><a href="README.zh-CN.md">简体中文</a></b> · <b>English</b>
</p>

## Overview

Today Brief Admin is a desktop-style back-office demo for the [Today Brief](https://github.com/antfu-collective/vitesse-lite) news reader. It lets you manage news articles, categories, comments and users, and inspect platform statistics.

It follows the same demo philosophy as the reader app: every piece of data is seeded locally (see `src/data`) and persisted in `localStorage` under the `today-brief:admin:` prefix. Nothing leaves your browser.

## Pages

| Route         | Page                                        |
| ------------- | ------------------------------------------- |
| `/`           | Dashboard with platform statistics          |
| `/news`       | News list with search and filters           |
| `/news/new`   | Create a news article                       |
| `/news/:id`   | Edit a news article                         |
| `/categories` | Manage category labels, colors, ordering    |
| `/comments`   | Moderate comments (hide / restore / delete) |
| `/users`      | Manage users, roles, ban / unban            |
| `/settings`   | Theme, data export / import / reset         |

## Features

- Vue 3 `<script setup>` with TypeScript
- File-based routing via [Vue Router](https://github.com/vuejs/vue-router)
- Atomic CSS by [UnoCSS](https://github.com/unocss/unocss), pure CSS icons
- Auto-imported components and composables
- Local persistence with VueUse `useLocalStorage`
- Dark mode, collapsible sidebar, responsive layout
- Data backup via JSON export / import, per-module reset
- Unit tests with [Vitest](https://vitest.dev/)
- ESLint with [`@antfu/eslint-config`](https://github.com/antfu/eslint-config)

## Getting Started

```bash
pnpm i      # install (requires pnpm)
pnpm dev    # dev server on http://localhost:3334
pnpm build  # production build to dist/
pnpm test   # run tests once
pnpm lint   # lint
pnpm typecheck
pnpm preview
```

## Project Structure

```
src/
├── pages/         # file-based routes
├── components/    # auto-imported components (sidebar, topbar, form, dialog, ...)
├── composables/   # auto-imported stores: newsStore, categoryStore, commentStore, userStore
├── data/          # mock news and comments (shared with Today Brief)
└── utils/         # constants, hash, palettes, params
```

## Notes

- This is a standalone demo and keeps its own dataset; it does not connect to the reader app or any server.
- In `/settings` you can export a JSON backup, import one back, or reset any module to its initial seeded state.
- The `推荐` (recommend) category is locked and cannot be deleted.

## Credits

Based on [Vitesse Lite](https://github.com/antfu-collective/vitesse-lite) by [antfu](https://github.com/antfu).
