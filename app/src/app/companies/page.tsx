import Link from "next/link";
import { Suspense } from "react";
import {
  getCategories,
  getCities,
  searchCompanies,
  type CompanySearchParams,
} from "@/lib/companies";
import { countContactsForCompanies } from "@/lib/contacts";
import { getTopCategoriesByCity } from "@/lib/stats";
import { parseListParam, parseTitlesParam } from "@/lib/icp-types";
import CompaniesFilters from "./CompaniesFilters";
import CompaniesTable from "./CompaniesTable";
import Pagination from "./Pagination";
import styles from "./companies.module.css";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    cities?: string;
    category?: string;
    categories?: string;
    minRating?: string;
    minReviews?: string;
    hasWebsite?: string;
    titles?: string;
    lprOnly?: string;
    validLprOnly?: string;
    page?: string;
    sort?: string;
    order?: string;
  }>;
}

function parseSearchParams(params: Awaited<PageProps["searchParams"]>): CompanySearchParams & {
  q: string;
  citiesList: string[];
  categoriesList: string[];
  titlesList: string[];
} {
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const minRating = params.minRating ? parseFloat(params.minRating) : undefined;
  const minReviews = params.minReviews ? parseInt(params.minReviews, 10) : undefined;
  const hasWebsite =
    params.hasWebsite === "true"
      ? true
      : params.hasWebsite === "false"
        ? false
        : undefined;
  const sort: CompanySearchParams["sort"] =
    params.sort === "rating" || params.sort === "reviews_count" ? params.sort : "name";
  const order: CompanySearchParams["order"] = params.order === "desc" ? "desc" : "asc";
  const titlesList = parseTitlesParam(params.titles);
  const citiesList = parseListParam(params.cities).length
    ? parseListParam(params.cities)
    : params.city
      ? [params.city]
      : [];
  const categoriesList = parseListParam(params.categories).length
    ? parseListParam(params.categories)
    : params.category
      ? [params.category]
      : [];

  return {
    q: params.q ?? "",
    cities: citiesList.length > 1 ? citiesList : undefined,
    city: citiesList.length === 1 ? citiesList[0] : undefined,
    categories: categoriesList.length > 1 ? categoriesList : undefined,
    category: categoriesList.length === 1 ? categoriesList[0] : undefined,
    minRating: minRating != null && !Number.isNaN(minRating) ? minRating : undefined,
    minReviews: minReviews != null && !Number.isNaN(minReviews) ? minReviews : undefined,
    hasWebsite,
    titles: titlesList.length > 0 ? titlesList : undefined,
    decisionMakersOnly: params.lprOnly === "true",
    validLprOnly: params.validLprOnly === "true",
    page,
    sort,
    order,
    citiesList,
    categoriesList,
    titlesList,
  };
}

function buildUrlParams(filters: ReturnType<typeof parseSearchParams>): Record<string, string> {
  const urlParams: Record<string, string> = {};
  if (filters.q) urlParams.q = filters.q;
  if (filters.citiesList.length === 1) urlParams.city = filters.citiesList[0];
  else if (filters.citiesList.length > 1) urlParams.cities = filters.citiesList.join(",");
  if (filters.categoriesList.length === 1) urlParams.category = filters.categoriesList[0];
  else if (filters.categoriesList.length > 1) urlParams.categories = filters.categoriesList.join(",");
  if (filters.minRating != null) urlParams.minRating = String(filters.minRating);
  if (filters.minReviews != null) urlParams.minReviews = String(filters.minReviews);
  if (filters.hasWebsite === true) urlParams.hasWebsite = "true";
  if (filters.hasWebsite === false) urlParams.hasWebsite = "false";
  if (filters.titlesList.length) urlParams.titles = filters.titlesList.join(",");
  if (filters.decisionMakersOnly) urlParams.lprOnly = "true";
  if (filters.validLprOnly) urlParams.validLprOnly = "true";
  if (filters.sort && filters.sort !== "name") urlParams.sort = filters.sort;
  if (filters.order && filters.order !== "asc") urlParams.order = filters.order;
  return urlParams;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseSearchParams(rawParams);
  const urlParams = buildUrlParams(filters);

  const [result, cities, categories] = await Promise.all([
    searchCompanies(filters),
    getCities(),
    getCategories(),
  ]);

  const cityForInsights = filters.citiesList[0] ?? filters.city;
  const topInCity = cityForInsights
    ? await getTopCategoriesByCity(cityForInsights, 5)
    : [];

  const { companies, total, page, totalPages } = result;
  const lprCountsMap = await countContactsForCompanies(companies.map((c) => c.id));
  const lprCounts = Object.fromEntries(lprCountsMap);

  const sort = filters.sort ?? "name";
  const order = filters.order ?? "asc";
  const searchQs = new URLSearchParams(urlParams).toString();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Каталог компаний</h1>
        <p>
          Найдено: <strong>{total}</strong>
          {total > 0 && (
            <>
              {" "}
              · показано {(page - 1) * result.pageSize + 1}–
              {Math.min(page * result.pageSize, total)}
            </>
          )}
          {" · "}
          <Link href="/stats" className={styles.headerLink}>
            Качество базы
          </Link>
          {" · "}
          <Link href="/export/review" className={styles.headerLink}>
            Экспорт
          </Link>
        </p>
      </header>

      {topInCity.length > 0 && (
        <section className={styles.insightsBox}>
          <h2 className={styles.insightsTitle}>Топ категорий в {cityForInsights}</h2>
          <ul className={styles.insightsList}>
            {topInCity.map((row) => (
              <li key={row.category}>
                <Link
                  href={`/companies?city=${encodeURIComponent(cityForInsights!)}&category=${encodeURIComponent(row.category)}`}
                >
                  {row.category}
                </Link>
                <span>{row.company_count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Suspense fallback={<div className={styles.filters}>Загрузка фильтров…</div>}>
        <CompaniesFilters
          cities={cities}
          categories={categories}
          initialQ={filters.q}
          initialCities={filters.citiesList}
          initialCategories={filters.categoriesList}
          initialMinRating={rawParams.minRating ?? ""}
          initialMinReviews={rawParams.minReviews ?? ""}
          initialHasWebsite={rawParams.hasWebsite ?? ""}
          initialTitles={filters.titlesList}
          initialLprOnly={filters.decisionMakersOnly ?? false}
          initialValidLprOnly={filters.validLprOnly ?? false}
          initialSort={sort}
          initialOrder={order}
        />
      </Suspense>

      <CompaniesTable
        companies={companies}
        lprCounts={lprCounts}
        searchQs={searchQs}
        filterParams={urlParams}
        totalFiltered={total}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        searchParams={urlParams}
      />
    </div>
  );
}
