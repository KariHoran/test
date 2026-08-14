import Link from "next/link";
import { getCategories, getCities } from "@/lib/companies";
import IcpForm from "../IcpForm";
import styles from "../icp.module.css";

export default async function NewIcpPage() {
  const [cities, categories] = await Promise.all([getCities(), getCategories()]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Новый ICP-профиль</h1>
        <p>
          Определите идеального клиента: рынок, размер, должности ЛПР.{" "}
          <Link href="/icp">← К списку</Link>
        </p>
      </header>
      <IcpForm cities={cities} categories={categories} />
    </div>
  );
}
