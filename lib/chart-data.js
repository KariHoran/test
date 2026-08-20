/**
 * Подготовка данных для графика «Динамика просмотров».
 *
 * Стратегия: группируем ok-ролики по дню публикации (YYYY-MM-DD),
 * суммируем views за день, затем строим накопительную сумму по оси Y.
 * Так видно, как растёт суммарный охват портфеля во времени — осмысленнее,
 * чем отдельные «зубцы» по каждому ролику при нескольких публикациях в один день.
 */

function dayKey(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

export function buildViewsChartData(reels) {
  const okReels = reels.filter((r) => r.status === "ok" && r.published_at);

  if (okReels.length < 2) {
    return { points: [], hasChart: false };
  }

  const byDay = new Map();

  for (const reel of okReels) {
    const key = dayKey(reel.published_at);
    const prev = byDay.get(key) || { dateKey: key, views: 0, reelCount: 0 };
    prev.views += reel.views;
    prev.reelCount += 1;
    byDay.set(key, prev);
  }

  const sorted = [...byDay.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  let cumulative = 0;
  const points = sorted.map((day) => {
    cumulative += day.views;
    return {
      dateKey: day.dateKey,
      dateLabel: day.dateKey,
      views: day.views,
      reelCount: day.reelCount,
      cumulative,
    };
  });

  return {
    points,
    hasChart: points.length >= 2,
  };
}

/**
 * Рост за период: сравниваем сумму просмотров первой и второй половины
 * хронологически отсортированных роликов.
 */
export function calculatePeriodGrowth(reels) {
  const okReels = reels
    .filter((r) => r.status === "ok" && r.published_at)
    .sort((a, b) => new Date(a.published_at) - new Date(b.published_at));

  if (okReels.length < 2) return null;

  const mid = Math.ceil(okReels.length / 2);
  const firstHalf = okReels.slice(0, mid).reduce((sum, r) => sum + r.views, 0);
  const secondHalf = okReels.slice(mid).reduce((sum, r) => sum + r.views, 0);

  if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;

  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
}
