import { http } from "app/utils";
import type { IcdRootsReportFilters, IcdRootsReportResponse } from "app/shared";

const buildReportQuery = (filters: IcdRootsReportFilters) => {
  const searchParams = new URLSearchParams();
  searchParams.set("start", filters.start);
  searchParams.set("end", filters.end);

  if (filters.icdRoots?.length) {
    filters.icdRoots.forEach((root) => {
      searchParams.append("icdRoots", root);
    });
  }

  return searchParams.toString();
};

export const generateIcdRootsReport = (filters: IcdRootsReportFilters) => {
  const query = buildReportQuery(filters);
  return http.get<IcdRootsReportResponse>(
    query ? `/report/icdrootsreport?${query}` : "/report/icdrootsreport",
  );
};
