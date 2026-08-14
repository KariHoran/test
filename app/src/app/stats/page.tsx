import Link from "next/link";
import { getValidationStats, getTopCategories } from "@/lib/stats";
import styles from "./stats.module.css";

export const dynamic = "force-dynamic";

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((100 * part) / total)}%`;
}

export default async function StatsPage() {
  const [stats, topCategories] = await Promise.all([
    getValidationStats(),
    getTopCategories(5),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Качество базы</h1>
        <p>
          Статистика валидации контактов и готовности к аутричу.{" "}
          <Link href="/companies?validLprOnly=true">Компании с валидным ЛПР →</Link>
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Email</h2>
          <div className={styles.statRow}>
            <span className={styles.statValid}>Valid</span>
            <strong>{stats.emailValid}</strong>
            <span className={styles.statPct}>{pct(stats.emailValid, stats.totalContacts)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statInvalid}>Invalid / bounce-risk</span>
            <strong>{stats.emailInvalid}</strong>
            <span className={styles.statPct}>{pct(stats.emailInvalid, stats.totalContacts)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statUnknown}>Unknown</span>
            <strong>{stats.emailUnknown}</strong>
            <span className={styles.statPct}>{pct(stats.emailUnknown, stats.totalContacts)}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h2>Телефон</h2>
          <div className={styles.statRow}>
            <span className={styles.statValid}>Valid</span>
            <strong>{stats.phoneValid}</strong>
            <span className={styles.statPct}>{pct(stats.phoneValid, stats.totalContacts)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statInvalid}>Invalid</span>
            <strong>{stats.phoneInvalid}</strong>
            <span className={styles.statPct}>{pct(stats.phoneInvalid, stats.totalContacts)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statUnknown}>Unknown</span>
            <strong>{stats.phoneUnknown}</strong>
            <span className={styles.statPct}>{pct(stats.phoneUnknown, stats.totalContacts)}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h2>ЛПР и аутрич</h2>
          <div className={styles.statRow}>
            <span>ЛПР</span>
            <strong>{stats.decisionMakers}</strong>
          </div>
          <div className={styles.statRow}>
            <span>Не ЛПР</span>
            <strong>{stats.nonDecisionMakers}</strong>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statReady}>Готов к аутричу</span>
            <strong>{stats.outreachReady}</strong>
            <span className={styles.statPct}>{pct(stats.outreachReady, stats.totalContacts)}</span>
          </div>
          <p className={styles.hint}>
            Готов = valid email + valid phone + ЛПР + не generic
          </p>
        </div>

        <div className={styles.card}>
          <h2>Компании</h2>
          <div className={styles.statRow}>
            <span>Всего</span>
            <strong>{stats.totalCompanies}</strong>
          </div>
          <div className={styles.statRow}>
            <span>С валидным ЛПР</span>
            <strong>{stats.companiesWithValidLpr}</strong>
            <span className={styles.statPct}>
              {pct(stats.companiesWithValidLpr, stats.totalCompanies)}
            </span>
          </div>
          <Link href="/companies?validLprOnly=true" className={styles.linkBtn}>
            Фильтр: компании с валидным ЛПР
          </Link>
        </div>
      </div>

      <section className={styles.section}>
        <h2>Топ категорий в базе</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Категория</th>
              <th>Компаний</th>
            </tr>
          </thead>
          <tbody>
            {topCategories.map((row) => (
              <tr key={row.category}>
                <td>
                  <Link href={`/companies?category=${encodeURIComponent(row.category)}`}>
                    {row.category}
                  </Link>
                </td>
                <td>{row.company_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
