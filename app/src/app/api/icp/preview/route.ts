import { NextRequest, NextResponse } from "next/server";
import { countCompaniesAndContacts, type CompanySearchParams } from "@/lib/companies";
import { parseListParam, parseTitlesParam, type IcpCriteria } from "@/lib/icp-types";

function criteriaFromRequest(sp: URLSearchParams): CompanySearchParams {
  const minRating = sp.get("minRating") ? parseFloat(sp.get("minRating")!) : undefined;
  const minReviews = sp.get("minReviews") ? parseInt(sp.get("minReviews")!, 10) : undefined;
  const hasWebsiteRaw = sp.get("hasWebsite");
  const cities = parseListParam(sp.get("cities") ?? undefined);
  const categories = parseListParam(sp.get("categories") ?? undefined);
  const city = sp.get("city") ?? undefined;
  const category = sp.get("category") ?? undefined;
  const activeOnly = sp.get("activeOnly") === "true";

  return {
    q: sp.get("q") ?? undefined,
    city: city || undefined,
    cities: cities.length ? cities : undefined,
    category: category || undefined,
    categories: categories.length ? categories : undefined,
    minRating: minRating != null && !Number.isNaN(minRating) ? minRating : undefined,
    minReviews:
      activeOnly
        ? Math.max(minReviews != null && !Number.isNaN(minReviews) ? minReviews : 0, 10)
        : minReviews != null && !Number.isNaN(minReviews)
          ? minReviews
          : undefined,
    hasWebsite:
      hasWebsiteRaw === "true" ? true : hasWebsiteRaw === "false" ? false : undefined,
    titles: parseTitlesParam(sp.get("titles") ?? undefined),
    decisionMakersOnly: sp.get("decisionMakersOnly") === "true" || sp.get("lprOnly") === "true",
    validLprOnly: sp.get("validLprOnly") === "true",
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  if (sp.get("criteria")) {
    try {
      const criteria = JSON.parse(sp.get("criteria")!) as IcpCriteria;
      const counts = await countCompaniesAndContacts({
        q: criteria.q,
        cities: criteria.cities?.length ? criteria.cities : criteria.city ? [criteria.city] : undefined,
        categories: criteria.categories?.length
          ? criteria.categories
          : criteria.category
            ? [criteria.category]
            : undefined,
        minRating: criteria.minRating,
        minReviews: criteria.activeOnly
          ? Math.max(criteria.minReviews ?? 0, 10)
          : criteria.minReviews,
        hasWebsite: criteria.hasWebsite,
        titles: criteria.titles,
        decisionMakersOnly: criteria.decisionMakersOnly,
        validLprOnly: criteria.validLprOnly,
      });
      return NextResponse.json(counts);
    } catch {
      return NextResponse.json({ error: "invalid criteria JSON" }, { status: 400 });
    }
  }

  const params = criteriaFromRequest(sp);
  const counts = await countCompaniesAndContacts(params);
  return NextResponse.json(counts);
}
