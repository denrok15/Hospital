import { http } from "app/utils";

export type IcdRootsReportFilters = {
  start: string;
  end: string;
  icdRoots?: string[];
};

export type IcdRootsReportRecord = {
  patientName: string;
  patientBirthdate: string;
  gender: "Male" | "Female" | string;
  visitsByRoot: Record<string, number>;
};

export type IcdRootsReportResponse = {
  filters: {
    start: string;
    end: string;
    icdRoots: string[];
  };
  records: IcdRootsReportRecord[];
  summaryByRoot: Record<string, number>;
};

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
