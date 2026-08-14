import Link from "next/link";
import styles from "./nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>
        Каталог компаний
      </Link>
      <div className={styles.links}>
        <Link href="/companies">Каталог</Link>
        <Link href="/stats">Качество базы</Link>
        <Link href="/icp">ICP-профили</Link>
        <Link href="/export/review">Экспорт</Link>
        <Link href="/icp/new" className={styles.cta}>
          + Новый ICP
        </Link>
      </div>
    </nav>
  );
}
