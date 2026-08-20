import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";
import { getSession } from "@/lib/auth.js";
import { getBloggerStats, getReelsByBloggerId } from "@/lib/reels.js";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const stats = await getBloggerStats(user.id);
  const reels = await getReelsByBloggerId(user.id);

  return <DashboardClient user={user} initialStats={stats} initialReels={reels} />;
}
