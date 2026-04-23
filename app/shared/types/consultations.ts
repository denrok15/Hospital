export type ConsultationQuery = {
  grouped?: boolean;
  icdRoots?: string[];
  page?: number;
  size?: number;
};

export type ConsultationInspection = {
  id: string;
  createTime?: string;
  previousId?: string | null;
  date: string;
  conclusion: string;
  doctor?: string;
  doctorId?: string;
  patient?: string;
  patientId?: string;
  diagnosis?: {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    type?: string;
  } | null;
  hasChain?: boolean;
  hasNested?: boolean;
};

export type ConsultationsResponse = {
  inspections?: ConsultationInspection[];
  items?: ConsultationInspection[];
  records?: ConsultationInspection[];
  data?: ConsultationInspection[];
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

export type ConsultationDetail = {
  id: string;
  inspectionId?: string;
  speciality?: {
    id: string;
    name: string;
    createTime?: string;
  };
  comments?: Array<{
    id: string;
    parentId: string | null;
    content: string;
    authorId?: string;
    author?: string;
    modifiedDate?: string;
    createTime?: string;
  }>;
  createTime?: string;
};

export type CreateConsultationCommentDto = {
  content: string;
  parentId: string | null;
};

export type UpdateConsultationCommentDto = {
  content: string;
};
