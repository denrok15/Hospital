import { http } from "app/utils";
import { queryOptions } from "@tanstack/react-query";
export type Patient = {
  id?: string;
  name: string;
  email?: string;
  gender?: string;
  birthday?: string;
};

export type CreatePatientDto = {
  name: string;
  birthday: string;
  gender: string;
};

export type PatientsQuery = {
  name?: string;
  conclusions?: string[];
  sorting?: string;
  scheduledVisits?: boolean;
  onlyMine?: boolean;
  page?: number;
  size?: number;
};

export type PatientCard = {
  id: string;
  name: string;
  birthday: string;
  gender: string;
  createTime: string;
};

export type Diagnosis = {
  id: string;
  createTime: string;
  code: string;
  name: string;
  description: string;
  type: string;
};

export type InspectionConsultation = {
  inspectionId?: string;
  id: string;
  speciality?: {
    id: string;
    name: string;
    createTime?: string;
  };
  rootComment?: {
    id: string;
    parentId: string | null;
    content: string;
    modifyTime?: string;
    createTime?: string;
    author?: {
      id: string;
      name: string;
      birthday?: string;
      gender?: string;
      email?: string;
      phone?: string;
      createTime?: string;
    };
  };
  commentsNumber?: number;
  createTime?: string;
};

export type Inspection = {
  id: string;
  createTime: string;
  previousId: string | null;
  date: string;
  conclusion: string;
  doctorId: string;
  doctor: string;
  patientId: string;
  patient: string;
  diagnosis: Diagnosis | null;
  hasChain: boolean;
  hasNested: boolean;
};

export type InspectionDetail = {
  id: string;
  createTime: string;
  date: string;
  anamnesis: string;
  complaints: string;
  treatment: string;
  conclusion: "Disease" | "Recovery" | "Death" | string;
  nextVisitDate: string | null;
  deathDate: string | null;
  baseInspectionId: string | null;
  previousInspectionId: string | null;
  patient: PatientCard;
  doctor: {
    id: string;
    createTime: string;
    name: string;
    birthday: string;
    gender: "Male" | "Female" | string;
    email: string;
    phone: string;
  };
  diagnoses: Diagnosis[];
  consultations: InspectionConsultation[];
};

export type InspectionsResponse = {
  inspections?: Inspection[];
  items?: Inspection[];
  data?: Inspection[];
  totalCount?: number;
  total?: number;
  count?: number;
  pagination?: {
    totalCount?: number;
    total?: number;
    count?: number;
    current?: number;
    size?: number;
  };
};

export type CreateInspectionDto = {
  date: string;
  conclusion: "Disease" | "Recovery" | "Death";
};

export type CreateInspectionDiagnosisDto = {
  icdDiagnosisId: string;
  description: string;
  type: "Main" | "Concomitant" | "Complication";
};

export type CreateInspectionConsultationDto = {
  specialityId: string;
  comment: {
    content: string;
  };
};

export type CreateInspectionPayload = {
  date: string;
  anamnesis: string;
  complaints: string;
  treatment: string;
  conclusion: "Disease" | "Recovery" | "Death";
  nextVisitDate: string | null;
  deathDate: string | null;
  previousInspectionId: string | null;
  diagnoses: CreateInspectionDiagnosisDto[];
  consultations: CreateInspectionConsultationDto[];
};

export type PatientInspectionsQuery = {
  grouped?: boolean;
  icdRoots?: string[];
  page?: number;
  size?: number;
};

export type IcdRoot = {
  id: string;
  code?: string;
  name?: string;
};

export type Icd10Diagnosis = {
  id: string;
  createTime?: string;
  code: string;
  name: string;
  description?: string;
};

export type Icd10DiagnosisResponse = {
  records?: Icd10Diagnosis[];
  items?: Icd10Diagnosis[];
  data?: Icd10Diagnosis[];
  pagination?: {
    size?: number;
    count?: number;
    current?: number;
  };
};

export type UpdateInspectionDiagnosisDto = {
  icdDiagnosisId: string;
  description: string;
  type: "Main" | "Concomitant" | "Complication";
};

export type UpdateInspectionDto = {
  anamnesis: string;
  complaints: string;
  treatment: string;
  conclusion: "Disease" | "Recovery" | "Death";
  nextVisitDate: string | null;
  deathDate: string | null;
  diagnoses: UpdateInspectionDiagnosisDto[];
};

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
