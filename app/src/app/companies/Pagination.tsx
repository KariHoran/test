"use client";

import Link from "next/link";
import styles from "./companies.module.css";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string>;
}

function buildPageUrl(page: number, searchParams: Record<string, string>) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/companies?${qs}` : "/companies";
}

export default function Pagination({ page, totalPages, total, searchParams }: Props) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className={styles.pagination} aria-label="Пагинация">
      <span className={styles.paginationInfo}>
        Всего: {total} · Страница {page} из {totalPages}
      </span>
      <div className={styles.paginationLinks}>
        {page > 1 && (
          <Link href={buildPageUrl(page - 1, searchParams)} className={styles.pageLink}>
            ← Назад
          </Link>
        )}
        {start > 1 && (
          <>
            <Link href={buildPageUrl(1, searchParams)} className={styles.pageLink}>
              1
            </Link>
            {start > 2 && <span className={styles.pageEllipsis}>…</span>}
          </>
        )}
        {pages.map((p) => (
          <Link
            key={p}
            href={buildPageUrl(p, searchParams)}
            className={`${styles.pageLink} ${p === page ? styles.pageLinkActive : ""}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Link>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className={styles.pageEllipsis}>…</span>}
            <Link href={buildPageUrl(totalPages, searchParams)} className={styles.pageLink}>
              {totalPages}
            </Link>
          </>
        )}
        {page < totalPages && (
          <Link href={buildPageUrl(page + 1, searchParams)} className={styles.pageLink}>
            Вперёд →
          </Link>
        )}
      </div>
    </nav>
  );
}
