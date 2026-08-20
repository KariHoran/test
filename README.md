# ReelsHub

Дашборд для блогеров: отслеживание Instagram Reels (просмотры, дата, обложка). Стек: **Next.js (App Router)**, **JavaScript**, **Postgres**, **Tailwind CSS**.

## Быстрый старт (локально)

Для дедлайна проще всего использовать **одну облачную Postgres-базу** (Vercel Postgres) и для dev, и для prod — данные не теряются между деплоями.

### 1. Postgres на Vercel

1. Создайте проект в [Vercel](https://vercel.com) и подключите репозиторий (или выполните `vercel link` локально).
2. В **Dashboard → Storage → Create Database → Postgres** создайте базу и подключите к проекту.
3. Локально подтяните переменные:

```bash
vercel env pull .env.local
```

Vercel автоматически добавит `POSTGRES_URL` и связанные переменные.

### 2. Запуск

```bash
npm install
npm run db:init    # создать таблицы в Postgres
npm run db:seed    # демо-данные (Анна, Маша, Админ + ролики)
npm run dev        # http://localhost:3000
```

Добавьте в `.env.local` (или через `vercel env pull`):

```env
POSTGRES_URL=postgres://...
SESSION_SECRET=любая-длинная-случайная-строка-32plus
CRON_SECRET=ещё-одна-случайная-строка
```

Для реального подтягивания Reels через Apify добавьте `APIFY_API_TOKEN`. Без него демо работает полностью на сид-данных.

## Быстрый вход (demo)

На странице `/login` под формой есть блок **«Быстрый вход (demo)»** — три кнопки:

| Кнопка | Куда ведёт | Что показывает |
|--------|------------|----------------|
| **Анна** | `/dashboard` | 5 демо-роликов, метрики по просмотрам |
| **Маша** | `/dashboard` | 6 демо-роликов |
| **Админ** | `/analytics` | рейтинг блогеров (Анна + Маша) с реальными цифрами из БД |

Пароль не нужен — вход через `POST /api/auth/demo-login` только для пользователей с `is_demo = TRUE`.

Повторный сид без дублей (обновляет только демо-аккаунты):

```bash
npm run db:seed
```

## Реальный Apify (опционально)

1. Получите токен на [Apify Console](https://console.apify.com/account/integrations)
2. Добавьте в `.env.local` / Vercel env:

```env
APIFY_API_TOKEN=apify_api_...
```

3. После входа (обычного или demo) кнопка **«+ Добавить Reels»** вызовет Apify и обновит карточку.

## Деплой на Vercel

1. Подключите репозиторий или `vercel link`
2. Создайте **Vercel Postgres** в Storage и привяжите к проекту
3. В **Settings → Environment Variables** задайте:

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `POSTGRES_URL` | да | автоматически из Vercel Postgres |
| `SESSION_SECRET` | да | подпись JWT-сессий |
| `APIFY_API_TOKEN` | нет | для живого скрапинга Reels |
| `CRON_SECRET` | для cron | защита `/api/cron/refresh-reels` |

4. Один раз прогоните сид на облачной базе: `npm run db:init && npm run db:seed`
5. `vercel --prod` — при сборке `init-db.js` создаёт таблицы (идемпотентно)
6. Cron настроен в `vercel.json` — обновление stale-роликов каждые 6 часов

## Структура

```
app/           — страницы и API-роуты
components/    — UI-компоненты
lib/           — auth, db, apify, reels
scripts/       — init-db.js, seed-demo.js
```

## Скрипты

| Команда | Действие |
|---------|----------|
| `npm run dev` | dev-сервер |
| `npm run build` | схема БД + production-сборка |
| `npm run db:init` | создать таблицы в Postgres |
| `npm run db:seed` | демо-пользователи и ролики |
