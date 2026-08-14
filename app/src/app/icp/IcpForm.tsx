import { createIcpAction } from "./actions";
import IcpPreview from "./IcpPreview";
import { LPR_TITLE_OPTIONS } from "@/lib/icp-types";
import styles from "./icp.module.css";

interface Props {
  cities: string[];
  categories: string[];
}

export default function IcpForm({ cities, categories }: Props) {
  return (
    <form id="icp-form" action={createIcpAction} className={styles.form}>
      <IcpPreview formId="icp-form" />

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
        </div>

        <div className={styles.multiSelectSection}>
          <span className={styles.multiSelectLabel}>Города (можно несколько)</span>
          <div className={styles.checkboxGroup}>
            {cities.map((city) => (
              <label key={city} className={styles.checkboxLabel}>
                <input type="checkbox" name="cities" value={city} />
                {city}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.multiSelectSection}>
          <span className={styles.multiSelectLabel}>Категории (можно несколько, ИЛИ)</span>
          <div className={styles.checkboxGroup}>
            {categories.map((cat) => (
              <label key={cat} className={styles.checkboxLabel}>
                <input type="checkbox" name="categories" value={cat} />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formGrid}>
          <label>
            Мин. рейтинг
            <select name="minRating" defaultValue="">
              <option value="">Любой</option>
              <option value="3.5">от 3.5</option>
              <option value="4.0">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">от 4.8</option>
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
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="activeOnly" />
            Активные компании (10+ отзывов)
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
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="validLprOnly" />
            Только с валидным ЛПР (email valid)
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
