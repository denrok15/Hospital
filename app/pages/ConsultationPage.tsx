import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { loadConsultations, loadInspectionChain } from "app/api/consultations";
import { loadIcdRoots } from "app/api/patients";
import type {
  ConsultationInspection,
  ConsultationQuery,
  ConsultationsResponse,
  IcdRoot,
} from "app/shared";
import { DEFAULT_PAGE, DEFAULT_SIZE, SIZE_OPTIONS } from "app/shared/consts";
import {
  formatDate,
  getConclusionLabel,
  normalizeConsultations,
  normalizeIcdRoots,
} from "app/utils";
import { SearchIcon } from "app/components/icons";

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
  data: ConsultationInspection[] | ConsultationsResponse | undefined,
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
  data: ConsultationInspection[] | ConsultationsResponse | undefined,
) => {
  if (!data || Array.isArray(data)) return null;
  const candidate = data.pagination?.count;
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) return null;
  if (candidate <= 0) return null;
  return Math.max(1, Math.trunc(candidate));
};

const buildChildrenByParentId = (
  rootId: string,
  items: ConsultationInspection[],
) => {
  const map = new Map<string, ConsultationInspection[]>();

  items.forEach((item) => {
    if (item.id === rootId) return;
    const parentId =
      item.previousId && item.previousId !== item.id ? item.previousId : rootId;
    const bucket = map.get(parentId) ?? [];
    bucket.push(item);
    map.set(parentId, bucket);
  });

  map.forEach((bucket) => {
    bucket.sort((a, b) => {
      const dateDelta = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (Number.isFinite(dateDelta) && dateDelta !== 0) return dateDelta;
      if (a.createTime && b.createTime) {
        const ctDelta =
          new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
        if (Number.isFinite(ctDelta) && ctDelta !== 0) return ctDelta;
      }
      return a.id.localeCompare(b.id);
    });
  });

  return map;
};

