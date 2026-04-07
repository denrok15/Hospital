import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  loadConsultations,
  type ConsultationInspection,
  type ConsultationQuery,
  type ConsultationsResponse,
} from "app/api/consultations";
import { loadIcdRoots, type IcdRoot } from "app/api/patients";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 5;
const SIZE_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ru-RU");
};

const normalizeConsultations = (
  data: ConsultationInspection[] | ConsultationsResponse | undefined,
) => {
  if (!data) return [] as ConsultationInspection[];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.inspections)) return data.inspections;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [] as ConsultationInspection[];
};

const extractTotalCount = (
  data: ConsultationInspection[] | ConsultationsResponse | undefined,
) => {
  if (!data || Array.isArray(data)) return null;
  const candidates = [
    data.totalCount,
    data.total,
    data.count,
    data.pagination?.totalCount,
    data.pagination?.total,
    data.pagination?.count,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
};

const normalizeIcdRoots = (
  data:
    | IcdRoot[]
    | {
        items?: IcdRoot[];
        data?: IcdRoot[];
        icdRoots?: IcdRoot[];
        roots?: IcdRoot[];
      }
    | undefined,
) => {
  if (!data) return [] as IcdRoot[];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.icdRoots)) return data.icdRoots;
  if (Array.isArray(data.roots)) return data.roots;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [] as IcdRoot[];
};

const getConclusionLabel = (value?: string) => {
  if (!value) return "-";
  if (value === "Disease") return "Болезнь";
  if (value === "Recovery") return "Выздоровление";
  if (value === "Death") return "Смерть";
  return value;
};

