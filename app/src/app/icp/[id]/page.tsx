import Link from "next/link";
import { notFound } from "next/navigation";
import { countCompaniesAndContacts } from "@/lib/companies";
import { getIcpProfile } from "@/lib/icp";
import { icpCriteriaToSearchParams, LPR_TITLE_OPTIONS, normalizeIcpCriteria } from "@/lib/icp-types";
import { deleteIcpAction, launchIcpSearchAction } from "../actions";
import styles from "../icp.module.css";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCriteria(criteria: Record<string, unknown>) {
  const rows: { label: string; value: string }[] = [];
  if (criteria.q) rows.push({ label: "Ключевые слова", value: String(criteria.q) });

  const cities = (criteria.cities as string[] | undefined)?.length
    ? (criteria.cities as string[])
    : criteria.city
      ? [String(criteria.city)]
      : [];
  if (cities.length) rows.push({ label: "Города", value: cities.join(", ") });

  const categories = (criteria.categories as string[] | undefined)?.length
    ? (criteria.categories as string[])
    : criteria.category
      ? [String(criteria.category)]
      : [];
  if (categories.length) rows.push({ label: "Категории", value: categories.join(", ") });

  if (criteria.minRating) rows.push({ label: "Мин. рейтинг", value: String(criteria.minRating) });
  if (criteria.minReviews) rows.push({ label: "Мин. отзывов", value: String(criteria.minReviews) });
  if (criteria.activeOnly) rows.push({ label: "Активные", value: "10+ отзывов" });
  if (criteria.hasWebsite === true) rows.push({ label: "Сайт", value: "Есть" });
  if (criteria.hasWebsite === false) rows.push({ label: "Сайт", value: "Нет" });
  if (Array.isArray(criteria.titles) && criteria.titles.length) {
    const labels = (criteria.titles as string[]).map(
      (t) => LPR_TITLE_OPTIONS.find((o) => o.value === t)?.label ?? t
    );
    rows.push({ label: "Должности ЛПР", value: labels.join(", ") });
  }
  if (criteria.decisionMakersOnly) rows.push({ label: "Фильтр ЛПР", value: "Только прямые контакты" });
  if (criteria.validLprOnly) rows.push({ label: "Валидный ЛПР", value: "Да" });
  return rows;
}

export default async function IcpDetailPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = parseInt(idRaw, 10);
  if (Number.isNaN(id)) notFound();

  const profile = await getIcpProfile(id);
  if (!profile) notFound();

  const normalized = normalizeIcpCriteria(profile.criteria);
  const criteria = profile.criteria as Record<string, unknown>;
  const rows = formatCriteria(criteria);
  const searchQs = icpCriteriaToSearchParams(profile.criteria);

  const preview = await countCompaniesAndContacts({
    q: normalized.q,
    cities: normalized.cities,
    categories: normalized.categories,
    minRating: normalized.minRating,
    minReviews: normalized.minReviews,
    hasWebsite: normalized.hasWebsite,
    titles: normalized.titles,
    decisionMakersOnly: normalized.decisionMakersOnly,
    validLprOnly: normalized.validLprOnly,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{profile.name}</h1>
        <p>
          <Link href="/icp">← К списку ICP</Link>
        </p>
      </header>

      <div className={styles.previewBox}>
        <strong>Предпросмотр:</strong> ~{preview.companies} компаний, ~{preview.contacts} контактов
      </div>

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
