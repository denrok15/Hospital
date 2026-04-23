import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { createPatient, loadPatients } from "app/api/patients";
import type { CreatePatientDto, Patient, PatientsQuery } from "app/shared";
import { CreatePatientModal, UserAddIcon } from "app/components";
import {
  CONCLUSIONS_OPTIONS,
  DEFAULT_PAGE,
  DEFAULT_SIZE,
  SIZE_OPTIONS,
} from "app/shared/consts";
import { formatDate, normalizePatients } from "app/utils";

const parsePositiveInt = (value: string | null) => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
};

const CONCLUSION_ORDER = new Map(
  CONCLUSIONS_OPTIONS.map((option, index) => [option.value, index]),
);

const sortConclusions = (values: string[]) => {
  return [...values].sort((a, b) => {
    const orderA = CONCLUSION_ORDER.get(a) ?? Number.POSITIVE_INFINITY;
    const orderB = CONCLUSION_ORDER.get(b) ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
};

const parsePatientsQuery = (searchParams: URLSearchParams): PatientsQuery => {
  const name = searchParams.get("name") ?? "";
  const sorting = searchParams.get("sorting") ?? "";
  const scheduledVisits = searchParams.get("scheduledVisits") === "true";
  const onlyMine = searchParams.get("onlyMine") === "true";
  const pageRaw = parsePositiveInt(searchParams.get("page"));
  const sizeRaw = parsePositiveInt(
    searchParams.get("size") ?? searchParams.get("pageSize"),
  );

  let conclusions = searchParams.getAll("conclusions");
  if (conclusions.length === 0) {
    const raw = searchParams.get("conclusions");
    if (raw) {
      conclusions = raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  const normalizedConclusions = Array.from(new Set(conclusions)).filter(
    Boolean,
  );

  return {
    name,
    conclusions: sortConclusions(normalizedConclusions),
    sorting,
    scheduledVisits,
    onlyMine,
    page: pageRaw ?? DEFAULT_PAGE,
    size: Math.min(Math.max(sizeRaw ?? DEFAULT_SIZE, 1), 10),
  };
};

const buildSearchParams = (query: PatientsQuery) => {
  const params = new URLSearchParams();
  const name = query.name?.trim() ?? "";

  if (name) params.set("name", name);
  sortConclusions(query.conclusions ?? []).forEach((value) => {
    params.append("conclusions", value);
  });
  if (query.sorting) params.set("sorting", query.sorting);
  if (query.scheduledVisits) params.set("scheduledVisits", "true");
  if (query.onlyMine) params.set("onlyMine", "true");

  const hasFilters =
    name.length > 0 ||
    (query.conclusions?.length ?? 0) > 0 ||
    Boolean(query.sorting) ||
    query.scheduledVisits ||
    query.onlyMine;
  const shouldIncludePage =
    (query.page ?? DEFAULT_PAGE) !== DEFAULT_PAGE ||
    (query.size ?? DEFAULT_SIZE) !== DEFAULT_SIZE ||
    hasFilters;

  if (shouldIncludePage) {
    params.set("page", String(query.page ?? DEFAULT_PAGE));
  }
  if ((query.size ?? DEFAULT_SIZE) !== DEFAULT_SIZE) {
    params.set("size", String(query.size ?? DEFAULT_SIZE));
  }

  return params;
};

const extractPaginationMeta = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return { totalItems: null, totalPages: null };
  }

  const data = value as {
    totalCount?: unknown;
    total?: unknown;
    pagination?: {
      totalCount?: unknown;
      total?: unknown;
      count?: unknown; // backend: total pages
    };
  };

  const totalItemsCandidates = [
    data.totalCount,
    data.total,
    data.pagination?.totalCount,
    data.pagination?.total,
  ];
  let totalItems: number | null = null;
  for (const candidate of totalItemsCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      totalItems = candidate;
      break;
    }
  }

  const countPagesCandidate = data.pagination?.count;
  const totalPages =
    typeof countPagesCandidate === "number" &&
    Number.isFinite(countPagesCandidate) &&
    countPagesCandidate > 0
      ? Math.max(1, Math.trunc(countPagesCandidate))
      : null;

  return { totalItems, totalPages };
};

export const PatientPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParams = useMemo(
    () => parsePatientsQuery(searchParams),
    [searchParams],
  );
  const { data, isLoading, isError } = useQuery(loadPatients(queryParams));
  const patients = normalizePatients(data);
  const paginationMeta = useMemo(() => extractPaginationMeta(data), [data]);
  const totalPages =
    paginationMeta.totalPages ??
    (paginationMeta.totalItems
      ? Math.max(
          1,
          Math.ceil(
            paginationMeta.totalItems / (queryParams.size ?? DEFAULT_SIZE),
          ),
        )
      : null);
  const hasNextPage = totalPages
    ? (queryParams.page ?? DEFAULT_PAGE) < totalPages
    : patients.length === (queryParams.size ?? DEFAULT_SIZE);

  const [filters, setFilters] = useState(() => ({
    name: queryParams.name ?? "",
    conclusions: queryParams.conclusions ?? [],
    sorting: queryParams.sorting ?? "",
    scheduledVisits: queryParams.scheduledVisits ?? false,
    onlyMine: queryParams.onlyMine ?? false,
    size: queryParams.size ?? DEFAULT_SIZE,
  }));
  const [isConclusionsOpen, setIsConclusionsOpen] = useState(false);
  const conclusionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isConclusionsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (conclusionsRef.current && !conclusionsRef.current.contains(target)) {
        setIsConclusionsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsConclusionsOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConclusionsOpen]);

  useEffect(() => {
    setFilters({
      name: queryParams.name ?? "",
      conclusions: queryParams.conclusions ?? [],
      sorting: queryParams.sorting ?? "",
      scheduledVisits: queryParams.scheduledVisits ?? false,
      onlyMine: queryParams.onlyMine ?? false,
      size: queryParams.size ?? DEFAULT_SIZE,
    });
  }, [
    queryParams.name,
    queryParams.conclusions,
    queryParams.sorting,
    queryParams.scheduledVisits,
    queryParams.onlyMine,
    queryParams.size,
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreatePatientDto>({
    name: "",
    birthday: "",
    gender: "Male",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: "", birthday: "", gender: "Male" });
    setSubmitError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.birthday) {
      setSubmitError("Заполните все поля");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: CreatePatientDto = {
        name: form.name.trim(),
        birthday: new Date(form.birthday).toISOString(),
        gender: form.gender,
      };
      await createPatient(payload);
      await queryClient.invalidateQueries({ queryKey: ["loadPatients"] });
      closeModal();
    } catch (error) {
      console.error(error);
      setSubmitError("Не удалось зарегистрировать пациента");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedConclusionsText = useMemo(() => {
    if (!filters.conclusions.length) return "Любые";
    const labelByValue = new Map(
      CONCLUSIONS_OPTIONS.map((option) => [option.value, option.label]),
    );
    return sortConclusions(filters.conclusions)
      .map((value) => labelByValue.get(value) ?? value)
      .join(", ");
  }, [filters.conclusions]);

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl bg-transparent p-6">
        <div className="flex items-center justify-between gap-4 border-b border-violet-100 pb-4">
          <h1 className="text-4xl font-semibold text-gray-800">Пациенты</h1>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
            onClick={() => setIsModalOpen(true)}
          >
            <UserAddIcon className="h-4 w-4 text-white" />
            Регистрация нового пациента
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-violet-100 bg-[#fefcff] p-4 shadow-sm">
          <div className="text-lg font-semibold text-gray-800">
            Фильтры и сортировка
          </div>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setIsConclusionsOpen(false);
              const nextParams = buildSearchParams({
                ...filters,
                page: DEFAULT_PAGE,
              });
              setSearchParams(nextParams);
            }}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <label className="block text-sm text-gray-700">
                <span className="mb-1 block font-medium">Имя</span>
                <input
                  value={filters.name}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                  type="text"
                  placeholder="Введите имя пациента"
                />
              </label>

              <label className="block text-sm text-gray-700">
                <span className="mb-1 block font-medium">
                  Имеющиеся заключения
                </span>
                <div className="relative" ref={conclusionsRef}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left outline-none focus:border-sky-400"
                    onClick={() => setIsConclusionsOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isConclusionsOpen}
                  >
                    <span
                      className={
                        filters.conclusions.length
                          ? "text-gray-800"
                          : "text-gray-400"
                      }
                    >
                      {selectedConclusionsText}
                    </span>
                    <span className="ml-3 text-gray-400">▾</span>
                  </button>

                  {isConclusionsOpen && (
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
                              conclusions: sortConclusions(
                                CONCLUSIONS_OPTIONS.map(
                                  (option) => option.value,
                                ),
                              ),
                            }))
                          }
                        >
                          Выбрать все
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, conclusions: [] }))
                          }
                        >
                          Сбросить
                        </button>
                      </div>

                      <div className="space-y-1">
                        {CONCLUSIONS_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-sky-50"
                          >
                            <input
                              type="checkbox"
                              checked={filters.conclusions.includes(
                                option.value,
                              )}
                              onChange={() =>
                                setFilters((prev) => {
                                  const next = prev.conclusions.includes(
                                    option.value,
                                  )
                                    ? prev.conclusions.filter(
                                        (value) => value !== option.value,
                                      )
                                    : [...prev.conclusions, option.value];
                                  return {
                                    ...prev,
                                    conclusions: sortConclusions(
                                      Array.from(new Set(next)),
                                    ),
                                  };
                                })
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] lg:items-center">
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <span className="relative inline-flex h-5 w-9 items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={filters.scheduledVisits}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        scheduledVisits: event.target.checked,
                      }))
                    }
                  />
                  <span className="h-5 w-9 rounded-full bg-gray-200 transition peer-checked:bg-sky-500" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
                </span>
                <span>Есть запланированные заключения</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <span className="relative inline-flex h-5 w-9 items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={filters.onlyMine}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        onlyMine: event.target.checked,
                      }))
                    }
                  />
                  <span className="h-5 w-9 rounded-full bg-gray-200 transition peer-checked:bg-sky-500" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
                </span>
                <span>Мои пациенты</span>
              </label>
              <label className="block text-sm text-gray-700">
                <span className="mb-1 block font-medium">
                  Сортировка пациентов
                </span>
                <select
                  value={filters.sorting}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      sorting: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                >
                  <option value="">Без сортировки</option>
                  <option value="NameAsc">Имя (А-Я)</option>
                  <option value="NameDesc">Имя (Я-А)</option>
                  <option value="CreateDesc">
                    Дата создания (сначала новые)
                  </option>
                  <option value="CreateAsc">
                    Дата создания (сначала старые)
                  </option>
                  <option value="InspectionDesc">
                    Дата осмотров (сначала новые)
                  </option>
                  <option value="InspectionAsc">
                    Дата осмотров (сначала старые)
                  </option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <label className="block min-w-[220px] text-sm text-gray-700">
                <span className="mb-1 block font-medium">
                  Число пациентов на странице
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

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {isLoading && (
            <div className="xl:col-span-2 rounded-xl bg-[#fefcff] p-4 text-sm text-gray-500">
              Загрузка...
            </div>
          )}
          {isError && (
            <div className="xl:col-span-2 rounded-xl bg-[#fefcff] p-4 text-sm text-red-500">
              Не удалось загрузить список пациентов
            </div>
          )}

          {!isLoading && !isError && patients.length === 0 && (
            <div className="xl:col-span-2 rounded-xl bg-[#fefcff] p-4 text-sm text-gray-500">
              Пациентов пока нет
            </div>
          )}

          {patients.map((patient: Patient, index: number) => {
            const cardClassName =
              "block w-full rounded-xl border border-violet-100 bg-[#fefcff] p-4 shadow-sm transition hover:bg-orange-100";
            const content = (
              <>
                <div
                  className="truncate text-base font-semibold text-gray-800"
                  title={patient.name || ""}
                >
                  {patient.name || "ФИО -"}
                </div>
                <div className="mt-2 grid gap-2 text-sm text-gray-600">
                  <div>
                    Пол - {patient.gender === "Male" ? "Мужской" : "Женский"}
                  </div>
                  <div>Дата рождения - {formatDate(patient.birthday)}</div>
                </div>
              </>
            );

            if (!patient.id) {
              return (
                <div key={`${patient.name}-${index}`} className={cardClassName}>
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={patient.id}
                to={`/patient/${patient.id}`}
                className={cardClassName}
              >
                {content}
              </Link>
            );
          })}
        </div>

        {!isLoading && !isError && patients.length > 0 && (
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
            <Link
              to={{
                pathname: "/patients",
                search: (() => {
                  const params = buildSearchParams({
                    ...queryParams,
                    page: Math.max((queryParams.page ?? DEFAULT_PAGE) - 1, 1),
                  });
                  const search = params.toString();
                  return search ? `?${search}` : "";
                })(),
              }}
              className={`rounded-lg border px-3 py-1 transition ${
                (queryParams.page ?? DEFAULT_PAGE) === 1
                  ? "pointer-events-none border-gray-200 text-gray-400"
                  : "border-sky-200 text-sky-700 hover:bg-sky-50"
              }`}
              aria-label="Предыдущая страница"
            >
              ←
            </Link>

            {(() => {
              const currentPage = queryParams.page ?? DEFAULT_PAGE;
              let pages: number[] = [];
              if (totalPages) {
                const windowSize = 5;
                let start = Math.max(currentPage - 2, 1);
                const end = Math.min(start + windowSize - 1, totalPages);
                if (end - start < windowSize - 1) {
                  start = Math.max(end - windowSize + 1, 1);
                }
                pages = Array.from(
                  { length: end - start + 1 },
                  (_, idx) => start + idx,
                );
              } else {
                pages = [currentPage - 1, currentPage, currentPage + 1].filter(
                  (page) => page >= 1,
                );
              }

              return pages.map((page) => {
                const params = buildSearchParams({ ...queryParams, page });
                const search = params.toString();
                const isActive = page === currentPage;
                return (
                  <Link
                    key={page}
                    to={{
                      pathname: "/patients",
                      search: search ? `?${search}` : "",
                    }}
                    className={`rounded-lg border px-3 py-1 transition ${
                      isActive
                        ? "border-sky-500 bg-sky-500 text-white"
                        : "border-sky-200 text-sky-700 hover:bg-sky-50"
                    }`}
                  >
                    {page}
                  </Link>
                );
              });
            })()}

            <Link
              to={{
                pathname: "/patients",
                search: (() => {
                  const params = buildSearchParams({
                    ...queryParams,
                    page: (queryParams.page ?? DEFAULT_PAGE) + 1,
                  });
                  const search = params.toString();
                  return search ? `?${search}` : "";
                })(),
              }}
              className={`rounded-lg border px-3 py-1 transition ${
                hasNextPage
                  ? "border-sky-200 text-sky-700 hover:bg-sky-50"
                  : "pointer-events-none border-gray-200 text-gray-400"
              }`}
              aria-label="Следующая страница"
            >
              →
            </Link>
          </nav>
        )}
      </div>

      <CreatePatientModal
        isOpen={isModalOpen}
        form={form}
        submitError={submitError}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onFormChange={(patch) =>
          setForm((prev) => ({
            ...prev,
            ...patch,
          }))
        }
      />
    </div>
  );
};