export const ConsultationPage = () => {
  const [filters, setFilters] = useState({
    icdRoot: "",
    grouped: false,
    showAll: true,
    size: DEFAULT_SIZE,
  });
  const [queryParams, setQueryParams] = useState<ConsultationQuery>({
    grouped: false,
    icdRoots: [],
    page: DEFAULT_PAGE,
    size: DEFAULT_SIZE,
  });

  const {
    data: consultationsData,
    isLoading,
    isError,
  } = useQuery(loadConsultations(queryParams));
  const { data: icdRootsData } = useQuery(loadIcdRoots());

  const consultations = useMemo(
    () => normalizeConsultations(consultationsData),
    [consultationsData],
  );
  const icdRoots = useMemo(
    () => normalizeIcdRoots(icdRootsData),
    [icdRootsData],
  );
  const visibleConsultations = useMemo(() => {
    if (filters.showAll) return consultations;
    return consultations.filter(
      (inspection) =>
        !inspection.previousId || inspection.previousId === inspection.id,
    );
  }, [consultations, filters.showAll]);

  const totalCount = useMemo(
    () => extractTotalCount(consultationsData),
    [consultationsData],
  );
  const totalPages = totalCount
    ? Math.max(1, Math.ceil(totalCount / (queryParams.size ?? DEFAULT_SIZE)))
    : null;
  const hasNextPage = totalPages
    ? (queryParams.page ?? DEFAULT_PAGE) < totalPages
    : consultations.length === (queryParams.size ?? DEFAULT_SIZE);

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl bg-transparent p-6">
        <div className="border-b border-violet-100 pb-4">
          <h1 className="text-4xl font-semibold text-gray-800">Консультации</h1>
        </div>

        <div className="mt-6 rounded-xl border border-violet-100 bg-[#fefcff] p-4 shadow-sm">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setQueryParams({
                grouped: filters.grouped,
                icdRoots: filters.icdRoot ? [filters.icdRoot] : [],
                page: DEFAULT_PAGE,
                size: filters.size,
              });
            }}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
              <label className="block text-sm text-gray-700">
                <span className="mb-1 block font-medium">МКБ-10</span>
                <select
                  value={filters.icdRoot}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      icdRoot: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                >
                  <option value="">Все корни</option>
                  {icdRoots.map((root) => (
                    <option key={root.id} value={root.id}>
                      {[root.code, root.name].filter(Boolean).join(" - ") ||
                        root.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <span className="relative inline-flex h-5 w-9 items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={filters.grouped}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        grouped: event.target.checked,
                      }))
                    }
                  />
                  <span className="h-5 w-9 rounded-full bg-gray-200 transition peer-checked:bg-sky-500" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
                </span>
                <span>Сгруппировать по повторным</span>
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <span className="relative inline-flex h-5 w-9 items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={filters.showAll}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        showAll: event.target.checked,
                      }))
                    }
                  />
                  <span className="h-5 w-9 rounded-full bg-gray-200 transition peer-checked:bg-sky-500" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
                </span>
                <span>Показать все</span>
              </label>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <label className="block min-w-[220px] text-sm text-gray-700">
                <span className="mb-1 block font-medium">
                  Число осмотров на странице
                </span>
                <select
                  value={filters.size}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      size: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                >
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-14 py-3 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                Поиск
              </button>
            </div>
          </form>
        </div>

        <section className="mt-6 space-y-4">
          {isLoading && (
            <div className="rounded-xl bg-[#fefcff] p-4 text-sm text-gray-500">
              Загрузка...
            </div>
          )}
          {isError && (
            <div className="rounded-xl bg-[#fefcff] p-4 text-sm text-red-500">
              Не удалось загрузить консультации
            </div>
          )}

          {!isLoading && !isError && visibleConsultations.length === 0 && (
            <div className="rounded-xl bg-[#fefcff] p-4 text-sm text-gray-500">
              Консультаций пока нет
            </div>
          )}

          {!isLoading && !isError && visibleConsultations.length > 0 && (
            <div className="grid gap-5 xl:grid-cols-2">
              {visibleConsultations.map((inspection) => (
                <article
                  key={inspection.id}
                  className="w-full rounded-xl border border-violet-100 bg-[#fefcff] p-4 shadow-sm transition hover:bg-orange-100"
                >
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-gray-500 px-3 py-1 text-xs font-medium text-white">
                          {formatDate(inspection.date)}
                        </div>
                        <div className="text-base font-bold text-gray-800">
                          Амбулаторный осмотр
                        </div>
                      </div>
                      <Link
                        to={`/inspection/${inspection.id}`}
                        className="text-sm font-medium text-sky-600 hover:text-sky-700"
                      >
                        Детали осмотра
                      </Link>
                    </div>

                    <div>
                      <span className="font-medium text-gray-800">
                        Заключение:
                      </span>{" "}
                      {getConclusionLabel(inspection.conclusion)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        Диагноз:
                      </span>{" "}
                      {inspection.diagnosis?.name || "-"}
                    </div>
                    <div className="text-gray-500/90">
                      Медицинский работник: {inspection.doctor || "-"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !isError && visibleConsultations.length > 0 && (
            <nav className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                onClick={() =>
                  setQueryParams((prev) => ({
                    ...prev,
                    page: Math.max(
                      (prev.page ?? DEFAULT_PAGE) - 1,
                      DEFAULT_PAGE,
                    ),
                  }))
                }
                disabled={(queryParams.page ?? DEFAULT_PAGE) <= DEFAULT_PAGE}
                className={`rounded-lg border px-3 py-1 transition ${
                  (queryParams.page ?? DEFAULT_PAGE) <= DEFAULT_PAGE
                    ? "cursor-not-allowed border-gray-200 text-gray-400"
                    : "border-sky-200 text-sky-700 hover:bg-sky-50"
                }`}
                aria-label="Предыдущая страница консультаций"
              >
                ←
              </button>

              <span className="rounded-lg border border-violet-100 px-4 py-1 text-gray-700">
                Страница {queryParams.page ?? DEFAULT_PAGE}
                {totalPages ? ` из ${totalPages}` : ""}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQueryParams((prev) => ({
                    ...prev,
                    page: (prev.page ?? DEFAULT_PAGE) + 1,
                  }))
                }
                disabled={!hasNextPage}
                className={`rounded-lg border px-3 py-1 transition ${
                  hasNextPage
                    ? "border-sky-200 text-sky-700 hover:bg-sky-50"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
                aria-label="Следующая страница консультаций"
              >
                →
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
};
