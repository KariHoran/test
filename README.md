# DealRocket — каталог компаний и аутрич

Монорепо: PostgreSQL + скрипты загрузки (`/db`) и Next.js-приложение (`/app`).

Платформа для поиска компаний по ICP-критериям, сбора контактов ЛПР, валидации и экспорта в CSV — по workflow DealRocket.

## Возможности

| Модуль | Описание |
|--------|----------|
| **Каталог** | Поиск по ключевым словам, фильтры (город, категория, рейтинг, отзывы, сайт), пагинация, сортировка |
| **ICP-профили** | Сохранение критериев идеального клиента, запуск поиска одной кнопкой |
| **Контакты ЛПР** | CEO, HR, маркетинг, продажи; исключение info@ / sales@ |
| **Валидация** | Автопроверка email и телефонов (`valid` / `invalid` / `unknown`) |
| **Экспорт** | Предпросмотр выборки → скачивание CSV для CRM |

## Структура

```
/
├── db/                 # schema.sql, load.ts, seed-contacts.ts, validate.ts
├── app/                # Next.js App Router
├── data_pack/          # page_001.json … page_020.json, review.csv
├── screenshots/        # скриншоты UI
├── scripts/            # capture-screenshots.js (Playwright)
├── ANOMALIES.md        # аномалии в review.csv (37 пунктов)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Маршруты приложения

| URL | Описание |
|-----|----------|
| `/` | Главная |
| `/companies` | Каталог с фильтрами и выбором для экспорта |
| `/companies/[id]` | Карточка компании + контакты ЛПР |
| `/icp` | Список ICP-профилей |
| `/icp/new` | Создание ICP |
| `/icp/[id]` | Детали ICP + «Запустить поиск» |
| `/export/review` | Предпросмотр и скачивание CSV |
| `/api/export?ids=…` | API экспорта CSV |

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
npm run seed-contacts
npm run validate
Set-Location ..

Set-Location app
npm install --registry https://registry.npmmirror.com   # если registry.npmjs.org тормозит
npm run dev
```

Приложение: **http://localhost:3000**

### Workflow DealRocket

1. **ICP** — `/icp/new`: задайте город, категорию, ключевые слова, должности ЛПР
2. **Поиск** — «Запустить поиск» → каталог с фильтрами
3. **Проверка** — выберите компании чекбоксами → «Предпросмотр экспорта»
4. **Экспорт** — исключите лишние контакты, включите «Только валидные email» → «Скачать CSV»

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

### 3. Схема и загрузка данных

**Linux / macOS / Git Bash:**
```bash
docker exec -i companies_postgres psql -U user -d companies_db < db/schema.sql
```

**Windows PowerShell:**
```powershell
Get-Content db\schema.sql | docker exec -i companies_postgres psql -U user -d companies_db
```

```bash
cd db
npm install
npm run load          # компании из JSON
npm run load-reviews  # review.csv для анализа аномалий
npm run seed-contacts # мок-контакты ЛПР (~2 на компанию)
npm run validate      # проверка email/телефонов, статусы в БД
```

**Скрипт `load.ts`:**
- читает `data_pack/page_*.json`;
- нормализует поля (`site` → `website`, телефон, рейтинг);
- идемпотентный upsert: `ON CONFLICT (external_id) DO UPDATE`.

**Скрипт `seed-contacts.ts`:**
- генерирует контакты ЛПР (CEO, HR, маркетинг, продажи) для каждой компании;
- ~20% записей — «мусорные» info@ / sales@ для демонстрации фильтрации.

**Скрипт `validate.ts`:**
- regex-проверка email, формат телефона;
- обновляет `email_status`, `phone_status` у контактов и компаний.

### 4. Next.js

```bash
cd app
npm install
npm run dev
```

Параметры каталога (`/companies`):
- `?q=` — ключевые слова (название, категория, адрес);
- `?city=` — город;
- `?category=` — индустрия;
- `?minRating=` / `?minReviews=` — пороги;
- `?hasWebsite=true|false` — наличие сайта;
- `?titles=CEO,HR,Маркетинг` — должности ЛПР;
- `?lprOnly=true` — только компании с прямыми ЛПР;
- `?page=` / `?sort=` / `?order=` — пагинация и сортировка.

### 5. Скриншоты

```bash
# dev-сервер должен быть запущен на :3000
node scripts/capture-screenshots.js
```

## Статистика данных

| Таблица       | Записей |
|---------------|---------|
| `companies`   | **994** |
| `contacts`    | **~1978** (после seed-contacts) |
| `icp_profiles`| по мере создания |
| `reviews`     | **205** |

После `npm run validate`: ~1775 valid email, ~203 invalid (info@, sales@ и т.п.).

## Схема БД

**`companies`** — каталог компаний (994 записи)

**`contacts`** — контакты ЛПР:
- `first_name`, `last_name`, `title`, `email`, `phone`
- `is_decision_maker`, `email_status`, `phone_status`

**`icp_profiles`** — сохранённые ICP:
- `name`, `criteria` (JSONB: город, категория, keywords, titles, …)

**`reviews`** — сырой review.csv для анализа аномалий ([ANOMALIES.md](ANOMALIES.md))

## SQL-запросы

Файл: [`db/queries.sql`](db/queries.sql)

## Скриншоты

Папка [`screenshots/`](screenshots/):

- `01-all-companies.png` — каталог компаний
- `02-search-avrora.png` — поиск «Аврора»
- `03-filter-moscow.png` — фильтр по городу «Москва»
- `04-icp-new.png` — создание ICP-профиля
- `05-company-contacts.png` — карточка компании с контактами ЛПР
- `06-export-review.png` — предпросмотр экспорта CSV

## Проектирование

**Плоская схема** — категории и города без нормализации (~1000 записей, индексы достаточны).

**Мок-контакты** — в реальном DealRocket данные обогащаются API; здесь генерация из домена сайта компании.

**Валидация** — rule-based (regex); в продакшене — ZeroBounce, Twilio Lookup.

## Секреты

- `DATABASE_URL` только в `.env` / `app/.env.local`
- в репозитории — `.env.example` без реальных секретов
