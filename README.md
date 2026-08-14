# Каталог компаний — тестовое задание

Монорепо: PostgreSQL + скрипты загрузки (`/db`) и Next.js-приложение (`/app`).

## Структура

```
/
├── db/                 # schema.sql, load.ts, load-reviews.ts, queries.sql
├── app/                # Next.js App Router (страница /companies)
├── data_pack/          # page_001.json … page_020.json, review.csv
├── screenshots/        # скриншоты UI
├── ANOMALIES.md        # аномалии в review.csv (37 пунктов)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Требования

- Docker Desktop (PostgreSQL 16)
- Node.js 20+
- npm

## Быстрый старт

### Запуск с нуля (Windows PowerShell)

```powershell
# из корня репозитория
Copy-Item .env.example .env
Copy-Item .env.example app\.env.local

docker compose up -d
Get-Content db\schema.sql | docker exec -i companies_postgres psql -U user -d companies_db

Set-Location db
npm install
npm run load
npm run load-reviews
Set-Location ..

Set-Location app
npm install --registry https://registry.npmmirror.com   # если registry.npmjs.org тормозит
npm run dev
```

Приложение: **http://localhost:3000/companies**

---

### 1. Переменные окружения

**Linux / macOS / Git Bash:**
```bash
cp .env.example .env
cp .env.example app/.env.local
```

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
Copy-Item .env.example app\.env.local
```

Файл `.env` в `.gitignore` — не коммитьте его.

### 2. PostgreSQL

```bash
docker compose up -d
```

Параметры: `user` / `password`, база `companies_db`, порт `5432`.

### 3. Схема и загрузка компаний

**Linux / macOS / Git Bash:**
```bash
docker exec -i companies_postgres psql -U user -d companies_db < db/schema.sql
```

**Windows PowerShell** (оператор `<` не поддерживается):
```powershell
Get-Content db\schema.sql | docker exec -i companies_postgres psql -U user -d companies_db
```

Загрузка данных:
```bash
cd db
npm install
npm run load
```

Скрипт `load.ts`:
- читает `data_pack/page_*.json`;
- нормализует поля (`site` → `website`, телефон, рейтинг);
- идемпотентный upsert: `ON CONFLICT (external_id) DO UPDATE`;
- логирует: вставлено / обновлено / пропущено.

**Адаптация под реальные данные:** в JSON поле сайта — `site`, ID — `id` (формат `c_000001`).

### 4. Загрузка review.csv (анализ аномалий)

```bash
cd db
npm run load-reviews
```

Подробный отчёт: **[ANOMALIES.md](ANOMALIES.md)** — 37 аномалий с SQL-запросами и количеством записей.

### 5. Next.js

```bash
cd app
npm install
npm run dev
```

Если `npm install` тормозит на `registry.npmjs.org`:
```bash
npm install --registry https://registry.npmmirror.com
```

Откройте **http://localhost:3000/companies**

Параметры:
- `?q=` — поиск по названию (debounce 300 ms);
- `?city=` — фильтр по городу.

## Статистика загруженных данных

| Таблица     | Записей |
|-------------|---------|
| `companies` | **994** |
| `reviews`   | **205** |

Компании: 1000 записей в JSON → 994 уникальных (6 дублей по `(name, address)`).
Повторный `npm run load` — идемпотентен (0 вставок, 1000 обновлений).

## SQL-запросы

Файл: [`db/queries.sql`](db/queries.sql)

**Топ-5 категорий:**

| category              | company_count |
|-----------------------|---------------|
| IT-интегратор         | 94            |
| Оптовая торговля      | 79            |
| Рекламное агентство   | 76            |
| Строительная компания | 71            |
| Юридические услуги    | 63            |

Полные результаты Query 2 и Query 3 — в [`db/queries.sql`](db/queries.sql).

## Скриншоты

Папка [`screenshots/`](screenshots/):

- `01-all-companies.png` — все компании (первые 100)
- `02-search-mayak.png` — поиск «Маяк»
- `03-filter-moscow.png` — фильтр по городу «Москва»

## Проектирование схемы

**Почему без отдельных таблиц `categories` и `cities`:**

- категории и города — свободный текст без иерархии;
- ~1000 записей, нормализация не даёт выигрыша;
- индексы по `city` и `category` достаточны.

**Дедупликация:** upsert по `external_id` (основной ключ из JSON); fallback `(name, address)` если ID отсутствует.

## Секреты

- `DATABASE_URL` только в `.env` / `app/.env.local`
- в репозитории — `.env.example` без реальных секретов
