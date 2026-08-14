"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Company } from "@/lib/companies";
import styles from "./companies.module.css";

interface Props {
  companies: Company[];
  lprCounts: Record<number, number>;
  searchQs: string;
}

export default function CompaniesTable({ companies, lprCounts, searchQs }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleOne = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === companies.length) return new Set();
      return new Set(companies.map((c) => c.id));
    });
  }, [companies]);

  const exportHref =
    selected.size > 0
      ? `/export/review?companies=${[...selected].join(",")}${searchQs ? `&${searchQs}` : ""}`
      : null;

  const allSelected = companies.length > 0 && selected.size === companies.length;

  return (
    <>
      <div className={styles.exportBar}>
        <label className={styles.selectAllLabel}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Выбрать все на странице
        </label>
        <span className={styles.exportCount}>
          Выбрано компаний: <strong>{selected.size}</strong>
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
                return (
                  <tr key={c.id} className={selected.has(c.id) ? styles.rowSelected : undefined}>
                    <td className={styles.checkCol}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                        aria-label={`Выбрать ${c.name}`}
                      />
                    </td>
                    <td>
                      <Link href={`/companies/${c.id}`} className={styles.companyLink}>
                        {c.name}
                      </Link>
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
