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
