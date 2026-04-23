import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  loadIcdRoots,
  loadPatient,
  loadPatientInspections,
} from "app/api/patients";
import { PencilIcon, SearchIcon } from "app/components";
import type {
  IcdRoot,
  Inspection,
  InspectionsResponse,
  PatientInspectionsQuery,
} from "app/shared";
import { SIZE_OPTIONS, DEFAULT_PAGE, DEFAULT_SIZE } from "app/shared/consts";
import {
  formatDate,
  getGenderLabel,
  getGenderIcon,
  getConclusionLabel,
  normalizeInspections,
  normalizeIcdRoots,
} from "app/utils";

const getIcdRootLabel = (root: IcdRoot) =>
  [root.code, root.name].filter(Boolean).join(" - ") || root.id;

const sortIcdRootsByLabel = (roots: IcdRoot[]) => {
  return [...roots].sort((a, b) =>
    getIcdRootLabel(a).localeCompare(getIcdRootLabel(b), "en", {
      numeric: true,
      sensitivity: "base",
    }),
  );
};

const extractTotalCount = (
  data: Inspection[] | InspectionsResponse | undefined,
) => {
  if (!data || Array.isArray(data)) return null;
  const candidates = [
    data.totalCount,
    data.total,
    data.pagination?.totalCount,
    data.pagination?.total,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
};

const extractTotalPages = (
  data: Inspection[] | InspectionsResponse | undefined,
) => {
  if (!data || Array.isArray(data)) return null;
  const candidate = data.pagination?.count;
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) return null;
  if (candidate <= 0) return null;
  return Math.max(1, Math.trunc(candidate));
};

