# Hisab Kitab

Hisab Kitab ("account of accounts") is a Splitwise-style expense-sharing web app. Users create groups, log shared expenses, split them equally / by share / by percentage, and track who owes whom — with per-group balances and monthly summaries.

Built with Angular 20, NgRx, and Firebase (Auth + Firestore), and installable as a PWA.

## Features

- **Auth** — email/password sign-up & login, OTP verification, guarded routes via `@angular/fire/auth-guard`
- **Groups** — create/edit groups, manage members and per-group expense categories, custom group images
- **Expenses** — add/edit expenses with category, payer, and flexible splitting (`Equally`, `ByShare`, `ByPercentage`)
- **Balances & summaries** — group balance view, expense summary, monthly totals, filter by date range
- **Payments** — record settlement payments between members
- **PWA** — installable, offline-capable via Angular Service Worker
- **Theming** — light/dark theme support

## Tech stack

| Layer      | Technology                                                             |
| ---------- | ----------------------------------------------------------------------- |
| Framework  | Angular 20 (standalone components)                                     |
| State      | NgRx (`store`, `effects`, `entity`, `router-store`, `store-devtools`)   |
| Backend    | Firebase (Authentication, Firestore) via `@angular/fire` / `rxfire`     |
| UI         | Angular Material, Angular CDK                                          |
| PWA        | `@angular/service-worker`                                              |
| Hosting    | Firebase Hosting                                                       |
| Tooling    | ESLint, Prettier, Karma/Jasmine                                        |

## Project structure

```
src/app/
├── components/
│   ├── group/            group create/edit, category & member management
│   ├── group-expenses/   expense list, header, summary, balances
│   ├── home/              home dashboard, group list, overview
│   ├── shared/            layout, toolbar, dialog, directives
│   └── widgets/           category selector, expense filters, paid-by-share
├── models/                Expense, Group, Category, User, Dialog, etc.
├── services/               dialog, navigation, notification, pwa, theme, toolbar
├── store/                  NgRx feature stores: auth, expense, group, user
└── utilities/
```

## Getting started

### Prerequisites

- Node.js and npm
- Angular CLI (`npm install -g @angular/cli`)
- A Firebase project (Auth + Firestore enabled) if you want to run against your own backend — configure it in `src/app/app.config.ts`

### Install

```bash
npm install
```

### Development server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The app reloads automatically on source changes.

### Build

```bash
npm run build          # development build
npm run build:prod     # production build, output in dist/hisab-kitab-fe
```

### Tests

```bash
npm test
```

Runs unit tests via Karma/Jasmine.

### Lint

```bash
npm run lint
```

## Deployment

The app is configured for Firebase Hosting (`firebase.json`), serving `dist/hisab-kitab-fe/browser`, with Firestore rules in `firestore.rules`. Deploy with the Firebase CLI:

```bash
npm run build:prod
firebase deploy
```
