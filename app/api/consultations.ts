import { queryOptions } from "@tanstack/react-query";
import { http } from "app/utils";

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

export const consultationsKeyFactory = {
  loadConsultations: (params?: ConsultationQuery) => [
    "loadConsultations",
    params ?? {},
  ],
  loadConsultationById: (id: string) => ["loadConsultationById", id],
};

const isGuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export const loadConsultations = (params?: ConsultationQuery) => {
  return queryOptions({
    queryKey: consultationsKeyFactory.loadConsultations(params),
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
      return http.get<ConsultationInspection[] | ConsultationsResponse>(
        query ? `/consultation?${query}` : "/consultation",
      );
    },
  });
};

export const loadConsultationById = (id: string) => {
  return queryOptions({
    queryKey: consultationsKeyFactory.loadConsultationById(id),
    queryFn: () => http.get<ConsultationDetail>(`/consultation/${id}`),
  });
};

export const createConsultationComment = (
  id: string,
  payload: CreateConsultationCommentDto,
) => {
  return http.post<unknown>(`/consultation/${id}/comment`, payload);
};

export const updateConsultationComment = (
  id: string,
  payload: UpdateConsultationCommentDto,
) => {
  return http.put<unknown>(`/consultation/comment/${id}`, payload);
};
