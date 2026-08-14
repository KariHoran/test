# Каталог компаний — тестовое задание

Монорепо: PostgreSQL + скрипты загрузки (`/db`) и Next.js-приложение (`/app`).

## Структура

```
/
├── db/                 # schema.sql, load.ts, load-reviews.ts, queries.sql
├── app/                # Next.js App Router (страница /companies)
├── data_pack/          # page_001.json … page_020.json, review.csv
├── screenshots/        # скриншоты UI
├── ANOMALIES.md        # аномалии в review.csv
├── docker-compose.yml
├── .env.example
└── README.md
```

## Требования

- Docker Desktop (PostgreSQL 16)
- Node.js 20+
- npm

## Быстрый старт

### 1. Переменные окружения

```bash
cp .env.example .env
cp .env.example app/.env.local
```

Файл `.env` уже в `.gitignore` — не коммитьте его.

### 2. PostgreSQL

```bash
docker compose up -d
```

Параметры: `user` / `password`, база `companies_db`, порт `5432`.

### 3. Схема и загрузка компаний

```bash
docker exec -i companies_postgres psql -U user -d companies_db < db/schema.sql

cd db
npm install
npm run load
```

Скрипт `load.ts`:
- читает `data_pack/page_*.json`;
- нормализует поля (`site` → `website`, телефон, рейтинг);
- делает upsert с дедупликацией по `(name, address)`;
- логирует статистику.

**Адаптация под реальные данные:** в JSON поле сайта называется `site`, а не `website`; ID хранится в `id` (формат `c_000001`). Отдельные таблицы `categories` / `cities` не созданы — см. обоснование ниже.

### 4. Загрузка review.csv (анализ аномалий)

```bash
cd db
npm run load-reviews
```

### 5. Next.js

```bash
cd app
npm install
npm run dev
```

Откройте [http://localhost:3000/companies](http://localhost:3000/companies).

Параметры:
- `?q=` — поиск по названию (debounce 300 ms на клиенте);
- `?city=` — фильтр по городу.

## SQL-запросы

Файл: [`db/queries.sql`](db/queries.sql)

Результаты (на данных после загрузки):

**Топ-5 категорий:**

| category              | company_count |
|-----------------------|---------------|
| IT-интегратор         | 94            |
| Оптовая торговля      | 79            |
| Рекламное агентство   | 76            |
| Строительная компания | 71            |
| Юридические услуги    | 63            |

**Средний рейтинг по городам (10+ отзывов)** — полная таблица в `queries.sql`.

**Доля компаний с сайтом по категориям** — полная таблица в `queries.sql`.

## Скриншоты

Папка [`screenshots/`](screenshots/):

- `01-all-companies.png` — все компании (первые 100)
- `02-search-mayak.png` — поиск «Маяк»
- `03-filter-moscow.png` — фильтр по городу «Москва»

## Аномалии

Подробный отчёт: [`ANOMALIES.md`](ANOMALIES.md)

## Проектирование схемы

**Почему без отдельных таблиц `categories` и `cities`:**

- категории и города — свободный текст без иерархии и доп. атрибутов;
- объём ~1000 записей, нормализация не даёт выигрыша;
- фильтрация через индексы по `city` и `category` достаточна.

**Дедупликация:** уникальный индекс `(name, address)` — естественный ключ для B2B-каталога; `external_id` также уникален, но при повторной загрузке без ID срабатывает `(name, address)`.

## Секреты

- `DATABASE_URL` только в `.env` / `app/.env.local`
- в репозитории — `.env.example` без реальных секретов
