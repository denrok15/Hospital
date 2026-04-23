export { http } from "./request";
export { AuthApi } from "./auth";
export {
  formatDate,
  getConclusionLabel,
  getGenderLabel,
  getDiagnosisTypeLabel,
  formatDateTimeShort,
  toDateTimeLocal,
  toIsoOrNull,
  getGenderIcon,
} from "./inspection-utils";
export {
  toInputDate,
  toStartOfDayIso,
  toEndOfDayIso,
  sortIcdRoots,
} from "./reports-utils";
export {
  normalizeConsultations,
  normalizeIcd10Diagnoses,
  normalizeInspections,
  normalizePatients,
  normalizeSpecialities,
  normalizeIcdRoots,
} from "./normalization";
