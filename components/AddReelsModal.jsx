"use client";

import { useState } from "react";

export default function AddReelsModal({ open, onClose, onSubmit }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit(url.trim());
      setUrl("");
      onClose();
    } catch (err) {
      setError(err.message || "Не удалось добавить Reels");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay-modal" onClick={onClose}>
      <div className="card p-6 md:p-7 w-full max-w-md rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Добавить Reels
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
          Вставьте ссылку на Reels — мы подтянем просмотры, дату и обложку через Apify
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm"
            style={{ background: "var(--color-coral-light)", color: "#c0392b" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Ссылка на Reels
            </label>
            <input
              className="input-field"
              type="url"
              placeholder="https://www.instagram.com/reel/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Подтягиваем данные…
                </span>
              ) : (
                "Добавить →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
