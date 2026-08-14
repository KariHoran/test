import { NextRequest, NextResponse } from "next/server";
import { getCompanyIdsBySearch, type CompanySearchParams } from "@/lib/companies";
import { parseListParam, parseTitlesParam } from "@/lib/icp-types";

function parseSearchFromRequest(sp: URLSearchParams): CompanySearchParams {
  const minRating = sp.get("minRating") ? parseFloat(sp.get("minRating")!) : undefined;
  const minReviews = sp.get("minReviews") ? parseInt(sp.get("minReviews")!, 10) : undefined;
  const hasWebsiteRaw = sp.get("hasWebsite");
  const cities = parseListParam(sp.get("cities") ?? undefined);
  const categories = parseListParam(sp.get("categories") ?? undefined);
  const city = sp.get("city") ?? undefined;
  const category = sp.get("category") ?? undefined;

  return {
    q: sp.get("q") ?? undefined,
    city: city || undefined,
    cities: cities.length ? cities : undefined,
    category: category || undefined,
    categories: categories.length ? categories : undefined,
    minRating: minRating != null && !Number.isNaN(minRating) ? minRating : undefined,
    minReviews: minReviews != null && !Number.isNaN(minReviews) ? minReviews : undefined,
    hasWebsite:
      hasWebsiteRaw === "true" ? true : hasWebsiteRaw === "false" ? false : undefined,
    titles: parseTitlesParam(sp.get("titles") ?? undefined),
    decisionMakersOnly: sp.get("lprOnly") === "true",
    validLprOnly: sp.get("validLprOnly") === "true",
  };
}

export async function GET(request: NextRequest) {
  const params = parseSearchFromRequest(request.nextUrl.searchParams);
  const ids = await getCompanyIdsBySearch(params);
  return NextResponse.json({ ids, count: ids.length });
}
