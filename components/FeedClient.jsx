"use client";

import { useState } from "react";
import AddReelsModal from "./AddReelsModal";
import { ReelCardGrid, StatusBadge, getReelSlug } from "./ReelCard";
import { formatDate, formatViews } from "@/lib/format.js";
import { createTempReel, submitNewReel } from "@/lib/reel-client.js";

export default function FeedClient({ initialReels }) {
  const [reels, setReels] = useState(initialReels);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showAdd, setShowAdd] = useState(false);

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
      prev.map((r) => (r.id === reelId ? { ...r, status: "updating", error_message: null } : r)),
    );

    const res = await fetch(`/api/reels/${reelId}`, { method: "PATCH" });
    const data = await res.json();

    if (data.reel) {
      setReels((prev) => prev.map((r) => (r.id === reelId ? data.reel : r)));
    }
  }

  async function handleDelete(reelId) {
    const res = await fetch(`/api/reels/${reelId}`, { method: "DELETE" });
    if (res.ok) {
      setReels((prev) => prev.filter((r) => r.id !== reelId));
    }
  }

  const filteredReels = reels
    .filter((reel) => !search || reel.instagram_url.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "views") return b.views - a.views;
      return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
    });

  return (
    <div className="page-shell flex flex-col gap-4 md:gap-5 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Лента роликов</h1>
          <p className="page-subtitle">Все ваши Reels в одном месте</p>
        </div>
        <button type="button" className="btn-primary self-start sm:self-auto" onClick={() => setShowAdd(true)}>
          <span aria-hidden>＋</span> Добавить Reels
        </button>
      </div>

      <div className="card p-3 md:p-4 flex flex-wrap gap-3 items-center">
        <input
          className="input-field flex-1 min-w-[140px]"
          style={{ maxWidth: 320 }}
          placeholder="🔍 Поиск по ссылке…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-field w-auto min-w-[140px]"
          style={{ cursor: "pointer" }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">По дате</option>
          <option value="views">По просмотрам</option>
        </select>
        <div className="segment-control ml-auto w-full sm:w-auto justify-center sm:justify-start">
          <button
            type="button"
            className={`tab-btn ${view === "grid" ? "active" : ""}`}
            onClick={() => setView("grid")}
          >
            ⊞ Лента
          </button>
          <button
            type="button"
            className={`tab-btn ${view === "table" ? "active" : ""}`}
            onClick={() => setView("table")}
          >
            ≡ Таблица
          </button>
        </div>
      </div>

      {filteredReels.length === 0 && (
        <div className="card p-12 md:p-16 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">🎬</div>
          <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {search ? "Ничего не найдено" : "Пока нет роликов"}
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {search ? "Попробуйте другой запрос" : "Добавьте первый Reels по ссылке"}
          </p>
          {!search && (
            <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
              <span aria-hidden>＋</span> Добавить Reels
            </button>
          )}
        </div>
      )}

      {view === "grid" && filteredReels.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredReels.map((reel) => (
            <ReelCardGrid
              key={reel.id}
              reel={reel}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {view === "table" && filteredReels.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Ролик", "Дата", "Просмотры", "Статус", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold py-3 px-4"
                      style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReels.map((reel, i) => (
                  <tr
                    key={reel.id}
                    className="table-row-hover"
                    style={{
                      borderBottom:
                        i < filteredReels.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="relative flex-shrink-0 overflow-hidden rounded-xl"
                          style={{
                            width: 40,
                            height: 68,
                            background: "var(--color-border)",
                          }}
                        >
                          {reel.status === "updating" ? (
                            <div className="skeleton w-full h-full rounded-none" />
                          ) : reel.cover_url ? (
                            <img src={reel.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-xs"
                              style={{ background: "var(--color-surface)" }}
                            >
                              🎬
                            </div>
                          )}
                        </div>
                        <span
                          className="text-xs truncate max-w-[140px] sm:max-w-[180px]"
                          style={{ color: "var(--color-text-muted)" }}
                          title={getReelSlug(reel.instagram_url)}
                        >
                          {getReelSlug(reel.instagram_url)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                      {formatDate(reel.published_at) || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>
                        {reel.status === "updating" ? "—" : formatViews(reel.views)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={reel.status} errorMessage={reel.error_message} compact />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {(reel.status === "error" || reel.status === "ok") && (
                          <button
                            type="button"
                            className="btn-ghost text-xs"
                            onClick={() => handleRefresh(reel.id)}
                            title={reel.status === "error" ? "Повторить" : "Обновить"}
                          >
                            ↻
                          </button>
                        )}
                        <a
                          href={reel.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost text-xs"
                        >
                          ↗
                        </a>
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          style={{ color: "#c0392b" }}
                          onClick={() => handleDelete(reel.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddReelsModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleAddReel} />
    </div>
  );
}
