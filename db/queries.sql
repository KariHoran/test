-- Query 1: Top 5 categories by number of companies
SELECT category, COUNT(*) AS company_count
FROM companies
WHERE category IS NOT NULL
GROUP BY category
ORDER BY company_count DESC
LIMIT 5;

-- Query 2: Average rating by city among companies with 10+ reviews
SELECT city, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS companies_count
FROM companies
WHERE reviews_count >= 10 AND rating IS NOT NULL AND city IS NOT NULL
GROUP BY city
ORDER BY avg_rating DESC;

-- Query 3: Share of companies with a website by category (percent)
SELECT
    category,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE website IS NOT NULL AND website <> '') AS with_website,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE website IS NOT NULL AND website <> '') / NULLIF(COUNT(*), 0),
        1
    ) AS website_pct
FROM companies
WHERE category IS NOT NULL
GROUP BY category
ORDER BY website_pct DESC;

-- Results (executed after load on 2026-08-14):
--
-- Query 1 — Top 5 categories:
-- | category              | company_count |
-- |-----------------------|---------------|
-- | IT-интегратор         |            94 |
-- | Оптовая торговля      |            79 |
-- | Рекламное агентство   |            76 |
-- | Строительная компания |            71 |
-- | Юридические услуги    |            63 |
--
-- Query 2 — Avg rating by city (10+ reviews):
-- | city                  | avg_rating | companies_count |
-- |-----------------------|------------|-----------------|
-- | Сочи                  |       4.46 |              13 |
-- | Пермь                 |       4.43 |              30 |
-- | Омск                  |       4.41 |              23 |
-- | Тюмень                |       4.35 |              23 |
-- | Уфа                   |       4.33 |              29 |
-- | Воронеж               |       4.33 |              26 |
-- | Ростов-на-Дону        |       4.32 |              34 |
-- | Нижний Новгород       |       4.31 |              51 |
-- | Екатеринбург          |       4.30 |              52 |
-- | Санкт-Петербург       |       4.30 |             107 |
-- | ... (20 cities total) |            |                 |
--
-- Query 3 — Website share by category (top 10 by pct):
-- | category              | total | with_website | website_pct |
-- |-----------------------|-------|--------------|-------------|
-- | Клининг               |    18 |           16 |        88.9 |
-- | Ресторан              |    41 |           35 |        85.4 |
-- | Юридические услуги    |    63 |           53 |        84.1 |
-- | Производство мебели   |    45 |           37 |        82.2 |
-- | Автосервис            |    44 |           36 |        81.8 |
-- | Логистика             |    43 |           35 |        81.4 |
-- | Бухгалтерские услуги  |    51 |           41 |        80.4 |
-- | Пекарня               |    25 |           20 |        80.0 |
-- | IT-интегратор         |    94 |           75 |        79.8 |
-- | Образовательный центр |    46 |           36 |        78.3 |
