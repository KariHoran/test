import Link from "next/link";
import { Suspense } from "react";
import {
  getCategories,
  getCities,
  searchCompanies,
  type CompanySearchParams,
} from "@/lib/companies";
import { countContactsForCompanies } from "@/lib/contacts";
import { parseTitlesParam } from "@/lib/icp-types";
import CompaniesFilters from "./CompaniesFilters";
import CompaniesTable from "./CompaniesTable";
import Pagination from "./Pagination";
import styles from "./companies.module.css";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    category?: string;
    minRating?: string;
    minReviews?: string;
    hasWebsite?: string;
    titles?: string;
    lprOnly?: string;
    page?: string;
    sort?: string;
    order?: string;
  }>;
}

function parseSearchParams(params: Awaited<PageProps["searchParams"]>): CompanySearchParams & {
  q: string;
  city: string;
  category: string;
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

  return {
    q: params.q ?? "",
    city: params.city ?? "",
    category: params.category ?? "",
    minRating: minRating != null && !Number.isNaN(minRating) ? minRating : undefined,
    minReviews: minReviews != null && !Number.isNaN(minReviews) ? minReviews : undefined,
    hasWebsite,
    titles: titlesList.length > 0 ? titlesList : undefined,
    decisionMakersOnly: params.lprOnly === "true",
    page,
    sort,
    order,
    titlesList,
  };
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseSearchParams(rawParams);

  const [result, cities, categories] = await Promise.all([
    searchCompanies(filters),
    getCities(),
    getCategories(),
  ]);

  const { companies, total, page, totalPages } = result;
  const lprCountsMap = await countContactsForCompanies(companies.map((c) => c.id));
  const lprCounts = Object.fromEntries(lprCountsMap);

  const sort = filters.sort ?? "name";
  const order = filters.order ?? "asc";

  const urlParams: Record<string, string> = {};
  if (filters.q) urlParams.q = filters.q;
  if (filters.city) urlParams.city = filters.city;
  if (filters.category) urlParams.category = filters.category;
  if (filters.minRating != null) urlParams.minRating = String(filters.minRating);
  if (filters.minReviews != null) urlParams.minReviews = String(filters.minReviews);
  if (filters.hasWebsite === true) urlParams.hasWebsite = "true";
  if (filters.hasWebsite === false) urlParams.hasWebsite = "false";
  if (filters.titlesList.length) urlParams.titles = filters.titlesList.join(",");
  if (filters.decisionMakersOnly) urlParams.lprOnly = "true";
  if (sort !== "name") urlParams.sort = sort;
  if (order !== "asc") urlParams.order = order;

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
          <Link href="/export/review" className={styles.headerLink}>
            Экспорт
          </Link>
        </p>
      </header>

      <Suspense fallback={<div className={styles.filters}>Загрузка фильтров…</div>}>
        <CompaniesFilters
          cities={cities}
          categories={categories}
          initialQ={filters.q}
          initialCity={filters.city}
          initialCategory={filters.category}
          initialMinRating={rawParams.minRating ?? ""}
          initialMinReviews={rawParams.minReviews ?? ""}
          initialHasWebsite={rawParams.hasWebsite ?? ""}
          initialTitles={filters.titlesList}
          initialLprOnly={filters.decisionMakersOnly ?? false}
          initialSort={sort}
          initialOrder={order}
        />
      </Suspense>

      <CompaniesTable companies={companies} lprCounts={lprCounts} searchQs={searchQs} />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        searchParams={urlParams}
      />
    </div>
  );
}
