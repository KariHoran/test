"use client";

import { formatDate, formatViews } from "@/lib/format.js";

export function StatusBadge({ status, errorMessage, compact = false }) {
  if (status === "error") {
    return (
      <span className="badge badge-coral" title={errorMessage || undefined}>
        {compact ? "⚠ Ошибка" : errorMessage ? `⚠ ${errorMessage.slice(0, 40)}${errorMessage.length > 40 ? "…" : ""}` : "⚠ Ошибка"}
      </span>
    );
  }

  const map = {
    ok: { cls: "badge-green", label: "✓ Обновлено" },
    updating: { cls: "badge-blue", label: "⟳ Загружаем…" },
  };
  const { cls, label } = map[status] || map.ok;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function getReelSlug(url) {
  return url.replace("https://www.instagram.com/reel/", "").replace("/", "") || "—";
}

export function ReelCardGrid({ reel, onRefresh, onDelete, compact = false }) {
  const isError = reel.status === "error";
  const isUpdating = reel.status === "updating";

  if (isUpdating) {
    return (
      <div className="reels-card">
        <div
          className="skeleton w-full"
          style={{ aspectRatio: "9/16", maxHeight: compact ? 180 : undefined }}
        />
        <div className="p-3 flex flex-col gap-2">
          <div className="skeleton h-3 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
          <p className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
            Подтягиваем данные…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`reels-card ${isError ? "reels-card-error" : ""}`}>
      <div
        className="relative bg-[var(--color-surface)]"
        style={{ aspectRatio: "9/16", maxHeight: compact ? 180 : undefined, overflow: "hidden" }}
      >
        {reel.cover_url && !isError ? (
          <img src={reel.cover_url} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <span className="text-3xl">{isError ? "⚠️" : "🎬"}</span>
            {isError && (
              <p className="text-xs leading-snug" style={{ color: "var(--color-text-muted)" }}>
                {reel.error_message || "Не удалось загрузить"}
              </p>
            )}
          </div>
        )}

        {reel.status === "ok" && (
          <div
            className="absolute bottom-0 left-0 right-0 p-3 pt-8"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.62), transparent)" }}
          >
            <span className="views-pill">👁 {formatViews(reel.views)}</span>
          </div>
        )}

        {!isError && (
          <div className="absolute top-2 right-2">
            <StatusBadge status={reel.status} compact />
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
            {formatDate(reel.published_at) || "—"}
          </p>
          {isError && <StatusBadge status="error" errorMessage={reel.error_message} compact />}
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
          обновлено {formatDate(reel.last_updated_at)}
        </p>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {isError && (
            <button type="button" className="btn-secondary text-xs" onClick={() => onRefresh?.(reel.id)}>
              ↻ Повторить
            </button>
          )}
          {reel.status === "ok" && (
            <button type="button" className="btn-ghost text-xs" onClick={() => onRefresh?.(reel.id)}>
              ↻ Обновить
            </button>
          )}
          <a
            href={reel.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs"
          >
            ↗ Открыть
          </a>
          {onDelete && (
            <button
              type="button"
              className="btn-ghost text-xs"
              style={{ color: "#c0392b" }}
              onClick={() => onDelete(reel.id)}
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
