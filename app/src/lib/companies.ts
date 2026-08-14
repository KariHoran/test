import { getPool } from "./db";
import { titleMatchesOption } from "./icp-types";

export interface Company {
  id: number;
  name: string;
  category: string | null;
  city: string | null;
  address: string | null;
  rating: number | null;
  reviews_count: number;
  website: string | null;
  phone: string | null;
}

export interface CompanySearchParams {
  q?: string;
  city?: string;
  category?: string;
  minRating?: number;
  minReviews?: number;
  hasWebsite?: boolean;
  titles?: string[];
  decisionMakersOnly?: boolean;
  page?: number;
  sort?: "name" | "rating" | "reviews_count";
  order?: "asc" | "desc";
}

export interface CompanySearchResult {
  companies: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const PAGE_SIZE = 25;

const SORT_COLUMNS: Record<string, string> = {
  name: "name",
  rating: "rating",
  reviews_count: "reviews_count",
};

const GENERIC_EMAIL_FILTER = `(ct.email IS NULL OR (
  ct.email NOT ILIKE 'info@%' AND ct.email NOT ILIKE 'sales@%' AND
  ct.email NOT ILIKE 'contact@%' AND ct.email NOT ILIKE 'office@%'
))`;

function buildContactExistsClause(titles?: string[], decisionMakersOnly?: boolean) {
  if (!titles?.length && !decisionMakersOnly) return null;

  const parts: string[] = ["ct.company_id = companies.id"];

  if (decisionMakersOnly) {
    parts.push("ct.is_decision_maker = true");
    parts.push(GENERIC_EMAIL_FILTER);
  }

  if (titles?.length) {
    const titlePatterns: Record<string, string[]> = {
      CEO: ["%ceo%", "%генеральн%"],
      HR: ["%hr%"],
      Маркетинг: ["%маркетинг%"],
      Продажи: ["%продаж%"],
    };

    const orClauses: string[] = [];
    for (const title of titles) {
      const patterns = titlePatterns[title] ?? [`%${title.toLowerCase()}%`];
      for (const pattern of patterns) {
        orClauses.push(`ct.title ILIKE '${pattern.replace(/'/g, "''")}'`);
      }
    }
    parts.push(`(${orClauses.join(" OR ")})`);
    if (!decisionMakersOnly) {
      parts.push(GENERIC_EMAIL_FILTER);
    }
  }

  return `EXISTS (SELECT 1 FROM contacts ct WHERE ${parts.join(" AND ")})`;
}

function buildWhereClause(params: CompanySearchParams) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.q?.trim()) {
    values.push(`%${params.q.trim()}%`);
    const idx = values.length;
    conditions.push(
      `(name ILIKE $${idx} OR category ILIKE $${idx} OR address ILIKE $${idx})`
    );
  }

  if (params.city?.trim()) {
    values.push(params.city.trim());
    conditions.push(`city = $${values.length}`);
  }

  if (params.category?.trim()) {
    values.push(params.category.trim());
    conditions.push(`category = $${values.length}`);
  }

  if (params.minRating != null && !Number.isNaN(params.minRating)) {
    values.push(params.minRating);
    conditions.push(`rating >= $${values.length}`);
  }

  if (params.minReviews != null && !Number.isNaN(params.minReviews)) {
    values.push(params.minReviews);
    conditions.push(`reviews_count >= $${values.length}`);
  }

  if (params.hasWebsite === true) {
    conditions.push(`website IS NOT NULL AND website <> ''`);
  } else if (params.hasWebsite === false) {
    conditions.push(`(website IS NULL OR website = '')`);
  }

  const contactClause = buildContactExistsClause(params.titles, params.decisionMakersOnly);
  if (contactClause) conditions.push(contactClause);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, values };
}

export async function searchCompanies(
  params: CompanySearchParams
): Promise<CompanySearchResult> {
  const pool = getPool();
  const page = Math.max(1, params.page ?? 1);
  const sortCol = SORT_COLUMNS[params.sort ?? "name"] ?? "name";
  const order = params.order === "desc" ? "DESC" : "ASC";
  const offset = (page - 1) * PAGE_SIZE;

  const { where, values } = buildWhereClause(params);

  const countQuery = `SELECT COUNT(*)::int AS total FROM companies ${where}`;
  const dataQuery = `SELECT id, name, category, city, address, rating, reviews_count, website, phone
     FROM companies
     ${where}
     ORDER BY ${sortCol} ${order} NULLS LAST, name ASC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: number }>(countQuery, values),
    pool.query<Company>(dataQuery, [...values, PAGE_SIZE, offset]),
  ]);

  const total = countResult.rows[0]?.total ?? 0;

  return {
    companies: dataResult.rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getCompanyById(id: number): Promise<Company | null> {
  const pool = getPool();
  const { rows } = await pool.query<Company>(
    `SELECT id, name, category, city, address, rating, reviews_count, website, phone
     FROM companies WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** @deprecated use searchCompanies */
export async function getCompanies(params: {
  q?: string;
  city?: string;
}): Promise<Company[]> {
  const result = await searchCompanies(params);
  return result.companies;
}

export async function getCities(): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ city: string }>(
    `SELECT DISTINCT city FROM companies WHERE city IS NOT NULL ORDER BY city`
  );
  return rows.map((r) => r.city);
}

export async function getCategories(): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ category: string }>(
    `SELECT DISTINCT category FROM companies WHERE category IS NOT NULL ORDER BY category`
  );
  return rows.map((r) => r.category);
}