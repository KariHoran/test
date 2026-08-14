"use server";

import { redirect } from "next/navigation";
import { createIcpProfile, deleteIcpProfile } from "@/lib/icp";
import type { IcpCriteria } from "@/lib/icp-types";
import { icpCriteriaToSearchParams } from "@/lib/icp-types";

function parseCriteria(formData: FormData): IcpCriteria {
  const titles = formData.getAll("titles").map(String).filter(Boolean);
  const minRatingRaw = String(formData.get("minRating") ?? "");
  const minReviewsRaw = String(formData.get("minReviews") ?? "");
  const hasWebsiteRaw = String(formData.get("hasWebsite") ?? "");

  return {
    q: String(formData.get("q") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim() || undefined,
    category: String(formData.get("category") ?? "").trim() || undefined,
    minRating: minRatingRaw ? parseFloat(minRatingRaw) : undefined,
    minReviews: minReviewsRaw ? parseInt(minReviewsRaw, 10) : undefined,
    hasWebsite:
      hasWebsiteRaw === "true" ? true : hasWebsiteRaw === "false" ? false : undefined,
    titles: titles.length > 0 ? titles : undefined,
    decisionMakersOnly: formData.get("decisionMakersOnly") === "on",
  };
}

export async function createIcpAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Укажите название ICP");

  const criteria = parseCriteria(formData);
  const id = await createIcpProfile(name, criteria);
  redirect(`/icp/${id}`);
}

export async function deleteIcpAction(formData: FormData) {
  const id = parseInt(String(formData.get("id")), 10);
  if (!Number.isNaN(id)) await deleteIcpProfile(id);
  redirect("/icp");
}

export async function launchIcpSearchAction(formData: FormData) {
  const criteriaRaw = String(formData.get("criteria") ?? "{}");
  const criteria = JSON.parse(criteriaRaw) as IcpCriteria;
  const qs = icpCriteriaToSearchParams(criteria);
  redirect(qs ? `/companies?${qs}` : "/companies");
}
