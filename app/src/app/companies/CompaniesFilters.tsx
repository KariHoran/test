"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { LPR_TITLE_OPTIONS } from "@/lib/icp-types";
import styles from "./companies.module.css";

interface Props {
  cities: string[];
  categories: string[];
  initialQ: string;
  initialCities: string[];
  initialCategories: string[];
  initialMinRating: string;
  initialMinReviews: string;
  initialHasWebsite: string;
  initialTitles: string[];
  initialLprOnly: boolean;
  initialValidLprOnly: boolean;
  initialSort: string;
  initialOrder: string;
}

export default function CompaniesFilters({
  cities,
  categories,
  initialQ,
  initialCities,
  initialCategories,
  initialMinRating,
  initialMinReviews,
  initialHasWebsite,
  initialTitles,
  initialLprOnly,
  initialValidLprOnly,
  initialSort,
  initialOrder,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [selectedCities, setSelectedCities] = useState<string[]>(initialCities);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [titles, setTitles] = useState<string[]>(initialTitles);
  const [lprOnly, setLprOnly] = useState(initialLprOnly);
  const [validLprOnly, setValidLprOnly] = useState(initialValidLprOnly);

  useEffect(() => {
    setQ(initialQ);
    setSelectedCities(initialCities);
    setSelectedCategories(initialCategories);
    setTitles(initialTitles);
    setLprOnly(initialLprOnly);
    setValidLprOnly(initialValidLprOnly);
  }, [
    initialQ,
    initialCities,
    initialCategories,
    initialTitles,
    initialLprOnly,
    initialValidLprOnly,
  ]);

  const buildUpdates = useCallback(
    (overrides: Partial<{
      q: string;
      cities: string[];
      categories: string[];
      minRating: string;
      minReviews: string;
      hasWebsite: string;
      titles: string[];
      lprOnly: boolean;
      validLprOnly: boolean;
      sort: string;
      order: string;
    }> = {}) => {
      const nextCities = overrides.cities ?? selectedCities;
      const nextCategories = overrides.categories ?? selectedCategories;
      const nextTitles = overrides.titles ?? titles;
      const nextLprOnly = overrides.lprOnly ?? lprOnly;
      const nextValidLprOnly = overrides.validLprOnly ?? validLprOnly;

      const cityParam =
        nextCities.length === 1
          ? nextCities[0]
          : nextCities.length > 1
            ? nextCities.join(",")
            : "";
      const categoryParam =
        nextCategories.length === 1
          ? nextCategories[0]
          : nextCategories.length > 1
            ? nextCategories.join(",")
            : "";

      return {
        q: overrides.q ?? q,
        city: nextCities.length === 1 ? cityParam : "",
        cities: nextCities.length > 1 ? cityParam : "",
        category: nextCategories.length === 1 ? categoryParam : "",
        categories: nextCategories.length > 1 ? categoryParam : "",
        minRating: overrides.minRating ?? initialMinRating,
        minReviews: overrides.minReviews ?? initialMinReviews,
        hasWebsite: overrides.hasWebsite ?? initialHasWebsite,
        titles: nextTitles.length ? nextTitles.join(",") : "",
        lprOnly: nextLprOnly ? "true" : "",
        validLprOnly: nextValidLprOnly ? "true" : "",
        sort: overrides.sort ?? initialSort,
        order: overrides.order ?? initialOrder,
      };
    },
    [
      q,
      selectedCities,
      selectedCategories,
      titles,
      lprOnly,
      validLprOnly,
      initialMinRating,
      initialMinReviews,
      initialHasWebsite,
      initialSort,
      initialOrder,
    ]
  );

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const key of ["city", "cities", "category", "categories"]) {
        params.delete(key);
      }

      for (const [key, value] of Object.entries(updates)) {
        if (value.trim()) params.set(key, value.trim());
        else params.delete(key);
      }

      params.delete("page");

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/companies?${qs}` : "/companies");
      });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (q !== initialQ) {
        pushParams(buildUpdates({ q }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, initialQ, buildUpdates, pushParams]);

  const handleSelectChange = (key: string, value: string) => {
    pushParams(buildUpdates({ [key]: value } as Parameters<typeof buildUpdates>[0]));
  };

  const toggleCity = (city: string) => {
    const next = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];
    setSelectedCities(next);
    pushParams(buildUpdates({ cities: next }));
  };

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(next);
    pushParams(buildUpdates({ categories: next }));
  };

  const toggleTitle = (value: string) => {
    const next = titles.includes(value)
      ? titles.filter((t) => t !== value)
      : [...titles, value];
    setTitles(next);
    pushParams(buildUpdates({ titles: next }));
  };

  const toggleLprOnly = () => {
    const next = !lprOnly;
    setLprOnly(next);
    pushParams(buildUpdates({ lprOnly: next }));
  };

  const toggleValidLprOnly = () => {
    const next = !validLprOnly;
    setValidLprOnly(next);
    pushParams(buildUpdates({ validLprOnly: next }));
  };

  const handleReset = () => {
    setQ("");
    setSelectedCities([]);
    setSelectedCategories([]);
    setTitles([]);
    setLprOnly(false);
    setValidLprOnly(false);
    startTransition(() => {
      router.push("/companies");
    });
  };

  return (
    <div className={styles.filtersWrap}>
      <div className={styles.filtersHeader}>
        <h2 className={styles.filtersTitle}>Критерии поиска</h2>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          disabled={isPending}
        >
          Сбросить
        </button>
      </div>

      <div className={styles.filters} aria-busy={isPending}>
        <label className={styles.fullWidth}>
          Ключевые слова (название, категория, адрес)
          <input
            type="search"
            placeholder="Название, категория, адрес…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        <label>
          Мин. рейтинг
          <select
            value={initialMinRating}
            onChange={(e) => handleSelectChange("minRating", e.target.value)}
          >
            <option value="">Любой</option>
            <option value="3.5">от 3.5</option>
            <option value="4.0">4.0+</option>
            <option value="4.5">4.5+</option>
            <option value="4.8">от 4.8</option>
          </select>
        </label>

        <label>
          Мин. отзывов
          <select
            value={initialMinReviews}
            onChange={(e) => handleSelectChange("minReviews", e.target.value)}
          >
            <option value="">Любое</option>
            <option value="10">от 10 (активные)</option>
            <option value="50">от 50</option>
            <option value="100">от 100</option>
            <option value="200">от 200</option>
          </select>
        </label>

        <label>
          Сайт
          <select
            value={initialHasWebsite}
            onChange={(e) => handleSelectChange("hasWebsite", e.target.value)}
          >
            <option value="">Не важно</option>
            <option value="true">Есть сайт</option>
            <option value="false">Нет сайта</option>
          </select>
        </label>

        <label>
          Сортировка
          <select
            value={initialSort}
            onChange={(e) => handleSelectChange("sort", e.target.value)}
          >
            <option value="name">По названию</option>
            <option value="rating">По рейтингу</option>
            <option value="reviews_count">По отзывам</option>
          </select>
        </label>

        <label>
          Порядок
          <select
            value={initialOrder}
            onChange={(e) => handleSelectChange("order", e.target.value)}
          >
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </label>
      </div>

      <div className={styles.multiFilterSection}>
        <span className={styles.multiFilterLabel}>Города (можно несколько)</span>
        <div className={styles.chipGroup}>
          {cities.map((city) => (
            <label key={city} className={styles.chipLabel}>
              <input
                type="checkbox"
                checked={selectedCities.includes(city)}
                onChange={() => toggleCity(city)}
              />
              {city}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.multiFilterSection}>
        <span className={styles.multiFilterLabel}>Категории (ИЛИ)</span>
        <div className={styles.chipGroup}>
          {categories.map((cat) => (
            <label key={cat} className={styles.chipLabel}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.lprFilters}>
        <span className={styles.lprFiltersLabel}>Должности ЛПР:</span>
        {LPR_TITLE_OPTIONS.map((opt) => (
          <label key={opt.value} className={styles.lprCheckbox}>
            <input
              type="checkbox"
              checked={titles.includes(opt.value)}
              onChange={() => toggleTitle(opt.value)}
            />
            {opt.label}
          </label>
        ))}
        <label className={styles.lprCheckbox}>
          <input type="checkbox" checked={lprOnly} onChange={toggleLprOnly} />
          Только с прямыми ЛПР
        </label>
        <label className={styles.lprCheckbox}>
          <input type="checkbox" checked={validLprOnly} onChange={toggleValidLprOnly} />
          Есть валидный ЛПР
        </label>
      </div>
    </div>
  );
}
