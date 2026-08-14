import Link from "next/link";
import { notFound } from "next/navigation";
import { getIcpProfile } from "@/lib/icp";
import { icpCriteriaToSearchParams, LPR_TITLE_OPTIONS } from "@/lib/icp-types";
import { deleteIcpAction, launchIcpSearchAction } from "../actions";
import styles from "../icp.module.css";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCriteria(criteria: Record<string, unknown>) {
  const rows: { label: string; value: string }[] = [];
  if (criteria.q) rows.push({ label: "Ключевые слова", value: String(criteria.q) });
  if (criteria.city) rows.push({ label: "Город", value: String(criteria.city) });
  if (criteria.category) rows.push({ label: "Категория", value: String(criteria.category) });
  if (criteria.minRating) rows.push({ label: "Мин. рейтинг", value: String(criteria.minRating) });
  if (criteria.minReviews) rows.push({ label: "Мин. отзывов", value: String(criteria.minReviews) });
  if (criteria.hasWebsite === true) rows.push({ label: "Сайт", value: "Есть" });
  if (criteria.hasWebsite === false) rows.push({ label: "Сайт", value: "Нет" });
  if (Array.isArray(criteria.titles) && criteria.titles.length) {
    const labels = (criteria.titles as string[]).map(
      (t) => LPR_TITLE_OPTIONS.find((o) => o.value === t)?.label ?? t
    );
    rows.push({ label: "Должности ЛПР", value: labels.join(", ") });
  }
  if (criteria.decisionMakersOnly) rows.push({ label: "Фильтр ЛПР", value: "Только прямые контакты" });
  return rows;
}

export default async function IcpDetailPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = parseInt(idRaw, 10);
  if (Number.isNaN(id)) notFound();

  const profile = await getIcpProfile(id);
  if (!profile) notFound();

  const criteria = profile.criteria as Record<string, unknown>;
  const rows = formatCriteria(criteria);
  const searchQs = icpCriteriaToSearchParams(profile.criteria);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{profile.name}</h1>
        <p>
          <Link href="/icp">← К списку ICP</Link>
        </p>
      </header>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Критерии ICP</h2>
        <div className={styles.detailCriteria}>
          {rows.length === 0 ? (
            <p style={{ color: "#888", margin: 0 }}>Критерии не заданы — будут показаны все компании.</p>
          ) : (
            rows.map((row) => (
              <div key={row.label} className={styles.detailRow}>
                <span className={styles.detailLabel}>{row.label}</span>
                <span className={styles.detailValue}>{row.value}</span>
              </div>
            ))
          )}
        </div>

        <div className={styles.actions}>
          <form action={launchIcpSearchAction}>
            <input type="hidden" name="criteria" value={JSON.stringify(profile.criteria)} />
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              Запустить поиск
            </button>
          </form>
          <Link
            href={searchQs ? `/companies?${searchQs}` : "/companies"}
            className={styles.btn}
          >
            Посмотреть результаты
          </Link>
          <form action={deleteIcpAction}>
            <input type="hidden" name="id" value={profile.id} />
            <button type="submit" className={`${styles.btn} ${styles.btnDanger}`}>
              Удалить профиль
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
