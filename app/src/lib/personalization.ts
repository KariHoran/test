export const DEFAULT_EMAIL_TEMPLATE = `Здравствуйте, {{firstName}}!

Я изучил(а) {{companyName}} ({{city}}) и вижу, что вы {{title}}.

Мы помогаем компаниям в нише «{{category}}» решать типичную задачу: {{painPoint}}

Буду рад(а) обсудить, если актуально.

С уважением`;

const CATEGORY_PAIN_POINTS: Record<string, string> = {
  "IT-интегратор": "сократить время внедрения и снизить стоимость интеграций",
  "Оптовая торговля": "оптимизировать логистику и ускорить обработку заказов",
  "Рекламное агентство": "повысить ROI кампаний и автоматизировать отчётность клиентам",
  "Строительная компания": "контролировать сроки проектов и снижать перерасход бюджета",
  "Юридические услуги": "привлекать клиентов без роста штата юристов",
  "Образовательный центр": "увеличить набор учеников и удержание без роста рекламного бюджета",
  "Клининг": "масштабировать клиентскую базу и стандартизировать качество услуг",
  "Ресторан": "повысить средний чек и частоту повторных визитов",
  "Автосервис": "заполнить слоты записи и снизить отток клиентов",
  "Логистика": "сократить простой транспорта и улучшить маршрутизацию",
  "Бухгалтерские услуги": "автоматизировать рутину и масштабировать портфель клиентов",
  "Производство мебели": "ускорить цикл от заказа до отгрузки",
  "Пекарня": "увеличить поток заказов и лояльность постоянных покупателей",
};

export function getCategoryPainPoint(category: string | null | undefined): string {
  if (!category) return "решать ключевые задачи роста и эффективности";
  return CATEGORY_PAIN_POINTS[category] ?? "решать ключевые задачи роста и эффективности";
}

export interface TemplateVars {
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  companyName?: string | null;
  city?: string | null;
  category?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
}

export function renderEmailTemplate(template: string, vars: TemplateVars): string {
  const painPoint = getCategoryPainPoint(vars.category);
  const replacements: Record<string, string> = {
    firstName: vars.firstName?.trim() || "коллега",
    lastName: vars.lastName?.trim() || "",
    title: vars.title?.trim() || "руководитель",
    companyName: vars.companyName?.trim() || "ваша компания",
    city: vars.city?.trim() || "вашем городе",
    category: vars.category?.trim() || "вашей отрасли",
    rating: vars.rating != null ? String(vars.rating) : "—",
    reviewsCount: vars.reviewsCount != null ? String(vars.reviewsCount) : "—",
    painPoint,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] ?? "");
}
