import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  createConsultationComment,
  loadConsultationById,
  updateConsultationComment,
} from "app/api/consultations";
import { loadProfileData } from "app/api";
import {
  loadIcd10Diagnoses,
  loadInspectionDetail,
  updateInspection,
} from "app/api/patients";
import { EditInspectionModal, SectionCard } from "app/components";
import {
  formatDate,
  getConclusionLabel,
  getGenderLabel,
  getDiagnosisTypeLabel,
  formatDateTimeShort,
  toDateTimeLocal,
  toIsoOrNull,
  normalizeIcd10Diagnoses,
} from "app/utils";
import type {
  Icd10Diagnosis,
  ConsultationDetail,
  UpdateInspectionDiagnosisDto,
  UpdateInspectionDto,
} from "app/shared";

type ConsultationComment = NonNullable<ConsultationDetail["comments"]>[number];

const buildCommentsMap = (comments: ConsultationComment[] | undefined) => {
  const byParent = new Map<string | null, ConsultationComment[]>();
  (comments ?? []).forEach((comment) => {
    const key = comment.parentId ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(comment);
    byParent.set(key, bucket);
  });
  return byParent;
};

export const DetailInspectionPage = () => {
  const queryClient = useQueryClient();
  const { id = "" } = useParams();
  const { data: currentUser } = useQuery(loadProfileData());
  const { data, isLoading, isError } = useQuery({
    ...loadInspectionDetail(id),
    enabled: Boolean(id),
  });
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [selectedDiseaseId, setSelectedDiseaseId] = useState("");
  const [selectedDiseaseDescription, setSelectedDiseaseDescription] =
    useState("");
  const [selectedDiagnosisType, setSelectedDiagnosisType] =
    useState<UpdateInspectionDiagnosisDto["type"]>("Main");
  const [editingDiagnosisIndex, setEditingDiagnosisIndex] = useState<
    number | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeReplyTarget, setActiveReplyTarget] = useState<{
    consultationId: string;
    parentId: string | null;
  } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [activeEditTarget, setActiveEditTarget] = useState<{
    consultationId: string;
    commentId: string;
  } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [commentActionError, setCommentActionError] = useState<string | null>(
    null,
  );
  const [isCommentActionPending, setIsCommentActionPending] = useState(false);
  const [form, setForm] = useState({
    complaints: "",
    anamnesis: "",
    treatment: "",
    conclusion: "Disease" as UpdateInspectionDto["conclusion"],
    nextVisitDate: "",
    deathDate: "",
    diagnoses: [] as UpdateInspectionDiagnosisDto[],
  });

  const { data: icd10Data } = useQuery({
    ...loadIcd10Diagnoses(undefined, 1, 100),
    enabled: Boolean(id),
  });
  const diseaseOptions = useMemo(
    () => normalizeIcd10Diagnoses(icd10Data),
    [icd10Data],
  );
  const diseaseOptionByCode = useMemo(() => {
    const map = new Map<string, Icd10Diagnosis>();
    diseaseOptions.forEach((option) => {
      if (option.code) {
        map.set(option.code, option);
      }
    });
    return map;
  }, [diseaseOptions]);
  const diseaseOptionByName = useMemo(() => {
    const map = new Map<string, Icd10Diagnosis>();
    diseaseOptions.forEach((option) => {
      if (option.name) {
        map.set(option.name, option);
      }
    });
    return map;
  }, [diseaseOptions]);
  const consultationDetailsQueries = useQueries({
    queries: (data?.consultations ?? []).map((consultation) => ({
      ...loadConsultationById(consultation.id),
      enabled: Boolean(consultation.id),
    })),
  });
  const consultationDetailsById = useMemo(() => {
    const map = new Map<string, ConsultationDetail>();
    consultationDetailsQueries.forEach((query) => {
      const detail = query.data;
      if (detail?.id) {
        map.set(detail.id, detail);
      }
    });
    return map;
  }, [consultationDetailsQueries]);

  useEffect(() => {
    if (!isEditModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditModalOpen]);

  const openEditModal = () => {
    if (!data) return;
    setForm({
      complaints: data.complaints ?? "",
      anamnesis: data.anamnesis ?? "",
      treatment: data.treatment ?? "",
      conclusion:
        (data.conclusion as UpdateInspectionDto["conclusion"]) ?? "Disease",
      nextVisitDate: toDateTimeLocal(data.nextVisitDate),
      deathDate: toDateTimeLocal(data.deathDate),
      diagnoses: (data.diagnoses ?? []).map((diagnosis) => ({
        icdDiagnosisId:
          (diagnosis.code
            ? diseaseOptionByCode.get(diagnosis.code)?.id
            : undefined) ??
          (diagnosis.name
            ? diseaseOptionByName.get(diagnosis.name)?.id
            : undefined) ??
          diagnosis.id,
        description: diagnosis.description ?? "",
        type:
          (diagnosis.type as UpdateInspectionDiagnosisDto["type"]) ?? "Main",
      })),
    });
    setDiseaseSearch("");
    setSelectedDiseaseId("");
    setSelectedDiseaseDescription("");
    setSelectedDiagnosisType("Main");
    setEditingDiagnosisIndex(null);
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSaveError(null);
  };

  const resetDiagnosisEditor = () => {
    setDiseaseSearch("");
    setSelectedDiseaseId("");
    setSelectedDiseaseDescription("");
    setSelectedDiagnosisType("Main");
    setEditingDiagnosisIndex(null);
  };

  const addDiagnosis = () => {
    const resolvedDiseaseId =
      selectedDiseaseId ||
      diseaseOptions.find(
        (item) =>
          item.name === diseaseSearch ||
          item.code === diseaseSearch ||
          `${item.code} - ${item.name}` === diseaseSearch,
      )?.id;
    if (!resolvedDiseaseId) return;
    setForm((prev) => ({
      ...prev,
      diagnoses: [
        ...prev.diagnoses,
        {
          icdDiagnosisId: resolvedDiseaseId,
          description: selectedDiseaseDescription,
          type: selectedDiagnosisType,
        },
      ],
    }));
    resetDiagnosisEditor();
  };

  const startDiagnosisEdit = (index: number) => {
    const diagnosis = form.diagnoses[index];
    if (!diagnosis) return;

    const option = diseaseOptions.find(
      (item) => item.id === diagnosis.icdDiagnosisId,
    );
    const label = option
      ? option.code
        ? `${option.code} - ${option.name}`
        : option.name
      : diagnosis.icdDiagnosisId;

    setEditingDiagnosisIndex(index);
    setDiseaseSearch(label);
    setSelectedDiseaseId(diagnosis.icdDiagnosisId);
    setSelectedDiseaseDescription(diagnosis.description ?? "");
    setSelectedDiagnosisType(diagnosis.type);
  };

  const updateDiagnosis = () => {
    if (editingDiagnosisIndex === null) return;
    const resolvedDiseaseId =
      selectedDiseaseId ||
      diseaseOptions.find(
        (item) =>
          item.name === diseaseSearch ||
          item.code === diseaseSearch ||
          `${item.code} - ${item.name}` === diseaseSearch,
      )?.id;
    if (!resolvedDiseaseId) return;

    setForm((prev) => ({
      ...prev,
      diagnoses: prev.diagnoses.map((item, index) =>
        index === editingDiagnosisIndex
          ? {
              icdDiagnosisId: resolvedDiseaseId,
              description: selectedDiseaseDescription,
              type: selectedDiagnosisType,
            }
          : item,
      ),
    }));
    resetDiagnosisEditor();
  };

  const removeDiagnosis = (index: number) => {
    setForm((prev) => ({
      ...prev,
      diagnoses: prev.diagnoses.filter((_, idx) => idx !== index),
    }));
    setEditingDiagnosisIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleFormChange = (
    patch: Partial<{
      complaints: string;
      anamnesis: string;
      treatment: string;
      conclusion: UpdateInspectionDto["conclusion"];
      nextVisitDate: string;
      deathDate: string;
      diagnoses: UpdateInspectionDiagnosisDto[];
    }>,
  ) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleDiseaseSearchChange = (value: string) => {
    setDiseaseSearch(value);
    const selected = diseaseOptions.find(
      (option) =>
        option.name === value ||
        option.code === value ||
        `${option.code} - ${option.name}` === value,
    );
    setSelectedDiseaseId(selected?.id ?? "");
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateInspection(id, {
        anamnesis: form.anamnesis,
        complaints: form.complaints,
        treatment: form.treatment,
        conclusion: form.conclusion,
        nextVisitDate: toIsoOrNull(form.nextVisitDate),
        deathDate: toIsoOrNull(form.deathDate),
        diagnoses: form.diagnoses,
      });
      await queryClient.invalidateQueries({
        queryKey: ["loadInspectionDetail", id],
      });
      closeEditModal();
    } catch (error) {
      console.error(error);
      setSaveError("Не удалось сохранить изменения");
    } finally {
      setIsSaving(false);
    }
  };

  const refreshConsultationDetail = async (consultationId: string) => {
    await queryClient.invalidateQueries({
      queryKey: ["loadConsultationById", consultationId],
    });
  };

  const handleReplySubmit = async () => {
    if (!activeReplyTarget) return;
    const content = replyContent.trim();
    if (!content) return;

    setIsCommentActionPending(true);
    setCommentActionError(null);
    try {
      await createConsultationComment(activeReplyTarget.consultationId, {
        content,
        parentId: activeReplyTarget.parentId,
      });
      await refreshConsultationDetail(activeReplyTarget.consultationId);
      setReplyContent("");
      setActiveReplyTarget(null);
    } catch (error) {
      console.error(error);
      setCommentActionError("Не удалось добавить комментарий");
    } finally {
      setIsCommentActionPending(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!activeEditTarget) return;
    const content = editContent.trim();
    if (!content) return;

    setIsCommentActionPending(true);
    setCommentActionError(null);
    try {
      await updateConsultationComment(activeEditTarget.commentId, { content });
      await refreshConsultationDetail(activeEditTarget.consultationId);
      setActiveEditTarget(null);
      setEditContent("");
    } catch (error) {
      console.error(error);
      setCommentActionError("Не удалось изменить комментарий");
    } finally {
      setIsCommentActionPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl xl:max-w-[1400px] space-y-3 rounded-2xl bg-transparent p-6">
        {isLoading && (
          <div className="rounded-xl border border-violet-100 bg-[#fefcff] p-4 text-sm text-gray-500">
            Загрузка...
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            Не удалось загрузить детали осмотра
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            <SectionCard className="text-sm text-gray-700">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-2xl font-semibold text-sky-700">
                  Амбулаторный осмотр от {formatDate(data.date)}
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                  onClick={openEditModal}
                >
                  Редактировать осмотр
                </button>
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-800">Пациент:</span>{" "}
                  {data.patient?.name || "-"}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Пол:</span>{" "}
                  {getGenderLabel(data.patient?.gender)}
                </div>
                <div>
                  <span className="font-medium text-gray-800">
                    Дата рождения:
                  </span>{" "}
                  {formatDate(data.patient?.birthday)}
                </div>
                <div>
                  <span className="font-medium text-gray-800">
                    Мед работник:
                  </span>{" "}
                  {data.doctor?.name || "-"}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Жалобы" className="text-sm text-gray-700">
              <div>{data.complaints || "-"}</div>
            </SectionCard>

            <SectionCard
              title="Анамнез заболевания"
              className="text-sm text-gray-700"
            >
              <div>{data.anamnesis || "-"}</div>
            </SectionCard>

            {data.consultations.length === 0 && (
              <SectionCard
                title="Консультация"
                className="text-sm text-gray-700"
              >
                <div>-</div>
              </SectionCard>
            )}

            {data.consultations.map((consultation) => (
              <SectionCard
                key={consultation.id}
                title="Консультация"
                className="text-sm text-gray-700"
                headerClassName="mb-2"
              >
                <div className="font-bold text-gray-900">Консультант:</div>
                <div className="text-gray-500/90">
                  Специализация консультанта:{" "}
                  {consultation.speciality?.name || "-"}
                </div>

                <div className="mt-3 font-bold text-gray-900">Комментарии</div>

                {(() => {
                  const detail = consultationDetailsById.get(consultation.id);
                  const fallbackComments: ConsultationComment[] =
                    consultation.rootComment
                      ? [
                          {
                            id: consultation.rootComment.id,
                            parentId: consultation.rootComment.parentId,
                            content: consultation.rootComment.content,
                            author:
                              consultation.rootComment.author?.name ?? "-",
                            modifiedDate: consultation.rootComment.modifyTime,
                            createTime: consultation.rootComment.createTime,
                          },
                        ]
                      : [];
                  const comments = detail?.comments ?? fallbackComments;
                  const commentsMap = buildCommentsMap(comments);
                  const roots = commentsMap.get(null) ?? [];

                  const renderCommentNode = (
                    comment: ConsultationComment,
                    depth: number,
                  ): ReactNode => {
                    const children = commentsMap.get(comment.id) ?? [];
                    const expandKey = `${consultation.id}:${comment.id}`;
                    const isExpanded = expandedReplies[expandKey] ?? false;
                    const marginLeft = Math.min(depth, 3) * 16;
                    const canEditComment =
                      Boolean(currentUser?.id) &&
                      comment.authorId === currentUser?.id;

                    return (
                      <div
                        key={comment.id}
                        className="mt-2"
                        style={{ marginLeft }}
                      >
                        <div className="text-sm font-medium text-gray-800">
                          {comment.author || "-"}
                        </div>
                        <div className="mt-1 pl-3 text-gray-700">
                          {comment.content || "-"}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                          <span className="text-gray-500">
                            {formatDateTimeShort(
                              comment.modifiedDate || comment.createTime,
                            )}
                          </span>
                          <div className="flex items-center gap-4">
                            {children.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedReplies((prev) => ({
                                    ...prev,
                                    [expandKey]: !isExpanded,
                                  }))
                                }
                                className="font-medium text-sky-600 hover:text-sky-700"
                              >
                                Показать ответы ({children.length})
                              </button>
                            )}
                            {canEditComment && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveEditTarget({
                                    consultationId: consultation.id,
                                    commentId: comment.id,
                                  });
                                  setEditContent(comment.content ?? "");
                                  setActiveReplyTarget(null);
                                  setCommentActionError(null);
                                }}
                                className="font-medium text-sky-600 hover:text-sky-700"
                              >
                                Редактировать
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  activeReplyTarget?.consultationId ===
                                    consultation.id &&
                                  activeReplyTarget.parentId === comment.id
                                ) {
                                  setActiveReplyTarget(null);
                                  setReplyContent("");
                                } else {
                                  setActiveReplyTarget({
                                    consultationId: consultation.id,
                                    parentId: comment.id,
                                  });
                                  setReplyContent("");
                                  setActiveEditTarget(null);
                                  setCommentActionError(null);
                                }
                              }}
                              className="font-medium text-sky-600 hover:text-sky-700"
                            >
                              Ответить
                            </button>
                          </div>
                        </div>
                        {canEditComment &&
                          activeEditTarget?.commentId === comment.id &&
                          activeEditTarget.consultationId ===
                            consultation.id && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                value={editContent}
                                onChange={(event) =>
                                  setEditContent(event.target.value)
                                }
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-sky-400"
                                placeholder="Введите текст комментария"
                              />
                              <button
                                type="button"
                                onClick={handleEditSubmit}
                                disabled={isCommentActionPending}
                                className="whitespace-nowrap rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-60"
                              >
                                Редактировать
                              </button>
                            </div>
                          )}
                        {activeReplyTarget?.parentId === comment.id &&
                          activeReplyTarget.consultationId ===
                            consultation.id && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                value={replyContent}
                                onChange={(event) =>
                                  setReplyContent(event.target.value)
                                }
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-sky-400"
                                placeholder="Введите текст комментария"
                              />
                              <button
                                type="button"
                                onClick={handleReplySubmit}
                                disabled={isCommentActionPending}
                                className="whitespace-nowrap rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-60"
                              >
                                Оставить комментарий
                              </button>
                            </div>
                          )}
                        {isExpanded && children.length > 0 && (
                          <div className="mt-2">
                            {children.map((child) =>
                              renderCommentNode(child, depth + 1),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div>
                      {roots.length === 0 ? (
                        <div className="mt-2">-</div>
                      ) : (
                        roots.map((root) => renderCommentNode(root, 0))
                      )}

                      {commentActionError &&
                        (activeReplyTarget?.consultationId ===
                          consultation.id ||
                          activeEditTarget?.consultationId ===
                            consultation.id) && (
                          <div className="mt-2 text-xs text-red-600">
                            {commentActionError}
                          </div>
                        )}

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              activeReplyTarget?.consultationId ===
                                consultation.id &&
                              activeReplyTarget.parentId === null
                            ) {
                              setActiveReplyTarget(null);
                              setReplyContent("");
                            } else {
                              setActiveReplyTarget({
                                consultationId: consultation.id,
                                parentId: null,
                              });
                              setReplyContent("");
                              setActiveEditTarget(null);
                              setCommentActionError(null);
                            }
                          }}
                          className="text-xs font-medium text-sky-600 hover:text-sky-700"
                        >
                          Добавить комментарий
                        </button>
                      </div>

                      {activeReplyTarget?.consultationId === consultation.id &&
                        activeReplyTarget.parentId === null && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              value={replyContent}
                              onChange={(event) =>
                                setReplyContent(event.target.value)
                              }
                              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-sky-400"
                              placeholder="Введите текст комментария"
                            />
                            <button
                              type="button"
                              onClick={handleReplySubmit}
                              disabled={isCommentActionPending}
                              className="whitespace-nowrap rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-60"
                            >
                              Оставить комментарий
                            </button>
                          </div>
                        )}
                    </div>
                  );
                })()}
              </SectionCard>
            ))}

            <SectionCard
              title="Диагнозы"
              className="text-sm text-gray-700"
              headerClassName="mb-2"
            >
              {data.diagnoses.length === 0 && <div>-</div>}
              {data.diagnoses.map((diagnosis) => (
                <div key={diagnosis.id} className="mb-3">
                  <div className="font-bold text-gray-900">
                    {diagnosis.code
                      ? `(${diagnosis.code}) ${diagnosis.name || "-"}`
                      : diagnosis.name || "-"}
                  </div>
                  <div className="text-gray-500/90">
                    Тип в осмотре: {getDiagnosisTypeLabel(diagnosis.type)}
                  </div>
                  <div className="text-gray-500/90">
                    Описание: {diagnosis.description || "-"}
                  </div>
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Рекомендации по лечению"
              className="text-sm text-gray-700"
            >
              <div className="space-y-1">
                <div>{data.treatment || "-"}</div>
                <div>
                  {data.nextVisitDate
                    ? `Следующий визит: ${formatDateTimeShort(data.nextVisitDate)}`
                    : data.deathDate
                      ? `Дата смерти: ${formatDateTimeShort(data.deathDate)}`
                      : "-"}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Заключение" className="text-sm text-gray-700">
              <div>{getConclusionLabel(data.conclusion)}</div>
            </SectionCard>
          </>
        )}

        {!id && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            Некорректный id осмотра
          </div>
        )}

        <EditInspectionModal
          isOpen={isEditModalOpen}
          form={form}
          onFormChange={handleFormChange}
          diseaseOptions={diseaseOptions}
          diseaseSearch={diseaseSearch}
          selectedDiseaseDescription={selectedDiseaseDescription}
          selectedDiagnosisType={selectedDiagnosisType}
          editingDiagnosisIndex={editingDiagnosisIndex}
          onDiseaseSearchChange={handleDiseaseSearchChange}
          onDiseaseDescriptionChange={setSelectedDiseaseDescription}
          onDiagnosisTypeChange={setSelectedDiagnosisType}
          onAddDiagnosis={addDiagnosis}
          onEditDiagnosis={startDiagnosisEdit}
          onUpdateDiagnosis={updateDiagnosis}
          onCancelDiagnosisEdit={resetDiagnosisEditor}
          onRemoveDiagnosis={removeDiagnosis}
          saveError={saveError}
          isSaving={isSaving}
          onSave={handleSave}
          onClose={closeEditModal}
        />
      </div>
    </div>
  );
};
