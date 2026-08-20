"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import AddReelsModal from "./AddReelsModal";
import MetricCard from "./MetricCard";
import { ReelCardGrid } from "./ReelCard";
import UserAvatar from "./UserAvatar";
import {
  calculatePeriodGrowth,
  DASHBOARD_PERIODS,
  filterReelsByPeriod,
} from "@/lib/chart-data.js";
import { formatViews } from "@/lib/format.js";
import { createTempReel, submitNewReel } from "@/lib/reel-client.js";

const ViewsChart = dynamic(() => import("./ViewsChart"), { ssr: false });

function recalcStats(reels) {
  const okReels = reels.filter((r) => r.status === "ok");
  const totalViews = okReels.reduce((sum, r) => sum + r.views, 0);

  return {
    reel_count: okReels.length,
    total_views: totalViews,
    avg_views: okReels.length ? Math.round(totalViews / okReels.length) : 0,
    max_views: okReels.length ? Math.max(...okReels.map((r) => r.views)) : 0,
  };
}

export default function DashboardClient({ user, initialStats, initialReels }) {
  const [reels, setReels] = useState(initialReels);
  const [period, setPeriod] = useState("month");
  const [showAdd, setShowAdd] = useState(false);
  const firstName = user.name.split(" ")[0];

  const filteredReels = useMemo(
    () => filterReelsByPeriod(reels, period),
    [reels, period],
  );
  const stats = useMemo(() => recalcStats(filteredReels), [filteredReels]);
  const periodGrowth = useMemo(
    () => calculatePeriodGrowth(filteredReels),
    [filteredReels],
  );
  const recentReels = useMemo(() => filteredReels.slice(0, 3), [filteredReels]);

  async function handleAddReel(instagramUrl) {
    const tempReel = createTempReel(instagramUrl);
    setReels((prev) => [tempReel, ...prev]);

    try {
      const { reel } = await submitNewReel(instagramUrl);
      setReels((prev) => [reel, ...prev.filter((r) => r.id !== tempReel.id)]);
    } catch (error) {
      setReels((prev) => prev.filter((r) => r.id !== tempReel.id));
      throw error;
    }
  }

  async function handleRefresh(reelId) {
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, status: "updating", error_message: null } : r,
      ),
    );

    const res = await fetch(`/api/reels/${reelId}`, { method: "PATCH" });
    const data = await res.json();

    if (data.reel) {
      setReels((prev) => prev.map((r) => (r.id === reelId ? data.reel : r)));
    }
  }

  return (
    <div className="page-shell flex flex-col gap-5 md:gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size={56} rounded="2xl" className="shadow-sm" />
          <div>
            <h1 className="page-title">Привет, {firstName} 👋</h1>
            <p className="page-subtitle">@{user.instagram_username}</p>
          </div>
        </div>
        <div className="segment-control self-start sm:self-auto">
          {DASHBOARD_PERIODS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`tab-btn ${period === id ? "active" : ""}`}
              onClick={() => setPeriod(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          label="Суммарные просмотры"
          value={stats.total_views ? formatViews(stats.total_views) : "—"}
          icon="👁"
          change={periodGrowth}
          color="blue"
        />
        <MetricCard label="Роликов добавлено" value={String(stats.reel_count)} icon="🎬" color="mint" />
        <MetricCard
          label="Средние просмотры"
          value={stats.avg_views ? formatViews(Math.round(stats.avg_views)) : "—"}
          icon="📊"
          change={periodGrowth}
          color="coral"
        />
        <MetricCard
          label="Лучший ролик"
          value={stats.max_views ? formatViews(stats.max_views) : "—"}
          icon="🏆"
          color="purple"
        />
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Динамика просмотров
          </h2>
          {periodGrowth != null && (
            <span className="badge badge-blue self-start">
              📈 {periodGrowth >= 0 ? "+" : ""}
              {periodGrowth}% за период
            </span>
          )}
        </div>
        <ViewsChart reels={filteredReels} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Последние ролики
        </h2>
        <button type="button" className="btn-primary self-start sm:self-auto" onClick={() => setShowAdd(true)}>
          <span aria-hidden>＋</span> Добавить Reels
        </button>
      </div>

      {recentReels.length === 0 ? (
        <div className="card p-10 md:p-12 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">🎬</div>
          <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {reels.length === 0
              ? "Пока нет роликов"
              : period === "all"
                ? "Пока нет роликов"
                : "Нет роликов за выбранный период"}
          </p>
          <p className="text-sm max-w-sm" style={{ color: "var(--color-text-muted)" }}>
            {reels.length === 0 || period === "all"
              ? "Добавьте первый Reels и начните отслеживать просмотры"
              : "Попробуйте выбрать более длинный период или добавьте новый Reels"}
          </p>
          {(reels.length === 0 || period === "all") && (
            <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
              <span aria-hidden>＋</span> Добавить первый Reels
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {recentReels.map((reel) => (
            <ReelCardGrid key={reel.id} reel={reel} compact onRefresh={handleRefresh} />
          ))}
        </div>
      )}

      <AddReelsModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleAddReel} />
    </div>
  );
}
