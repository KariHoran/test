import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth.js";
import { formatViews } from "@/lib/format.js";
import { getAdminSummary, getBloggerRankings, getTopReels } from "@/lib/reels.js";

const COLORS = ["#5B5BD6", "#FF7B7B", "#34C89A", "#9B59B6"];

const DEMO_AVATARS = {
  "anna.lifestyle": "https://i.pravatar.cc/150?img=5",
  "masha.travel": "https://i.pravatar.cc/150?img=9",
  "agency.admin": "https://i.pravatar.cc/150?img=3",
};

function getAvatar(username) {
  return DEMO_AVATARS[username] || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
}

export default async function AnalyticsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const summary = await getAdminSummary();
  const rankings = await getBloggerRankings();
  const topReels = await getTopReels(5);
  const maxViews = rankings.length ? Math.max(...rankings.map((b) => b.total_views), 1) : 1;

  const summaryCards = [
    { label: "Всего блогеров", value: String(summary.blogger_count), icon: "👤" },
    { label: "Всего роликов", value: String(summary.reel_count), icon: "🎬" },
    { label: "Суммарные просмотры", value: formatViews(summary.total_views), icon: "👁" },
    {
      label: "Средние просмотры / ролик",
      value:
        summary.reel_count > 0
          ? formatViews(Math.round(summary.total_views / summary.reel_count))
          : "—",
      icon: "📈",
    },
  ];

  return (
    <div className="page-shell flex flex-col gap-5 md:gap-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="page-title">Общая аналитика</h1>
        <p className="page-subtitle">Сводка по всем блогерам агентства</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="metric-card blue">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="metric-value">{item.value}</p>
              <p className="metric-label">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <div className="card p-5 md:p-6">
          <h2 className="text-lg font-bold mb-5" style={{ fontFamily: "var(--font-display)" }}>
            📊 Рейтинг блогеров
          </h2>
          {rankings.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Пока нет данных
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {rankings.map((b, i) => (
                <div key={b.id} className="ranking-row">
                  <img
                    src={getAvatar(b.instagram_username)}
                    alt={b.name}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                  />
                  <div className="min-w-0 flex-shrink-0 w-[88px] sm:w-[100px]">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ fontFamily: "var(--font-display)" }}
                      title={b.name}
                    >
                      {b.name.split(" ")[0]}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--color-text-muted)" }}
                      title={`@${b.instagram_username}`}
                    >
                      @{b.instagram_username}
                    </p>
                  </div>
                  <div className="ranking-bar-track">
                    <div
                      className="ranking-bar-fill"
                      style={{
                        width: `${(b.total_views / maxViews) * 100}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-bold flex-shrink-0 w-14 text-right"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {formatViews(b.total_views)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 md:p-6">
          <h2 className="text-lg font-bold mb-5" style={{ fontFamily: "var(--font-display)" }}>
            🏆 Топ-5 роликов
          </h2>
          {topReels.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Пока нет роликов
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topReels.map((reel, i) => (
                <div key={reel.id} className="flex items-center gap-3 p-2 rounded-2xl ranking-row">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="w-10 h-[68px] rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "var(--color-border)" }}
                  >
                    {reel.cover_url ? (
                      <img src={reel.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm">🎬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>
                      @{reel.instagram_username}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      {formatViews(reel.views)} просмотров
                    </p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ fontFamily: "var(--font-display)" }}>
                    {formatViews(reel.views)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
