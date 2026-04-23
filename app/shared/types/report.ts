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
