import Link from "next/link";
import { getContactsForExport } from "@/lib/contacts";
import ExportReviewClient from "./ExportReviewClient";
import styles from "./export.module.css";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    companies?: string;
    validOnly?: string;
  }>;
}

function parseCompanyIds(raw?: string): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

export default async function ExportReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const companyIds = parseCompanyIds(params.companies);
  const validOnly = params.validOnly === "true";

  const contacts = await getContactsForExport(companyIds, {
    validOnly: false,
    lprOnly: true,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.back}>
          <Link href="/companies">← К каталогу</Link>
        </p>
        <h1>Предпросмотр экспорта</h1>
        <p>
          Проверьте выборку, исключите неподходящие контакты и скачайте CSV для CRM или
          рассылки.
        </p>
      </header>

      {companyIds.length === 0 ? (
        <div className={styles.empty}>
          <p>Компании не выбраны.</p>
          <Link href="/companies" className={styles.linkBtn}>
            Вернуться в каталог
          </Link>
        </div>
      ) : (
        <ExportReviewClient contacts={contacts} initialValidOnly={validOnly} />
      )}
    </div>
  );
}
