import Link from "next/link";
import { notFound } from "next/navigation";
import ValidationBadge from "../../components/ValidationBadge";
import { getCompanyById } from "@/lib/companies";
import {
  contactFullName,
  getContactsByCompany,
  isGenericEmail,
} from "@/lib/contacts";
import { isOutreachReady } from "@/lib/validation";
import { getCategoryPainPoint } from "@/lib/personalization";
import styles from "../companies.module.css";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = parseInt(idRaw, 10);
  if (Number.isNaN(id)) notFound();

  const company = await getCompanyById(id);
  if (!company) notFound();

  const contacts = await getContactsByCompany(id);
  const lprContacts = contacts.filter(
    (c) => c.is_decision_maker && c.email_status !== "invalid" && !isGenericEmail(c.email)
  );
  const painPoint = getCategoryPainPoint(company.category);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.backLink}>
          <Link href="/companies">← К каталогу</Link>
        </p>
        <h1>
          {company.name}
          {company.reviews_count > 50 && (
            <span className={styles.tagPopular} style={{ marginLeft: "0.5rem" }}>
              популярная
            </span>
          )}
        </h1>
        <p>
          {company.category ?? "—"} · {company.city ?? "—"}
        </p>
      </header>

      <section className={styles.detailSection}>
        <h2>О компании</h2>
        <dl className={styles.detailGrid}>
          <div>
            <dt>Адрес</dt>
            <dd>{company.address ?? "—"}</dd>
          </div>
          <div>
            <dt>Рейтинг</dt>
            <dd>{company.rating ?? "—"}</dd>
          </div>
          <div>
            <dt>Отзывы</dt>
            <dd>{company.reviews_count}</dd>
          </div>
          <div>
            <dt>Сайт</dt>
            <dd>
              {company.website ? (
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd>{company.phone ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {company.category && (
        <section className={styles.painPointBox}>
          <h2>Подсказка по нише</h2>
          <p>
            <strong>{company.category}</strong> — типичная «боль»: {painPoint}
          </p>
        </section>
      )}

      <section className={styles.detailSection}>
        <h2>
          Контакты ЛПР{" "}
          <span className={styles.badge}>{lprContacts.length} прямых</span>
        </h2>
        <p className={styles.sectionHint}>
          Каждый контакт прошёл автоматическую проверку. Общие ящики (info@, sales@) помечены
          как битые и исключаются из экспорта.
        </p>

        {contacts.length === 0 ? (
          <p className={styles.emptyInline}>Контакты не найдены.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Должность</th>
                  <th>Email</th>
                  <th>Email ✓</th>
                  <th>Телефон</th>
                  <th>Телефон ✓</th>
                  <th>Тип</th>
                  <th>Аутрич</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => {
                  const generic = isGenericEmail(c.email);
                  const ready = isOutreachReady(c);
                  return (
                    <tr
                      key={c.id}
                      className={
                        generic || c.email_status === "invalid" ? styles.rowMuted : undefined
                      }
                    >
                      <td>{contactFullName(c)}</td>
                      <td>{c.title ?? "—"}</td>
                      <td>
                        {c.email ? (
                          <>
                            <a href={`mailto:${c.email}`}>{c.email}</a>
                            {generic && <span className={styles.tagWarn}>общий</span>}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <ValidationBadge status={c.email_status} />
                      </td>
                      <td>{c.phone ?? "—"}</td>
                      <td>
                        <ValidationBadge status={c.phone_status} />
                      </td>
                      <td>
                        {c.is_decision_maker && !generic && c.email_status !== "invalid" ? (
                          <span className={styles.tagLpr}>ЛПР</span>
                        ) : generic || c.email_status === "invalid" ? (
                          <span className={styles.tagMuted}>мусорный</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {ready ? (
                          <span className={styles.tagReady}>готов</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {lprContacts.length > 0 && (
          <div className={styles.detailActions}>
            <Link
              href={`/export/review?companies=${id}`}
              className={styles.exportBtnInline}
            >
              Экспорт контактов →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