const ConsultationCard = ({
  inspection,
  grouped,
  expandedInspectionIds,
  setExpandedInspectionIds,
  childrenByParentId,
  chainStatus = "idle",
  onToggleExpand,
  depth = 0,
}: {
  inspection: ConsultationInspection;
  grouped: boolean;
  expandedInspectionIds: string[];
  setExpandedInspectionIds: React.Dispatch<React.SetStateAction<string[]>>;
  childrenByParentId?: Map<string, ConsultationInspection[]>;
  chainStatus?: "idle" | "loading" | "success" | "error";
  onToggleExpand?: () => void;
  depth?: number;
}) => {
  const hasChildren = (childrenByParentId?.get(inspection.id)?.length ?? 0) > 0;
  const canExpand =
    grouped &&
    (hasChildren || Boolean(inspection.hasChain || inspection.hasNested));
  const isExpanded = expandedInspectionIds.includes(inspection.id);

  const directChildren = useMemo(() => {
    if (!canExpand || !isExpanded) return [];
    if (!childrenByParentId) return [];
    return childrenByParentId.get(inspection.id) ?? [];
  }, [canExpand, childrenByParentId, inspection.id, isExpanded]);

  const marginLeft = Math.min(depth, 2) * 24;

  return (
    <div style={depth ? { marginLeft } : undefined} className="w-full">
      <article className="w-full rounded-xl border border-violet-100 bg-[#fefcff] p-4 shadow-sm transition hover:bg-orange-100">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {canExpand && (
                <button
                  type="button"
                  onClick={
                    onToggleExpand ??
                    (() =>
                      setExpandedInspectionIds((prev) =>
                        prev.includes(inspection.id)
                          ? prev.filter((value) => value !== inspection.id)
                          : [...prev, inspection.id],
                      ))
                  }
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-600 text-sm font-bold text-white hover:bg-sky-700"
                  aria-label={
                    isExpanded
                      ? "Скрыть дочерние осмотры"
                      : "Показать дочерние осмотры"
                  }
                >
                  {isExpanded ? "-" : "+"}
                </button>
              )}
              <div className="rounded-md bg-gray-500 px-3 py-1 text-xs font-medium text-white">
                {formatDate(inspection.date)}
              </div>
              <div className="text-base font-bold text-gray-800">
                Амбулаторный осмотр
              </div>
            </div>
            <Link
              to={`/inspection/${inspection.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              <SearchIcon className="h-4 w-4 text-sky-600" />
              Детали осмотра
            </Link>
          </div>

          <div>
            <span className="font-medium text-gray-800">Заключение:</span>{" "}
            {getConclusionLabel(inspection.conclusion)}
          </div>
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 font-medium text-gray-800">Диагноз:</span>
            <span
              className="min-w-0 flex-1 lg:truncate"
              title={inspection.diagnosis?.name || ""}
            >
              {inspection.diagnosis?.name || "-"}
            </span>
          </div>
          <div className="text-gray-500/90 lg:truncate" title={inspection.doctor || ""}>
            Медицинский работник: {inspection.doctor || "-"}
          </div>
        </div>
      </article>

      {canExpand && isExpanded && (
        <div className="mt-3 space-y-3">
          {chainStatus === "loading" && (
            <div className="rounded-xl bg-[#fefcff] p-4 text-sm text-gray-500">
              Загрузка цепочки...
            </div>
          )}
          {chainStatus === "error" && (
            <div className="rounded-xl bg-[#fefcff] p-4 text-sm text-red-500">
              Не удалось загрузить цепочку осмотров
            </div>
          )}
          {chainStatus === "success" &&
            directChildren.map((child) => (
              <ConsultationCard
                key={child.id}
                inspection={child}
                grouped={grouped}
                expandedInspectionIds={expandedInspectionIds}
                setExpandedInspectionIds={setExpandedInspectionIds}
                childrenByParentId={childrenByParentId}
                chainStatus="success"
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const ConsultationPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    icdRoots: [] as string[],
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
  const [expandedInspectionIds, setExpandedInspectionIds] = useState<string[]>(
    [],
  );
  const [chainByRootId, setChainByRootId] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "success" | "error";
        childrenByParentId?: Map<string, ConsultationInspection[]>;
      }
    >
  >({});
  const [isIcdRootsOpen, setIsIcdRootsOpen] = useState(false);
  const icdRootsRef = useRef<HTMLDivElement | null>(null);

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
  const sortedIcdRoots = useMemo(() => sortIcdRootsByLabel(icdRoots), [icdRoots]);
  const icdRootById = useMemo(
    () => new Map(icdRoots.map((root) => [root.id, root])),
    [icdRoots],
  );

  const consultationsToRender = useMemo(() => {
    if (!queryParams.grouped) return consultations;
    const ids = new Set(consultations.map((inspection) => inspection.id));
    return consultations.filter((inspection) => {
      if (!inspection.previousId || inspection.previousId === inspection.id) {
        return true;
      }
      return !ids.has(inspection.previousId);
    });
  }, [consultations, queryParams.grouped]);

  const visibleConsultations = useMemo(() => {
    if (filters.showAll) return consultationsToRender;
    return consultationsToRender.filter(
      (inspection) =>
        !inspection.previousId || inspection.previousId === inspection.id,
    );
  }, [consultationsToRender, filters.showAll]);

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

  const totalCount = useMemo(
    () => extractTotalCount(consultationsData),
    [consultationsData],
  );
  const totalPagesFromServer = useMemo(
    () => extractTotalPages(consultationsData),
    [consultationsData],
  );
  const totalPages =
    totalPagesFromServer ??
    (totalCount
      ? Math.max(1, Math.ceil(totalCount / (queryParams.size ?? DEFAULT_SIZE)))
      : null);
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
                icdRoots: filters.icdRoots,
                page: DEFAULT_PAGE,
                size: filters.size,
              });
              setExpandedInspectionIds([]);
              setChainByRootId({});
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
                        filters.icdRoots.length ? "text-gray-800" : "text-gray-400"
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
                                    ? prev.icdRoots.filter((value) => value !== root.id)
                                    : [...prev.icdRoots, root.id];
                                  const normalized = Array.from(new Set(next));
                                  normalized.sort((a, b) =>
                                    getIcdRootLabel(icdRootById.get(a) ?? { id: a })
                                      .localeCompare(
                                        getIcdRootLabel(icdRootById.get(b) ?? { id: b }),
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
                    onChange={(event) => {
                      const nextGrouped = event.target.checked;
                      setFilters((prev) => ({
                        ...prev,
                        grouped: nextGrouped,
                      }));
                      setQueryParams((prev) => ({
                        ...prev,
                        grouped: nextGrouped,
                        page: DEFAULT_PAGE,
                      }));
                      setExpandedInspectionIds([]);
                      setChainByRootId({});
                    }}
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
            <div className="grid items-start gap-5 xl:grid-cols-2">
              {visibleConsultations.map((inspection) => {
                const rootChainState = chainByRootId[inspection.id] ?? {
                  status: "idle" as const,
                };

                const grouped = Boolean(queryParams.grouped);
                const canExpandRoot =
                  grouped && Boolean(inspection.hasChain || inspection.hasNested);
                const isRootExpanded = expandedInspectionIds.includes(
                  inspection.id,
                );

                const ensureRootChainLoaded = async () => {
                  setChainByRootId((prev) => ({
                    ...prev,
                    [inspection.id]: {
                      status: prev[inspection.id]?.status === "success" ? "success" : "loading",
                      childrenByParentId: prev[inspection.id]?.childrenByParentId,
                    },
                  }));

                  try {
                    const data = await queryClient.fetchQuery({
                      ...loadInspectionChain(inspection.id),
                    });
                    const items = normalizeConsultations(data);
                    const childrenByParentId = buildChildrenByParentId(
                      inspection.id,
                      items,
                    );
                    setChainByRootId((prev) => ({
                      ...prev,
                      [inspection.id]: { status: "success", childrenByParentId },
                    }));
                  } catch (error) {
                    console.error(error);
                    setChainByRootId((prev) => ({
                      ...prev,
                      [inspection.id]: { status: "error" },
                    }));
                  }
                };

                const onToggleRootExpand = () => {
                  if (!canExpandRoot) return;
                  const willExpand = !isRootExpanded;
                  setExpandedInspectionIds((prev) =>
                    prev.includes(inspection.id)
                      ? prev.filter((value) => value !== inspection.id)
                      : [...prev, inspection.id],
                  );

                  if (
                    willExpand &&
                    rootChainState.status !== "success" &&
                    rootChainState.status !== "loading"
                  ) {
                    void ensureRootChainLoaded();
                  }
                };

                const effectiveChainStatus = canExpandRoot
                  ? isRootExpanded
                    ? rootChainState.status
                    : "idle"
                  : "idle";

                return (
                  <ConsultationCard
                    key={inspection.id}
                    inspection={inspection}
                    grouped={grouped}
                    expandedInspectionIds={expandedInspectionIds}
                    setExpandedInspectionIds={setExpandedInspectionIds}
                    childrenByParentId={rootChainState.childrenByParentId}
                    chainStatus={effectiveChainStatus}
                    onToggleExpand={onToggleRootExpand}
                  />
                );
              })}
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
