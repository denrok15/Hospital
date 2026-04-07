import { useMemo, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  generateIcdRootsReport,
  type IcdRootsReportResponse,
} from "app/api/report";

const DEFAULT_ICD_ROOTS = [
  "A00-B99",
  "C00-D48",
  "D50-D89",
  "E00-E90",
  "F00-F99",
  "G00-G99",
  "H00-H59",
  "H60-H95",
  "I00-I99",
  "J00-J99",
  "K00-K93",
  "L00-L99",
  "M00-M99",
  "N00-N99",
  "O00-O99",
  "P00-P96",
  "Q00-Q99",
  "R00-R99",
  "S00-T98",
  "U00-U85",
  "V01-Y98",
  "Z00-Z99",
];

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const toStartOfDayIso = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return date.toISOString();
};

const toEndOfDayIso = (value: string) => {
  const date = new Date(`${value}T23:59:59.999`);
  return date.toISOString();
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ru-RU");
};

const getGenderLabel = (value?: string) => {
  if (!value) return "-";
  if (value === "Male") return "Мужской";
  if (value === "Female") return "Женский";
  return value;
};

const sortIcdRoots = (roots: string[]) => {
  return [...roots].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }),
  );
};

const getVisibleRoots = (
  report: IcdRootsReportResponse | undefined,
  selectedRoots: string[],
) => {
  if (report) {
    const fromFilters = report.filters?.icdRoots ?? [];
    const roots = fromFilters.length
      ? fromFilters
      : Object.keys(report.summaryByRoot ?? {});
    return sortIcdRoots(roots);
  }
  if (selectedRoots.length > 0) return sortIcdRoots(selectedRoots);
  return sortIcdRoots(DEFAULT_ICD_ROOTS);
};

export const ReportsPage = () => {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(toInputDate(oneYearAgo));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [selectedRoots, setSelectedRoots] = useState<string[]>([]);

  const reportMutation = useMutation({
    mutationFn: generateIcdRootsReport,
  });

  const report = reportMutation.data;

  const visibleRoots = useMemo(
    () => getVisibleRoots(report, selectedRoots),
    [report, selectedRoots],
  );

  const handleRootToggle = (root: string) => {
    setSelectedRoots((prev) =>
      prev.includes(root) ? prev.filter((item) => item !== root) : [...prev, root],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reportMutation.mutate({
      start: toStartOfDayIso(startDate),
      end: toEndOfDayIso(endDate),
      icdRoots: selectedRoots.length > 0 ? sortIcdRoots(selectedRoots) : undefined,
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
                onClick={() => setSelectedRoots(sortIcdRoots(DEFAULT_ICD_ROOTS))}
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
              {sortIcdRoots(DEFAULT_ICD_ROOTS).map((root) => (
                <label
                  key={root}
                  className="flex items-center gap-2 rounded-md border border-violet-100 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoots.includes(root)}
                    onChange={() => handleRootToggle(root)}
                  />
                  <span>{root}</span>
                </label>
              ))}
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
                        {root}
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
                    <td className="border border-violet-100 px-3 py-2" colSpan={3}>
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
