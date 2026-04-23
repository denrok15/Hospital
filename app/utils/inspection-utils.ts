export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ru-RU");
};

export const getConclusionLabel = (value?: string) => {
  if (!value) return "-";
  if (value === "Disease") return "Болезнь";
  if (value === "Recovery") return "Выздоровление";
  if (value === "Death") return "Смерть";
  return value;
};

export const getGenderLabel = (value?: string) => {
  if (!value) return "-";
  if (value === "Male") return "Мужской";
  if (value === "Female") return "Женский";
  return value;
};

export const getDiagnosisTypeLabel = (value?: string) => {
  if (!value) return "-";
  if (value === "Main") return "Основной";
  if (value === "Concomitant") return "Сопутствующий";
  if (value === "Complication") return "Осложнение";
  return value;
};

export const formatDateTimeShort = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toIsoOrNull = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const getGenderIcon = (value?: string) => {
  if (value === "Male") return "♂";
  if (value === "Female") return "♀";
  return "⚧";
};
