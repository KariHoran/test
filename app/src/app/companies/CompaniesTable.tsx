"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Company } from "@/lib/companies";
import styles from "./companies.module.css";

interface Props {
  companies: Company[];
  lprCounts: Record<number, number>;
  searchQs: string;
  filterParams: Record<string, string>;
  totalFiltered: number;
}

export default function CompaniesTable({
  companies,
  lprCounts,
  searchQs,
  filterParams,
  totalFiltered,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [allByFilter, setAllByFilter] = useState<number[] | null>(null);

  const effectiveSelected = allByFilter ?? [...selected];

  const toggleOne = useCallback((id: number) => {
    setAllByFilter(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePage = useCallback(() => {
    setAllByFilter(null);
    setSelected((prev) => {
      if (prev.size === companies.length) return new Set();
      return new Set(companies.map((c) => c.id));
    });
  }, [companies]);

  const selectAllByFilter = async () => {
    setSelectAllLoading(true);
    try {
      const qs = new URLSearchParams(filterParams).toString();
      const res = await fetch(`/api/companies/ids?${qs}`);
      const data = (await res.json()) as { ids: number[] };
      setAllByFilter(data.ids);
      setSelected(new Set());
    } finally {
      setSelectAllLoading(false);
    }
  };

  const clearSelection = () => {
    setAllByFilter(null);
    setSelected(new Set());
  };

  const selectedIds = allByFilter ?? [...selected];
  const exportHref =
    selectedIds.length > 0
      ? `/export/review?companies=${selectedIds.join(",")}${searchQs ? `&${searchQs}` : ""}`
      : null;

  const pageAllSelected =
    !allByFilter && companies.length > 0 && selected.size === companies.length;

  return (
    <>
      <div className={styles.exportBar}>
        <label className={styles.selectAllLabel}>
          <input type="checkbox" checked={pageAllSelected} onChange={togglePage} />
          Страница ({companies.length})
        </label>
        <button
          type="button"
          className={styles.selectAllBtn}
          onClick={selectAllByFilter}
          disabled={selectAllLoading || totalFiltered === 0}
        >
          {selectAllLoading
            ? "Загрузка…"
            : `Все по фильтру (${totalFiltered})`}
        </button>
        {selectedIds.length > 0 && (
          <button type="button" className={styles.clearBtn} onClick={clearSelection}>
            Сбросить выбор
          </button>
        )}
        <span className={styles.exportCount}>
          Выбрано: <strong>{selectedIds.length}</strong>
          {allByFilter && " (весь фильтр)"}
        </span>
        {exportHref ? (
          <Link href={exportHref} className={styles.exportBtn}>
            Предпросмотр экспорта →
          </Link>
        ) : (
          <span className={styles.exportBtnDisabled}>Выберите компании для экспорта</span>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkCol} />
              <th>Название</th>
              <th>Категория</th>
              <th>Город</th>
              <th>Рейтинг</th>
              <th>Отзывы</th>
              <th>ЛПР</th>
              <th>Сайт</th>
              <th>Телефон</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  Компании не найдены. Попробуйте изменить критерии поиска.
                </td>
              </tr>
            ) : (
              companies.map((c) => {
                const lprCount = lprCounts[c.id] ?? 0;
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr key={c.id} className={isSelected ? styles.rowSelected : undefined}>
                    <td className={styles.checkCol}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(c.id)}
                        aria-label={`Выбрать ${c.name}`}
                      />
                    </td>
                    <td>
                      <Link href={`/companies/${c.id}`} className={styles.companyLink}>
                        {c.name}
                      </Link>
                      {c.reviews_count > 50 && (
                        <span className={styles.tagPopular} title="Много отзывов">
                          популярная
                        </span>
                      )}
                    </td>
                    <td>{c.category ?? "—"}</td>
                    <td>{c.city ?? "—"}</td>
                    <td>{c.rating ?? "—"}</td>
                    <td>{c.reviews_count}</td>
                    <td>
                      {lprCount > 0 ? (
                        <Link href={`/companies/${c.id}`} className={styles.lprBadge}>
                          {lprCount} конт.
                        </Link>
                      ) : (
                        <span className={styles.lprNone}>—</span>
                      )}
                    </td>
                    <td>
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noopener noreferrer">
                          {c.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{c.phone ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
