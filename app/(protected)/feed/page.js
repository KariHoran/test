import { redirect } from "next/navigation";
import FeedClient from "@/components/FeedClient";
import { getSession } from "@/lib/auth.js";
import { getReelsByBloggerId } from "@/lib/reels.js";

export default async function FeedPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const reels = await getReelsByBloggerId(user.id);

  return <FeedClient initialReels={reels} />;
}
