import type {
  ConsultationInspection,
  ConsultationsResponse,
  Icd10Diagnosis,
  Icd10DiagnosisResponse,
  IcdRoot,
  Inspection,
  InspectionsResponse,
  Patient,
  SpecialityDictionaryItem,
} from "@/shared";

function normalizeArray<T>(
  data: unknown,
  keys: string[] = ["items", "data"],
): T[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (typeof data === "object") {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
}

export const normalizeSpecialities = (
  data:
    | SpecialityDictionaryItem[]
    | {
        specialties?: SpecialityDictionaryItem[];
        specialities?: SpecialityDictionaryItem[];
        items?: SpecialityDictionaryItem[];
        data?: SpecialityDictionaryItem[];
      }
    | undefined,
): SpecialityDictionaryItem[] =>
  normalizeArray<SpecialityDictionaryItem>(data, [
    "specialties",
    "specialities",
    "items",
    "data",
  ]);

export const normalizeConsultations = (
  data: ConsultationInspection[] | ConsultationsResponse | undefined,
): ConsultationInspection[] =>
  normalizeArray<ConsultationInspection>(data, [
    "inspections",
    "records",
    "items",
    "data",
  ]);

export const normalizeInspections = (
  data: Inspection[] | InspectionsResponse | undefined,
): Inspection[] =>
  normalizeArray<Inspection>(data, ["inspections", "items", "data"]);

export const normalizeIcd10Diagnoses = (
  data: Icd10Diagnosis[] | Icd10DiagnosisResponse | undefined,
): Icd10Diagnosis[] =>
  normalizeArray<Icd10Diagnosis>(data, ["records", "items", "data"]);

export const normalizePatients = (data: unknown): Patient[] =>
  normalizeArray<Patient>(data, ["items", "patients", "data"]);

export const normalizeIcdRoots = (
  data:
    | IcdRoot[]
    | {
        items?: IcdRoot[];
        data?: IcdRoot[];
        icdRoots?: IcdRoot[];
        roots?: IcdRoot[];
      }
    | undefined,
): IcdRoot[] =>
  normalizeArray<IcdRoot>(data, ["icdRoots", "roots", "items", "data"]);
