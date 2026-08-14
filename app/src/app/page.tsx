import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>DealRocket</h1>
          <p>
            Поиск компаний по ICP-критериям, сбор контактов ЛПР и экспорт для аутрича.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/icp/new">
            Создать ICP-профиль →
          </Link>
          <Link className={styles.secondary} href="/companies">
            Открыть каталог
          </Link>
          <Link className={styles.secondary} href="/icp">
            Мои ICP-профили
          </Link>
        </div>
      </main>
    </div>
  );
}
