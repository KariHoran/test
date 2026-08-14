"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { LPR_TITLE_OPTIONS } from "@/lib/icp-types";
import styles from "./companies.module.css";

interface Props {
  cities: string[];
  categories: string[];
  initialQ: string;
  initialCity: string;
  initialCategory: string;
  initialMinRating: string;
  initialMinReviews: string;
  initialHasWebsite: string;
  initialTitles: string[];
  initialLprOnly: boolean;
  initialSort: string;
  initialOrder: string;
}

export default function CompaniesFilters({
  cities,
  categories,
  initialQ,
  initialCity,
  initialCategory,
  initialMinRating,
  initialMinReviews,
  initialHasWebsite,
  initialTitles,
  initialLprOnly,
  initialSort,
  initialOrder,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [titles, setTitles] = useState<string[]>(initialTitles);
  const [lprOnly, setLprOnly] = useState(initialLprOnly);

  useEffect(() => {
    setQ(initialQ);
    setTitles(initialTitles);
    setLprOnly(initialLprOnly);
  }, [initialQ, initialTitles, initialLprOnly]);

  const buildUpdates = useCallback(
    (overrides: Partial<{
      q: string;
      city: string;
      category: string;
      minRating: string;
      minReviews: string;
      hasWebsite: string;
      titles: string[];
      lprOnly: boolean;
      sort: string;
      order: string;
    }> = {}) => {
      const nextTitles = overrides.titles ?? titles;
      const nextLprOnly = overrides.lprOnly ?? lprOnly;
      return {
        q: overrides.q ?? q,
        city: overrides.city ?? initialCity,
        category: overrides.category ?? initialCategory,
        minRating: overrides.minRating ?? initialMinRating,
        minReviews: overrides.minReviews ?? initialMinReviews,
        hasWebsite: overrides.hasWebsite ?? initialHasWebsite,
        titles: nextTitles.length ? nextTitles.join(",") : "",
        lprOnly: nextLprOnly ? "true" : "",
        sort: overrides.sort ?? initialSort,
        order: overrides.order ?? initialOrder,
      };
    },
    [
      q,
      titles,
      lprOnly,
      initialCity,
      initialCategory,
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

  const handleReset = () => {
    setQ("");
    setTitles([]);
    setLprOnly(false);
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
        <label>
          Ключевые слова
          <input
            type="search"
            placeholder="Название, категория, адрес…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        <label>
          Город
          <select
            value={initialCity}
            onChange={(e) => handleSelectChange("city", e.target.value)}
          >
            <option value="">Все города</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label>
          Категория / индустрия
          <select
            value={initialCategory}
            onChange={(e) => handleSelectChange("category", e.target.value)}
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label>
          Мин. рейтинг
          <select
            value={initialMinRating}
            onChange={(e) => handleSelectChange("minRating", e.target.value)}
          >
            <option value="">Любой</option>
            <option value="3.5">от 3.5</option>
            <option value="4.0">от 4.0</option>
            <option value="4.5">от 4.5</option>
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
            <option value="10">от 10</option>
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
      </div>
    </div>
  );
}