export const PatientCardPage = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [filters, setFilters] = useState({
    icdRoots: [] as string[],
    grouped: false,
    showAll: true,
    size: DEFAULT_SIZE,
  });
  const [inspectionsQuery, setInspectionsQuery] =
    useState<PatientInspectionsQuery>({
      grouped: false,
      icdRoots: [],
      page: DEFAULT_PAGE,
      size: DEFAULT_SIZE,
    });
  const [expandedInspectionIds, setExpandedInspectionIds] = useState<string[]>(
    [],
  );
  const [isIcdRootsOpen, setIsIcdRootsOpen] = useState(false);
  const icdRootsRef = useRef<HTMLDivElement | null>(null);

  const {
    data: patient,
    isLoading: isPatientLoading,
    isError: isPatientError,
  } = useQuery({
    ...loadPatient(id),
    enabled: Boolean(id),
  });

  const {
    data: inspectionsData,
    isLoading: isInspectionsLoading,
    isError: isInspectionsError,
  } = useQuery({
    ...loadPatientInspections(id, inspectionsQuery),
    enabled: Boolean(id),
  });
  const { data: allInspectionsForChainData } = useQuery({
    ...loadPatientInspections(id, {
      grouped: false,
      page: 1,
      size: 1000,
    }),
    enabled: Boolean(id) && Boolean(inspectionsQuery.grouped),
  });
  const { data: icdRootsData } = useQuery(loadIcdRoots());

  const inspections = useMemo(
    () => normalizeInspections(inspectionsData),
    [inspectionsData],
  );
  const allInspectionsForChain = useMemo(
    () => normalizeInspections(allInspectionsForChainData),
    [allInspectionsForChainData],
  );
  const icdRoots = useMemo(
    () => normalizeIcdRoots(icdRootsData),
    [icdRootsData],
  );
  const sortedIcdRoots = useMemo(
    () => sortIcdRootsByLabel(icdRoots),
    [icdRoots],
  );
  const icdRootById = useMemo(
    () => new Map(icdRoots.map((root) => [root.id, root])),
    [icdRoots],
  );
  const totalCount = useMemo(
    () => extractTotalCount(inspectionsData),
    [inspectionsData],
  );
  const totalPagesFromServer = useMemo(
    () => extractTotalPages(inspectionsData),
    [inspectionsData],
  );
  const totalPages =
    totalPagesFromServer ??
    (totalCount
      ? Math.max(
          1,
          Math.ceil(totalCount / (inspectionsQuery.size ?? DEFAULT_SIZE)),
        )
      : null);
  const hasNextPage = totalPages
    ? (inspectionsQuery.page ?? DEFAULT_PAGE) < totalPages
    : inspections.length === (inspectionsQuery.size ?? DEFAULT_SIZE);

  const childrenByPreviousId = useMemo(() => {
    const map = new Map<string, Inspection[]>();
    const source = inspectionsQuery.grouped
      ? allInspectionsForChain
      : inspections;
    source.forEach((inspection) => {
      if (inspection.previousId && inspection.previousId !== inspection.id) {
        const bucket = map.get(inspection.previousId) ?? [];
        bucket.push(inspection);
        map.set(inspection.previousId, bucket);
      }
    });
    return map;
  }, [allInspectionsForChain, inspections, inspectionsQuery.grouped]);

  const inspectionsToRender = useMemo(() => {
    if (!inspectionsQuery.grouped) return inspections;
    const ids = new Set(inspections.map((inspection) => inspection.id));
    return inspections.filter((inspection) => {
      if (!inspection.previousId || inspection.previousId === inspection.id) {
        return true;
      }
      return !ids.has(inspection.previousId);
    });
  }, [inspections, inspectionsQuery.grouped]);
  const visibleInspections = useMemo(() => {
    if (filters.showAll) return inspectionsToRender;
    return inspectionsToRender.filter(
      (inspection) =>
        !inspection.previousId || inspection.previousId === inspection.id,
    );
  }, [filters.showAll, inspectionsToRender]);

  useEffect(() => {
    if (!isIcdRootsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (icdRootsRef.current && !icdRootsRef.current.contains(target)) {
        setIsIcdRootsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsIcdRootsOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isIcdRootsOpen]);

  const selectedIcdRootsText = useMemo(() => {
    if (!filters.icdRoots.length) return "Все корни";
    return filters.icdRoots
      .map((id) => {
        const root = icdRootById.get(id);
        return root ? getIcdRootLabel(root) : id;
      })
      .join(", ");
  }, [filters.icdRoots, icdRootById]);

  if (!id) {
    return (
      <div className="min-h-screen bg-white px-4 py-10">
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
          Некорректный id пациента в адресе
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl bg-transparent p-6">
        <div className="flex items-center justify-between gap-4 border-b border-violet-100 pb-4">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">
              Медицинская карта пациента
            </h1>
            {!isPatientLoading && !isPatientError && patient && (
              <div className="mt-2 flex items-center gap-2 text-lg text-gray-700">
                <span className="font-medium">{patient.name || "-"}</span>
                <span
                  title={getGenderLabel(patient.gender)}
                  aria-label={getGenderLabel(patient.gender)}
                  className="text-xl leading-none text-sky-700"
                >
                  {getGenderIcon(patient.gender)}
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-7 py-3 text-sm font-medium text-white transition hover:bg-sky-600"
              onClick={() => navigate(`/inspection/create?patientId=${id}`)}
            >
              Добавить осмотр
            </button>
            {!isPatientLoading && !isPatientError && patient && (
              <div className="mt-2 text-sm text-gray-700">
                Дата рождения: {formatDate(patient.birthday)}
              </div>
            )}
          </div>
        </div>

        {isPatientLoading && (
          <div className="mt-4 text-sm text-gray-500">Загрузка...</div>
        )}
        {isPatientError && (
          <div className="mt-4 text-sm text-red-500">
            Не удалось загрузить данные пациента
          </div>
        )}

        <div className="mt-6 rounded-xl border border-violet-100 bg-[#fefcff] p-4 shadow-sm">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setInspectionsQuery({
                grouped: filters.grouped,
                icdRoots: filters.icdRoots,
                page: DEFAULT_PAGE,
                size: filters.size,
              });
              setExpandedInspectionIds([]);
              setIsIcdRootsOpen(false);
            }}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
              <label className="block text-sm text-gray-700">
                <span className="mb-1 block font-medium">МКБ-10</span>
                <div className="relative" ref={icdRootsRef}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left outline-none focus:border-sky-400"
                    onClick={() => setIsIcdRootsOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isIcdRootsOpen}
                  >
                    <span
                      className={
                        filters.icdRoots.length
                          ? "text-gray-800"
                          : "text-gray-400"
                      }
                    >
                      {selectedIcdRootsText}
                    </span>
                    <span className="ml-3 text-gray-400">▾</span>
                  </button>

                  {isIcdRootsOpen && (
                    <div
                      className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
                      role="listbox"
                    >
                      <div className="mb-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-sky-200 px-3 py-1 text-xs text-sky-700 hover:bg-sky-50"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              icdRoots: sortedIcdRoots.map((root) => root.id),
                            }))
                          }
                        >
                          Выбрать все
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, icdRoots: [] }))
                          }
                        >
                          Сбросить
                        </button>
                      </div>

                      <div className="max-h-64 space-y-1 overflow-auto">
                        {sortedIcdRoots.map((root) => (
                          <label
                            key={root.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-sky-50"
                          >
                            <input
                              type="checkbox"
                              checked={filters.icdRoots.includes(root.id)}
                              onChange={() =>
                                setFilters((prev) => {
                                  const next = prev.icdRoots.includes(root.id)
                                    ? prev.icdRoots.filter(
                                        (value) => value !== root.id,
                                      )
                                    : [...prev.icdRoots, root.id];
                                  const normalized = Array.from(new Set(next));
                                  normalized.sort((a, b) =>
                                    getIcdRootLabel(
                                      icdRootById.get(a) ?? { id: a },
                                    ).localeCompare(
                                      getIcdRootLabel(
                                        icdRootById.get(b) ?? { id: b },
                                      ),
                                      "en",
                                      { numeric: true, sensitivity: "base" },
                                    ),
                                  );
                                  return { ...prev, icdRoots: normalized };
                                })
                              }
                            />
                            <span>{getIcdRootLabel(root)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
          {isInspectionsLoading && (
            <div className="mt-4 text-sm text-gray-500">Загрузка...</div>
          )}
          {isInspectionsError && (
            <div className="mt-4 text-sm text-red-500">
              Не удалось загрузить осмотры
            </div>
          )}

          {!isInspectionsLoading &&
            !isInspectionsError &&
            visibleInspections.length === 0 && (
              <div className="mt-4 text-sm text-gray-500">
                Осмотров пока нет
              </div>
            )}

          {!isInspectionsLoading &&
            !isInspectionsError &&
            visibleInspections.length > 0 && (
              <div className="grid gap-5 xl:grid-cols-2">
                {visibleInspections.map((inspection) => {
                  const renderInspectionCard = (
                    current: Inspection,
                    depth: number,
                  ): ReactNode => {
                    const hasChildrenInData =
                      (childrenByPreviousId.get(current.id)?.length ?? 0) > 0;
                    const canExpandByFlag =
                      current.hasNested || current.hasChain;
                    const canExpand = canExpandByFlag || hasChildrenInData;
                    const isExpanded = expandedInspectionIds.includes(
                      current.id,
                    );
                    const marginLeft = Math.min(depth, 2) * 24;

                    return (
                      <div key={current.id} style={{ marginLeft }}>
                        <article className="w-full rounded-xl border border-violet-100 bg-[#fefcff] p-4 shadow-sm transition hover:bg-orange-100">
                          <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {inspectionsQuery.grouped && canExpand && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedInspectionIds((prev) =>
                                        prev.includes(current.id)
                                          ? prev.filter(
                                              (value) => value !== current.id,
                                            )
                                          : [...prev, current.id],
                                      )
                                    }
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-600 text-sm font-bold text-white hover:bg-sky-700"
                                    aria-label={
                                      isExpanded
                                        ? "Скрыть следующий осмотр"
                                        : "Показать следующий осмотр"
                                    }
                                  >
                                    {isExpanded ? "-" : "+"}
                                  </button>
                                )}
                                <div className="rounded-md bg-gray-500 px-3 py-1 text-xs font-medium text-white">
                                  {formatDate(current.date)}
                                </div>
                                <div className="text-lg font-bold text-gray-800">
                                  Амбулаторный осмотр
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {!current.hasNested && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/inspection/create?patientId=${id}&previousInspectionId=${current.id}`,
                                      )
                                    }
                                    className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
                                  >
                                    <PencilIcon className="h-4 w-4 text-sky-600" />
                                    Добавить осмотр
                                  </button>
                                )}
                                <Link
                                  to={`/inspection/${current.id}`}
                                  className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
                                >
                                  <SearchIcon className="h-4 w-4 text-sky-600" />
                                  Детали осмотра
                                </Link>
                              </div>
                            </div>

                            <div>
                              <span className="font-medium text-gray-800">
                                Заключение:
                              </span>{" "}
                              {getConclusionLabel(current.conclusion)}
                            </div>

                            <div className="flex min-w-0 items-baseline gap-2">
                              <span className="shrink-0 font-medium text-gray-800">
                                Основный диагноз:
                              </span>
                              <span
                                className="min-w-0 flex-1 lg:truncate"
                                title={current.diagnosis?.name || ""}
                              >
                                {current.diagnosis?.name || "-"}
                              </span>
                            </div>

                            <div
                              className="text-gray-500/90 lg:truncate"
                              title={current.doctor || ""}
                            >
                              Медицинский работник: {current.doctor || "-"}
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                  };

                  const firstCard = renderInspectionCard(inspection, 0);
                  if (!inspectionsQuery.grouped) return firstCard;

                  const chain: Inspection[] = [inspection];
                  let current = inspection;
                  let safety = 0;
                  while (safety < 20) {
                    const isExpanded = expandedInspectionIds.includes(
                      current.id,
                    );
                    if (!isExpanded) break;
                    const nextInspection = childrenByPreviousId.get(
                      current.id,
                    )?.[0];
                    if (!nextInspection) break;
                    chain.push(nextInspection);
                    current = nextInspection;
                    safety += 1;
                  }

                  return (
                    <div key={inspection.id} className="space-y-3">
                      {chain.map((chainInspection, index) =>
                        renderInspectionCard(chainInspection, index),
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          {!isInspectionsLoading &&
            !isInspectionsError &&
            visibleInspections.length > 0 && (
              <nav className="mt-4 flex items-center justify-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setInspectionsQuery((prev) => ({
                      ...prev,
                      page: Math.max(
                        (prev.page ?? DEFAULT_PAGE) - 1,
                        DEFAULT_PAGE,
                      ),
                    }))
                  }
                  disabled={
                    (inspectionsQuery.page ?? DEFAULT_PAGE) <= DEFAULT_PAGE
                  }
                  className={`rounded-lg border px-3 py-1 transition ${
                    (inspectionsQuery.page ?? DEFAULT_PAGE) <= DEFAULT_PAGE
                      ? "cursor-not-allowed border-gray-200 text-gray-400"
                      : "border-sky-200 text-sky-700 hover:bg-sky-50"
                  }`}
                  aria-label="Предыдущая страница осмотров"
                >
                  ←
                </button>

                <span className="rounded-lg border border-violet-100 px-4 py-1 text-gray-700">
                  Страница {inspectionsQuery.page ?? DEFAULT_PAGE}
                  {totalPages ? ` из ${totalPages}` : ""}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setInspectionsQuery((prev) => ({
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
                  aria-label="Следующая страница осмотров"
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
