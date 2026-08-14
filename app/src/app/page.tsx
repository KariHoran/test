import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Каталог компаний</h1>
          <p>
            Тестовое задание: поиск по ICP-критериям, контакты ЛПР, валидация и экспорт в CSV.
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
