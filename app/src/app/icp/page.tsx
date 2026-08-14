import Link from "next/link";
import { getIcpProfiles } from "@/lib/icp";
import { icpCriteriaToSearchParams } from "@/lib/icp-types";
import { deleteIcpAction, launchIcpSearchAction } from "./actions";
import styles from "./icp.module.css";

export const dynamic = "force-dynamic";

function criteriaTags(criteria: Record<string, unknown>): string[] {
  const tags: string[] = [];
  if (criteria.q) tags.push(`Ключевые слова: ${criteria.q}`);
  if (criteria.city) tags.push(`Город: ${criteria.city}`);
  if (criteria.category) tags.push(`Категория: ${criteria.category}`);
  if (criteria.minRating) tags.push(`Рейтинг ≥ ${criteria.minRating}`);
  if (criteria.minReviews) tags.push(`Отзывов ≥ ${criteria.minReviews}`);
  if (criteria.hasWebsite === true) tags.push("Есть сайт");
  if (criteria.hasWebsite === false) tags.push("Нет сайта");
  if (Array.isArray(criteria.titles) && criteria.titles.length)
    tags.push(`ЛПР: ${(criteria.titles as string[]).join(", ")}`);
  if (criteria.decisionMakersOnly) tags.push("Только прямые ЛПР");
  return tags;
}

export default async function IcpListPage() {
  const profiles = await getIcpProfiles();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>ICP-профили</h1>
        <p>Идеальный клиент: сохранённые критерии поиска компаний и ЛПР.</p>
      </header>

      {profiles.length === 0 ? (
        <div className={styles.empty}>
          <p>Профилей пока нет.</p>
          <Link href="/icp/new" className={`${styles.btn} ${styles.btnPrimary}`}>
            Создать первый ICP
          </Link>
        </div>
      ) : (
        profiles.map((profile) => {
          const tags = criteriaTags(profile.criteria as Record<string, unknown>);
          const searchQs = icpCriteriaToSearchParams(profile.criteria);

          return (
            <article key={profile.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>
                    <Link href={`/icp/${profile.id}`}>{profile.name}</Link>
                  </h2>
                  <p className={styles.cardMeta}>
                    Создан: {new Date(profile.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>
              {tags.length > 0 && (
                <ul className={styles.criteriaList}>
                  {tags.map((tag) => (
                    <li key={tag} className={styles.tag}>
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.actions} style={{ marginTop: "1rem" }}>
                <form action={launchIcpSearchAction}>
                  <input type="hidden" name="criteria" value={JSON.stringify(profile.criteria)} />
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Запустить поиск
                  </button>
                </form>
                <Link href={`/icp/${profile.id}`} className={styles.btn}>
                  Подробнее
                </Link>
                <Link
                  href={searchQs ? `/companies?${searchQs}` : "/companies"}
                  className={styles.btn}
                >
                  Результаты
                </Link>
                <form action={deleteIcpAction}>
                  <input type="hidden" name="id" value={profile.id} />
                  <button type="submit" className={`${styles.btn} ${styles.btnDanger}`}>
                    Удалить
                  </button>
                </form>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
