export interface IcpCriteria {
  q?: string;
  city?: string;
  category?: string;
  minRating?: number;
  minReviews?: number;
  hasWebsite?: boolean;
  titles?: string[];
  decisionMakersOnly?: boolean;
}

export interface IcpProfile {
  id: number;
  name: string;
  criteria: IcpCriteria;
  created_at: Date;
}

export const LPR_TITLE_OPTIONS = [
  { value: "CEO", label: "CEO / Генеральный директор" },
  { value: "HR", label: "HR-директор" },
  { value: "Маркетинг", label: "Директор по маркетингу" },
  { value: "Продажи", label: "Менеджер по продажам" },
] as const;

export function icpCriteriaToSearchParams(criteria: IcpCriteria): string {
  const params = new URLSearchParams();
  if (criteria.q?.trim()) params.set("q", criteria.q.trim());
  if (criteria.city?.trim()) params.set("city", criteria.city.trim());
  if (criteria.category?.trim()) params.set("category", criteria.category.trim());
  if (criteria.minRating != null) params.set("minRating", String(criteria.minRating));
  if (criteria.minReviews != null) params.set("minReviews", String(criteria.minReviews));
  if (criteria.hasWebsite === true) params.set("hasWebsite", "true");
  if (criteria.hasWebsite === false) params.set("hasWebsite", "false");
  if (criteria.titles?.length) params.set("titles", criteria.titles.join(","));
  if (criteria.decisionMakersOnly) params.set("lprOnly", "true");
  return params.toString();
}

export function parseTitlesParam(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
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
