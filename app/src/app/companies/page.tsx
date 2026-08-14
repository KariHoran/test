import { Suspense } from "react";
import { getCities, getCompanies } from "@/lib/companies";
import CompaniesFilters from "./CompaniesFilters";
import styles from "./companies.module.css";

interface PageProps {
  searchParams: Promise<{ q?: string; city?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const city = params.city ?? "";

  const [companies, cities] = await Promise.all([
    getCompanies({ q, city }),
    getCities(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Каталог компаний</h1>
        <p>
          Найдено: <strong>{companies.length}</strong>
          {companies.length === 100 ? " (показаны первые 100)" : ""}
        </p>
      </header>

      <Suspense fallback={<div className={styles.filters}>Загрузка фильтров…</div>}>
        <CompaniesFilters cities={cities} initialQ={q} initialCity={city} />
      </Suspense>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Город</th>
              <th>Адрес</th>
              <th>Рейтинг</th>
              <th>Отзывы</th>
              <th>Сайт</th>
              <th>Телефон</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Компании не найдены
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.category ?? "—"}</td>
                  <td>{c.city ?? "—"}</td>
                  <td>{c.address ?? "—"}</td>
                  <td>{c.rating ?? "—"}</td>
                  <td>{c.reviews_count}</td>
                  <td>
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noopener noreferrer">
                        {c.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{c.phone ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
