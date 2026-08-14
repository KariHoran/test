import { createIcpAction } from "./actions";
import { LPR_TITLE_OPTIONS } from "@/lib/icp-types";
import styles from "./icp.module.css";

interface Props {
  cities: string[];
  categories: string[];
}

export default function IcpForm({ cities, categories }: Props) {
  return (
    <form action={createIcpAction} className={styles.form}>
      <div className={styles.formSection}>
        <h2>1. Название профиля</h2>
        <div className={styles.formGrid}>
          <label>
            Название ICP *
            <input
              type="text"
              name="name"
              required
              placeholder="Например: IT-компании Москвы, HR-директора"
            />
          </label>
        </div>
      </div>

      <div className={styles.formSection}>
        <h2>2. Критерии компании</h2>
        <div className={styles.formGrid}>
          <label>
            Ключевые слова
            <input type="text" name="q" placeholder="Название, категория, адрес…" />
          </label>
          <label>
            Город
            <select name="city" defaultValue="">
              <option value="">Любой</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label>
            Категория / индустрия
            <select name="category" defaultValue="">
              <option value="">Любая</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label>
            Мин. рейтинг
            <select name="minRating" defaultValue="">
              <option value="">Любой</option>
              <option value="3.5">от 3.5</option>
              <option value="4.0">от 4.0</option>
              <option value="4.5">от 4.5</option>
            </select>
          </label>
          <label>
            Мин. отзывов
            <select name="minReviews" defaultValue="">
              <option value="">Любое</option>
              <option value="10">от 10</option>
              <option value="50">от 50</option>
              <option value="100">от 100</option>
            </select>
          </label>
          <label>
            Сайт
            <select name="hasWebsite" defaultValue="">
              <option value="">Не важно</option>
              <option value="true">Есть сайт</option>
              <option value="false">Нет сайта</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.formSection}>
        <h2>3. Контакты ЛПР</h2>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "#555" }}>
          Выберите должности. Сервис исключит общие ящики (info@, sales@).
        </p>
        <div className={styles.checkboxGroup}>
          {LPR_TITLE_OPTIONS.map((opt) => (
            <label key={opt.value} className={styles.checkboxLabel}>
              <input type="checkbox" name="titles" value={opt.value} />
              {opt.label}
            </label>
          ))}
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="decisionMakersOnly" />
            Только компании с прямыми контактами ЛПР
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
          Сохранить ICP
        </button>
      </div>
    </form>
  );
}
