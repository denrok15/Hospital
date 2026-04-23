import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { generateIcdRootsReport } from "app/api/report";
import { loadIcdRoots } from "app/api/patients";
import type { IcdRoot, IcdRootsReportResponse } from "app/shared";
import { formatDate, getGenderLabel } from "app/utils";
import { normalizeIcdRoots } from "app/utils";
import {
  toInputDate,
  toStartOfDayIso,
  toEndOfDayIso,
} from "app/utils";

const getIcdRootLabel = (root: IcdRoot) =>
  [root.code, root.name].filter(Boolean).join(" - ") || root.id;

const sortRootIdsByLabel = (ids: string[], rootById: Map<string, IcdRoot>) => {
  return [...ids].sort((a, b) =>
    getIcdRootLabel(rootById.get(a) ?? { id: a }).localeCompare(
      getIcdRootLabel(rootById.get(b) ?? { id: b }),
      "en",
      { numeric: true, sensitivity: "base" },
    ),
  );
};

const getVisibleRoots = (
  report: IcdRootsReportResponse | undefined,
  selectedRoots: string[],
  rootById: Map<string, IcdRoot>,
) => {
  if (report) {
    const fromFilters = report.filters?.icdRoots ?? [];
    const roots = fromFilters.length
      ? fromFilters
      : Object.keys(report.summaryByRoot ?? {});
    return sortRootIdsByLabel(roots, rootById);
  }
  if (selectedRoots.length > 0) return sortRootIdsByLabel(selectedRoots, rootById);
  return [];
};

export const ReportsPage = () => {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(toInputDate(oneYearAgo));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [selectedRoots, setSelectedRoots] = useState<string[]>([]);

  const { data: icdRootsData } = useQuery(loadIcdRoots());
  const icdRoots = useMemo(() => normalizeIcdRoots(icdRootsData), [icdRootsData]);
  const sortedIcdRoots = useMemo(
    () =>
      [...icdRoots].sort((a, b) =>
        getIcdRootLabel(a).localeCompare(getIcdRootLabel(b), "en", {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    [icdRoots],
  );
  const icdRootById = useMemo(
    () => new Map(icdRoots.map((root) => [root.id, root])),
    [icdRoots],
  );

  const reportMutation = useMutation({
    mutationFn: generateIcdRootsReport,
  });

  const report = reportMutation.data;

  const visibleRoots = useMemo(
    () => getVisibleRoots(report, selectedRoots, icdRootById),
    [icdRootById, report, selectedRoots],
  );

  const handleRootToggle = (root: string) => {
    setSelectedRoots((prev) =>
      prev.includes(root)
        ? prev.filter((item) => item !== root)
        : [...prev, root],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reportMutation.mutate({
      start: toStartOfDayIso(startDate),
      end: toEndOfDayIso(endDate),
      icdRoots:
        selectedRoots.length > 0
          ? sortRootIdsByLabel(selectedRoots, icdRootById)
          : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-7xl rounded-2xl bg-transparent p-6">
        <div className="border-b border-violet-100 pb-4">
          <h1 className="text-4xl font-semibold text-gray-800">
            Отчет по статистике осмотров
          </h1>
        </div>

        <form
          className="mt-6 rounded-xl border border-violet-100 bg-[#fefcff] p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              <span className="mb-1 block font-medium">Период: с</span>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
              />
            </label>

            <label className="block text-sm text-gray-700">
              <span className="mb-1 block font-medium">Период: по</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
              />
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-medium text-gray-700">
              Корни МКБ-10
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-sky-200 px-3 py-1 text-xs text-sky-700 hover:bg-sky-50"
                disabled={sortedIcdRoots.length === 0}
                onClick={() => setSelectedRoots(sortedIcdRoots.map((root) => root.id))}
              >
                Выбрать все
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                onClick={() => setSelectedRoots([])}
              >
                Сбросить выбор
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {sortedIcdRoots.map((root) => (
                <label
                  key={root.id}
                  className="flex h-12 items-center gap-2 rounded-md border border-violet-100 bg-white px-3 text-sm text-gray-700 hover:bg-sky-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoots.includes(root.id)}
                    onChange={() => handleRootToggle(root.id)}
                  />
                  <span
                    className="min-w-0 flex-1 truncate"
                    title={getIcdRootLabel(root)}
                  >
                    {getIcdRootLabel(root)}
                  </span>
                </label>
              ))}
              {sortedIcdRoots.length === 0 && (
                <div className="text-sm text-gray-500">
                  Загрузка справочника МКБ-10...
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Если ничего не выбрать, отчет строится по всем корням.
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={reportMutation.isPending}
              className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              {reportMutation.isPending
                ? "Формирование..."
                : "Сформировать отчет"}
            </button>
          </div>
        </form>

        {reportMutation.isError && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Не удалось сформировать отчет
          </div>
        )}

        {report && (
          <section className="mt-6 space-y-4">
            <div className="text-sm text-gray-700">
              Период отчета: <b>{formatDate(report.filters.start)}</b> -{" "}
              <b>{formatDate(report.filters.end)}</b>
            </div>

            <div className="overflow-x-auto rounded-xl border border-violet-100">
              <table className="min-w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-[#f3edff] text-gray-800">
                    <th className="border border-violet-100 px-3 py-2 text-left">
                      Пациент
                    </th>
                    <th className="border border-violet-100 px-3 py-2 text-left">
                      Дата рождения
                    </th>
                    <th className="border border-violet-100 px-3 py-2 text-left">
                      Пол
                    </th>
                    {visibleRoots.map((root) => (
                      <th
                        key={root}
                        className="border border-violet-100 px-3 py-2 text-center whitespace-nowrap"
                      >
                        {getIcdRootLabel(icdRootById.get(root) ?? { id: root })}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {report.records.length === 0 && (
                    <tr>
                      <td
                        colSpan={3 + visibleRoots.length}
                        className="border border-violet-100 px-3 py-4 text-center text-gray-500"
                      >
                        Нет данных за выбранный период
                      </td>
                    </tr>
                  )}

                  {report.records.map((record, index) => (
                    <tr
                      key={`${record.patientName}-${index}`}
                      className="hover:bg-orange-50"
                    >
                      <td className="border border-violet-100 px-3 py-2">
                        {record.patientName || "-"}
                      </td>
                      <td className="border border-violet-100 px-3 py-2">
                        {formatDate(record.patientBirthdate)}
                      </td>
                      <td className="border border-violet-100 px-3 py-2">
                        {getGenderLabel(record.gender)}
                      </td>
                      {visibleRoots.map((root) => (
                        <td
                          key={`${record.patientName}-${index}-${root}`}
                          className="border border-violet-100 px-3 py-2 text-center"
                        >
                          {record.visitsByRoot?.[root] ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr className="bg-[#f8f5ff] font-semibold text-gray-800">
                    <td
                      className="border border-violet-100 px-3 py-2"
                      colSpan={3}
                    >
                      Итого
                    </td>
                    {visibleRoots.map((root) => (
                      <td
                        key={`summary-${root}`}
                        className="border border-violet-100 px-3 py-2 text-center"
                      >
                        {report.summaryByRoot?.[root] ?? 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
