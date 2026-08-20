# ReelPulse

Внутренний дашборд для блогеров digital-агентства: отслеживание Instagram Reels — просмотры, дата публикации и обложка. Данные подтягиваются через [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper).

## Посмотреть онлайн (без регистрации)

**Прод:** https://test-vert-iota-16.vercel.app/login

На странице входа есть блок **«Быстрый вход (demo)»**:

| Кнопка | Что откроется |
|--------|----------------|
| **Анна** | Личный кабинет блогера — дашборд с 5 демо-роликами, график, метрики |
| **Маша** | Личный кабинет блогера — 6 демо-роликов |
| **👑 Админ** | Общая аналитика по всем блогерам агентства |

Пароль не нужен. Можно также зарегистрировать свой аккаунт через форму «Зарегистрироваться».

## Стек

- **Next.js 15** (App Router), **JavaScript** (без TypeScript)
- **Postgres** (Neon через Vercel) — чистый SQL через `pg`, без ORM
- **Tailwind CSS v4**
- **Apify API** — скрапинг метаданных Reels
- **JWT-сессии** (httpOnly cookie + `jose`)
- **Recharts** — график на дашборде
- **Деплой:** Vercel

## Функционал

- **Личные кабинеты блогеров** — дашборд с метриками, графиком динамики просмотров, фильтром по периоду (неделя / месяц / всё время)
- **Добавление Reels по ссылке** — автоматическое получение просмотров, даты и обложки через Apify
- **Лента роликов** — режимы «сетка» и «таблица», поиск, сортировка, обновление и удаление
- **Обработка ошибок** — если Apify не смог загрузить ролик, карточка переходит в статус `error` с кнопкой «Повторить»
- **Аналитика для admin** — рейтинг блогеров, топ-5 роликов, сводные метрики
- **Демо-режим** — предзаполненные аккаунты Анна / Маша / Админ с тестовыми данными
- **Cron** — автоматическое обновление устаревших роликов (раз в сутки на бесплатном тарифе Vercel)

## Как запустить локально

### 1. Зависимости

```bash
npm install
```

### 2. Переменные окружения

Скопируйте `.env.local.example` → `.env.local` и заполните:

| Переменная | Обязательно | Откуда взять |
|------------|-------------|--------------|
| `POSTGRES_URL` | да | Vercel Dashboard → Storage → Neon → Connect, затем `vercel env pull .env.local` |
| `SESSION_SECRET` | да | Случайная строка 32+ символов |
| `CRON_SECRET` | для cron | Случайная строка 32+ символов |
| `APIFY_API_TOKEN` | для живого Apify | [Apify Console → Integrations](https://console.apify.com/account/integrations) |

> Проще всего для дедлайна использовать **ту же облачную Neon-базу**, что и на проде: `vercel link` → `vercel env pull .env.local`.

### 3. База данных и демо-данные

```bash
node scripts/init-db.js    # создать таблицы
node scripts/seed-demo.js  # демо-аккаунты Анна / Маша / Админ
```

### 4. Dev-сервер

```bash
npm run dev
```

Откройте http://localhost:3000/login

## Структура проекта

```
app/
  (protected)/     # страницы после входа: dashboard, feed, analytics, settings
  api/             # REST API: auth, reels, cron
  login/           # страница входа / регистрации
components/        # UI: DashboardClient, FeedClient, ViewsChart, ReelCard…
lib/
  db.js            # Postgres pool + query-хелперы
  schema.sql       # DDL таблиц
  auth.js          # JWT-сессии
  apify.js         # интеграция с Apify
  reels.js         # SQL-запросы для роликов
  chart-data.js    # агрегация данных для графика и фильтр по периоду
scripts/
  init-db.js       # применить схему
  seed-demo.js     # демо-пользователи и ролики
middleware.js      # защита роутов, редирект admin/blogger
vercel.json        # cron-задача
```

## Скрипты

| Команда | Действие |
|---------|----------|
| `npm run dev` | dev-сервер |
| `npm run build` | init-db + seed-demo + production-сборка |
| `npm run db:init` | создать/обновить таблицы |
| `npm run db:seed` | наполнить демо-данными (идемпотентно) |

## Проверка (smoke tests)

После запуска dev-сервера или на проде:

```bash
BASE_URL=https://test-vert-iota-16.vercel.app node scripts/test-auth-flow.js
BASE_URL=https://test-vert-iota-16.vercel.app node scripts/test-demo-flow.js
BASE_URL=https://test-vert-iota-16.vercel.app node scripts/test-reels-flow.js
```

## Известные ограничения

- **Apify на проде настроен**, но запрос может занять до 2 минут; для приватных, удалённых или несуществующих роликов карточка получит статус `error` — это ожидаемое поведение.
- **Cron на Vercel Hobby** — не чаще одного раза в сутки (`0 0 * * *`), а не каждые 6 часов.
- **Кнопка «Забыли пароль?»** — заглушка, восстановление пароля не реализовано.
- **Neon free tier** — база может «засыпать» после простоя; первый запрос после паузы может быть медленнее.
- **Демо-сид при каждом деплое** перезаписывает ролики демо-аккаунтов (Анна/Маша), но не трогает зарегистрированных пользователей.

## Авторизация (кратко)

- Регистрация / вход — email + пароль, сессия в httpOnly cookie (7 дней)
- Защищённые роуты (`/dashboard`, `/feed`, `/settings`, `/analytics`) без сессии → редирект на `/login`
- `/analytics` доступен только роли `admin`, блогер перенаправляется на `/dashboard`
