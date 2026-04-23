export {
  type UserProfile,
  type LoginDto,
  type RegisterDto,
  type SpecialityDictionaryItem,
} from "./types/user";
export {
  type Patient,
  type CreatePatientDto,
  type PatientsQuery,
  type PatientCard,
  type Diagnosis,
  type Inspection,
  type InspectionDetail,
  type InspectionsResponse,
  type CreateInspectionDto,
  type CreateInspectionDiagnosisDto,
  type CreateInspectionConsultationDto,
  type CreateInspectionPayload,
  type PatientInspectionsQuery,
  type IcdRoot,
  type Icd10Diagnosis,
  type Icd10DiagnosisResponse,
  type UpdateInspectionDiagnosisDto,
  type UpdateInspectionDto,
} from "./types/patients";
export {
  type ConsultationQuery,
  type ConsultationInspection,
  type ConsultationsResponse,
  type ConsultationDetail,
  type CreateConsultationCommentDto,
  type UpdateConsultationCommentDto,
} from "./types/consultations";
export {
  type IcdRootsReportFilters,
  type IcdRootsReportRecord,
  type IcdRootsReportResponse,
} from "./types/report";
export * from "./consts";
