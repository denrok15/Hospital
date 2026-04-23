import { http } from "app/utils";
import { queryOptions } from "@tanstack/react-query";
import type {
  CreateInspectionDto,
  CreateInspectionPayload,
  CreatePatientDto,
  Icd10Diagnosis,
  Icd10DiagnosisResponse,
  IcdRoot,
  Inspection,
  InspectionDetail,
  InspectionsResponse,
  Patient,
  PatientCard,
  PatientInspectionsQuery,
  PatientsQuery,
  UpdateInspectionDto,
} from "app/shared";

export const patientsKeyFactory = {
  loadPatients: (params?: PatientsQuery) => ["loadPatients", params ?? {}],
  loadPatient: (id: string) => ["loadPatient", id],
  loadInspectionDetail: (id: string) => ["loadInspectionDetail", id],
  loadIcd10Diagnoses: (
    request?: string,
    page: number = 1,
    size: number = 5,
  ) => ["loadIcd10Diagnoses", request ?? "", page, size],
  loadPatientInspections: (id: string, params?: PatientInspectionsQuery) => [
    "loadPatientInspections",
    id,
    params ?? {},
  ],
  loadPatientInspectionsSearch: (id: string, request?: string) => [
    "loadPatientInspectionsSearch",
    id,
    request ?? "",
  ],
  loadIcdRoots: () => ["loadIcdRoots"],
};

const isGuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export const loadPatients = (params?: PatientsQuery) => {
  return queryOptions({
    queryKey: patientsKeyFactory.loadPatients(params),
    queryFn: () => {
      if (!params) return http.get<Patient[]>("/patient");
      const searchParams = new URLSearchParams();

      if (params.name) searchParams.set("name", params.name);
      if (params.conclusions?.length) {
        params.conclusions.forEach((value) => {
          searchParams.append("conclusions", value);
        });
      }
      if (params.sorting) searchParams.set("sorting", params.sorting);
      if (params.scheduledVisits) {
        searchParams.set("scheduledVisits", "true");
      }
      if (params.onlyMine) searchParams.set("onlyMine", "true");
      if (typeof params.page === "number") {
        searchParams.set("page", String(params.page));
      }
      if (typeof params.size === "number") {
        searchParams.set("size", String(params.size));
      }

      const query = searchParams.toString();
      return http.get<Patient[]>(query ? `/patient?${query}` : "/patient");
    },
  });
};

export const createPatient = (payload: CreatePatientDto) => {
  return http.post<Patient>("/patient", payload);
};

export const loadPatient = (id: string) => {
  return queryOptions({
    queryKey: patientsKeyFactory.loadPatient(id),
    queryFn: () => http.get<PatientCard>(`/patient/${id}`),
  });
};

export const loadPatientInspections = (
  id: string,
  params?: PatientInspectionsQuery,
) => {
  return queryOptions({
    queryKey: patientsKeyFactory.loadPatientInspections(id, params),
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (typeof params?.grouped === "boolean") {
        searchParams.set("grouped", String(params.grouped));
      }
      if (params?.icdRoots?.length) {
        params.icdRoots.forEach((root) => {
          if (isGuid(root)) {
            searchParams.append("icdRoots", root);
          }
        });
      }
      if (typeof params?.page === "number") {
        searchParams.set("page", String(params.page));
      }
      if (typeof params?.size === "number") {
        searchParams.set("size", String(params.size));
      }

      const query = searchParams.toString();
      return http.get<Inspection[] | InspectionsResponse>(
        query ? `/patient/${id}/inspections?${query}` : `/patient/${id}/inspections`,
      );
    },
  });
};

export const loadInspectionDetail = (id: string) => {
  return queryOptions({
    queryKey: patientsKeyFactory.loadInspectionDetail(id),
    queryFn: () => http.get<InspectionDetail>(`/inspection/${id}`),
  });
};

export const loadPatientInspectionsSearch = (id: string, request?: string) => {
  return queryOptions({
    queryKey: patientsKeyFactory.loadPatientInspectionsSearch(id, request),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (request?.trim()) {
        searchParams.set("request", request.trim());
      }
      const query = searchParams.toString();
      return http.get<Inspection[] | InspectionsResponse>(
        query
          ? `/patient/${id}/inspections/search?${query}`
          : `/patient/${id}/inspections/search`,
      );
    },
  });
};

export const loadIcdRoots = () => {
  return queryOptions({
    queryKey: patientsKeyFactory.loadIcdRoots(),
    queryFn: () =>
      http.get<
        | IcdRoot[]
        | {
            items?: IcdRoot[];
            data?: IcdRoot[];
            icdRoots?: IcdRoot[];
            roots?: IcdRoot[];
          }
      >("/dictionary/icd10/roots"),
  });
};

export const loadIcd10Diagnoses = (
  request?: string,
  page: number = 1,
  size: number = 5,
) => {
  return queryOptions({
    queryKey: patientsKeyFactory.loadIcd10Diagnoses(request, page, size),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (request?.trim()) searchParams.set("request", request.trim());
      searchParams.set("page", String(page));
      searchParams.set("size", String(size));
      const query = searchParams.toString();
      return http.get<Icd10Diagnosis[] | Icd10DiagnosisResponse>(
        query ? `/dictionary/icd10?${query}` : "/dictionary/icd10",
      );
    },
  });
};

export const createInspection = (
  patientId: string,
  payload: CreateInspectionPayload | CreateInspectionDto,
) => {
  return http.post<Inspection>(`/patient/${patientId}/inspections`, payload);
};

export const updateInspection = (
  inspectionId: string,
  payload: UpdateInspectionDto,
) => {
  return http.put<InspectionDetail>(`/inspection/${inspectionId}`, payload);
};
