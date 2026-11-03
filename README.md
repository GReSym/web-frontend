# GReSym Web

Веб-клиент дипломного проекта **GReSym (Game Recommendation System)** — рекомендательной системы видеоигр.

Одностраничное приложение на **Vue 3**: каталог и поиск игр, библиотека пользователя с оценками, персональные рекомендации
и панель администратора.

> Этот репозиторий содержит только веб-клиент. Все данные он получает через HTTP API из репозитория backend (ASP.NET),
> картинки игр — из Openinary (репозиторий deploy) или, пока они не перенесены, напрямую с CDN Steam.

## Возможности

- главная страница: популярные игры и подсказки по библиотеке («много наиграно, но нет оценки»);
- поиск по названию и по смыслу описания (`exact=false`), фильтр по тегам с автодополнением;
- страница игры: описание (HTML Steam, очищается DOMPurify), скриншоты с просмотром, отзывы, теги, добавление в библиотеку;
- профиль: библиотека с оценками 1–10, «рекомендую / не рекомендую», часами и комментариями; статистика; настройки рекомендаций;
- рекомендации: запуск, ожидание результата, история запусков, отметки «нравится / не нравится» по рекомендованным играм;
- панель администратора: запуски офлайн-оценки и их метрики, устаревшие векторы, редактирование игр,
  картинки (базовый URL медиа, перенос картинок со Steam в Openinary);
- светлая и тёмная тема, английский и русский языки.

## Архитектура

```text
Браузер (Vue SPA)
   │
   ├── /api/*  ───────────────▶ GReSym.API (ASP.NET)   — данные, JWT-аутентификация
   │
   └── картинки
         ├── путь в Openinary ─▶ <базовый URL медиа>/t/<пресет>/games/<id>/<файл>  — шлюз media (deploy/)
         └── URL Steam ───────▶ CDN Steam (ещё не перенесённые картинки)
```

- Весь HTTP идёт через `src/services/`: `api.ts` (базовый URL, токен, ошибки) и по одному сервису на область API.
  Типы в `src/types/api.ts` повторяют DTO backend.
- **Картинки.** В ответах API ссылка на картинку — это либо полный URL Steam, либо путь в Openinary (`games/10/header.jpg`).
  Базовый URL медиа приходит из `GET /api/config` (задаёт администратор), адрес строится в `src/utils/media.ts`
  с одним из трёх пресетов (`header`, `thumb`, `full`). Пресеты должны совпадать с белым списком шлюза
  (`deploy/media/presets.conf`) и с пресетами backend (`Media:*Presets`).
- Картинки всегда загружаются лениво (`loading="lazy"`), в списках — уменьшенные варианты, полноразмерный скриншот —
  только при открытии. Ничего не загружается заранее.
- Рекомендации считаются асинхронно: клиент отправляет запрос и опрашивает `GET /api/users/me/recommendations/{id}`,
  пока результат не будет готов.

## Структура репозитория

```text
web-frontend
├── src
│   ├── main.ts, App.vue
│   ├── router/          — маршруты, проверки входа и прав администратора
│   ├── services/        — api.ts и сервисы по областям API
│   ├── stores/          — Pinia: auth (JWT), config (базовый URL медиа)
│   ├── views/           — страницы
│   ├── components/      — common, games, layout, profile, recommendations, search, admin
│   ├── composables/     — списки с подгрузкой, редактор библиотеки, запуск рекомендаций, тема, уведомления
│   ├── utils/           — media.ts (картинки), steam.ts, format.ts, sanitize.ts, metrics.ts
│   ├── i18n/            — en.ts, ru.ts (ключи должны совпадать)
│   ├── styles/          — tokens.css (цвета, отступы, светлая/тёмная тема), base.css
│   └── __tests__/       — модульные тесты (Vitest)
├── e2e/                 — тесты Playwright
├── .env.example
└── vite.config.ts       — алиас @, прокси /api и /cdn
```

## Требования

- Node.js 22.18+ или 24.12+ и npm;
- запущенный backend (`./manage.sh run api` в backend или `./manage.sh up --app` в deploy) на `http://localhost:5147`;
- для картинок из Openinary — стек deploy (`./manage.sh up`), шлюз media на `http://localhost:8090`.

## Установка

```bash
npm install --legacy-peer-deps
```

> Обычный `npm install` падает с ошибкой npm («Cannot read properties of null (reading 'edgesOut')»), поэтому нужен `--legacy-peer-deps`.

## Конфигурация

Настройки задаются переменными окружения Vite. Пример — `.env.example`, свой файл — `.env` (в git не попадает):

```bash
cp .env.example .env
```

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `VITE_API_BASE_URL` | `/api` | адрес API для браузера. По умолчанию тот же origin (запросы проксирует сервер Vite). Полный URL возможен, если origin клиента есть в `Cors:Origins` API |
| `VITE_API_PROXY_TARGET` | `http://localhost:5147` | куда сервер Vite проксирует `/api` |
| `VITE_MEDIA_PROXY_TARGET` | `http://localhost:8090` | куда сервер Vite проксирует `/cdn` (шлюз картинок из deploy) |

Базовый URL медиа хранится не здесь, а в базе данных: администратор задаёт его на странице администратора (раздел «Картинки»).

- `http://localhost:8090` — шлюз напрямую (локальная работа);
- `/cdn` — через прокси сервера Vite, то есть с того же адреса, что и сам клиент. Так удобно показывать демо через туннель:
  наружу открывается только сервер Vite, а API и картинки идут через него;
- `https://example.com/cdn` — шлюз, опубликованный отдельно (обратный прокси).

### Важно

- Тексты интерфейса добавляются сразу в `src/i18n/en.ts` и `src/i18n/ru.ts`: тест проверяет, что набор ключей совпадает.
- Новый пресет картинок нужно добавить в трёх местах: `src/utils/media.ts`, `deploy/media/presets.conf`
  и `Media:*Presets` в `backend/GReSym.API/appsettings.example.json`.

## Запуск

### Разработка

```bash
npm run dev               # http://localhost:5173, горячая перезагрузка
```

### Сборка и предпросмотр

```bash
npm run build             # проверка типов + сборка в dist/
npm run preview -- --host # раздаёт dist/ на http://localhost:4173 (и в локальной сети), с теми же прокси /api и /cdn
```

Сервер Vite принимает запросы с любых имён хостов (`allowedHosts: true`), поэтому его можно открыть через туннель
(ngrok, localtunnel и т. п.).

## Тесты и проверка кода

```bash
npm run test:unit         # Vitest
npm run lint              # oxlint + eslint (с автоисправлением)
npm run format            # prettier
npm run test:e2e          # Playwright; один раз установить браузеры: npx playwright install
```

## Технологии

- Vue 3.5 (`<script setup lang="ts">`), Vite 8, TypeScript 6
- Vue Router 5, Pinia 4, vue-i18n 11
- @vueuse/core, DOMPurify
- без UI-библиотек: обычный CSS с токенами (`src/styles/tokens.css`)
- Vitest, Vue Test Utils, Playwright, oxlint, ESLint, Prettier
