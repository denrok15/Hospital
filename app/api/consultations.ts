import { queryOptions } from "@tanstack/react-query";
import { http } from "app/utils";
import type {
  ConsultationDetail,
  ConsultationInspection,
  ConsultationQuery,
  ConsultationsResponse,
  CreateConsultationCommentDto,
  UpdateConsultationCommentDto,
} from "app/shared";

export const consultationsKeyFactory = {
  loadConsultations: (params?: ConsultationQuery) => [
    "loadConsultations",
    params ?? {},
  ],
  loadConsultationById: (id: string) => ["loadConsultationById", id],
  loadInspectionChain: (id: string) => ["loadInspectionChain", id],
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

export const loadInspectionChain = (inspectionId: string) => {
  return queryOptions({
    queryKey: consultationsKeyFactory.loadInspectionChain(inspectionId),
    queryFn: () =>
      http.get<ConsultationInspection[] | ConsultationsResponse>(
        `/inspection/${inspectionId}/chain`,
      ),
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
