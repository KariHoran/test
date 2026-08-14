import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Каталог компаний</h1>
          <p>Тестовое задание: просмотр и поиск компаний из PostgreSQL.</p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/companies">
            Открыть каталог →
          </Link>
        </div>
      </main>
    </div>
  );
}
