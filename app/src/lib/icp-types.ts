export interface IcpCriteria {
  q?: string;
  city?: string;
  cities?: string[];
  category?: string;
  categories?: string[];
  minRating?: number;
  minReviews?: number;
  hasWebsite?: boolean;
  titles?: string[];
  decisionMakersOnly?: boolean;
  validLprOnly?: boolean;
  activeOnly?: boolean;
}

export interface IcpProfile {
  id: number;
  name: string;
  criteria: IcpCriteria;
  created_at: Date;
}

export interface IcpPreviewCounts {
  companies: number;
  contacts: number;
}

export const LPR_TITLE_OPTIONS = [
  { value: "CEO", label: "CEO / Генеральный директор" },
  { value: "HR", label: "HR-директор" },
  { value: "Маркетинг", label: "Директор по маркетингу" },
  { value: "Продажи", label: "Менеджер по продажам" },
] as const;

export function parseListParam(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

export function parseTitlesParam(raw?: string): string[] {
  return parseListParam(raw);
}

export function icpCriteriaToSearchParams(criteria: IcpCriteria): string {
  const params = new URLSearchParams();
  if (criteria.q?.trim()) params.set("q", criteria.q.trim());

  const cities = criteria.cities?.length
    ? criteria.cities
    : criteria.city?.trim()
      ? [criteria.city.trim()]
      : [];
  if (cities.length === 1) params.set("city", cities[0]);
  else if (cities.length > 1) params.set("cities", cities.join(","));

  const categories = criteria.categories?.length
    ? criteria.categories
    : criteria.category?.trim()
      ? [criteria.category.trim()]
      : [];
  if (categories.length === 1) params.set("category", categories[0]);
  else if (categories.length > 1) params.set("categories", categories.join(","));

  if (criteria.minRating != null) params.set("minRating", String(criteria.minRating));
  const minReviews = criteria.activeOnly ? Math.max(criteria.minReviews ?? 0, 10) : criteria.minReviews;
  if (minReviews != null) params.set("minReviews", String(minReviews));
  if (criteria.hasWebsite === true) params.set("hasWebsite", "true");
  if (criteria.hasWebsite === false) params.set("hasWebsite", "false");
  if (criteria.titles?.length) params.set("titles", criteria.titles.join(","));
  if (criteria.decisionMakersOnly) params.set("lprOnly", "true");
  if (criteria.validLprOnly) params.set("validLprOnly", "true");
  return params.toString();
}

export function titleMatchesOption(contactTitle: string, option: string): boolean {
  const t = contactTitle.toLowerCase();
  switch (option) {
    case "CEO":
      return t.includes("ceo") || t.includes("генеральн");
    case "HR":
      return t.includes("hr");
    case "Маркетинг":
      return t.includes("маркетинг");
    case "Продажи":
      return t.includes("продаж");
    default:
      return t.includes(option.toLowerCase());
  }
}

export function normalizeIcpCriteria(criteria: IcpCriteria): IcpCriteria {
  const cities = criteria.cities?.length
    ? criteria.cities
    : criteria.city
      ? [criteria.city]
      : undefined;
  const categories = criteria.categories?.length
    ? criteria.categories
    : criteria.category
      ? [criteria.category]
      : undefined;

  return {
    ...criteria,
    cities,
    categories,
    city: cities?.length === 1 ? cities[0] : undefined,
    category: categories?.length === 1 ? categories[0] : undefined,
    minReviews: criteria.activeOnly ? Math.max(criteria.minReviews ?? 0, 10) : criteria.minReviews,
  };
}
