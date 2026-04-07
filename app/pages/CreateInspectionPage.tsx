import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SectionCard, useToaster } from "app/components";
import {
  createInspection,
  loadIcd10Diagnoses,
  loadPatient,
  loadPatientInspections,
  loadPatientInspectionsSearch,
  type CreateInspectionPayload,
  type Icd10Diagnosis,
  type Icd10DiagnosisResponse,
  type Inspection,
  type InspectionsResponse,
} from "app/api/patients";
import {
  loadSpecialities,
  type SpecialityDictionaryItem,
} from "app/api/user";

const nowLocalDateTime = () => {
  const current = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(
    current.getDate(),
  )}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
};

const formatDateTimeOption = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ru-RU");
};

const getGenderIcon = (value?: string) => {
  if (value === "Male") return "♂";
  if (value === "Female") return "♀";
  return "⚧";
};

const toIsoOrNull = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const normalizeInspections = (
  data: Inspection[] | InspectionsResponse | undefined,
) => {
  if (!data) return [] as Inspection[];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.inspections)) return data.inspections;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [] as Inspection[];
};

const normalizeIcd10Diagnoses = (
  data: Icd10Diagnosis[] | Icd10DiagnosisResponse | undefined,
) => {
  if (!data) return [] as Icd10Diagnosis[];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [] as Icd10Diagnosis[];
};

const normalizeSpecialities = (
  data:
    | SpecialityDictionaryItem[]
    | {
        specialties?: SpecialityDictionaryItem[];
        specialities?: SpecialityDictionaryItem[];
        items?: SpecialityDictionaryItem[];
        data?: SpecialityDictionaryItem[];
      }
    | undefined,
) => {
  if (!data) return [] as SpecialityDictionaryItem[];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.specialties)) return data.specialties;
  if (Array.isArray(data.specialities)) return data.specialities;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [] as SpecialityDictionaryItem[];
};

type DiagnosisDraft = {
  key: string;
  search: string;
  icdDiagnosisId: string;
  description: string;
  type: "Main" | "Concomitant" | "Complication";
};

type ConsultationDraft = {
  key: string;
  specialityId: string;
  content: string;
};

export const CreateInspectionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToaster();
  const patientId = searchParams.get("patientId") ?? "";
  const previousInspectionIdFromQuery =
    searchParams.get("previousInspectionId") ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRepeatedInspection, setIsRepeatedInspection] = useState(
    Boolean(previousInspectionIdFromQuery),
  );
  const [isConsultationRequired, setIsConsultationRequired] = useState(false);
  const [form, setForm] = useState({
    date: nowLocalDateTime(),
    complaints: "",
    anamnesis: "",
    treatment: "",
    conclusion: "Disease" as CreateInspectionPayload["conclusion"],
    nextVisitDate: "",
    deathDate: "",
    previousInspectionId: previousInspectionIdFromQuery,
  });
  const [diagnoses, setDiagnoses] = useState<DiagnosisDraft[]>([
    {
      key: `diagnosis-${Date.now()}`,
      search: "",
      icdDiagnosisId: "",
      description: "",
      type: "Main",
    },
  ]);
  const [consultations, setConsultations] = useState<ConsultationDraft[]>([]);

  const addConsultation = () => {
    setConsultations((prev) => [
      ...prev,
      {
        key: `consultation-${Date.now()}-${prev.length}`,
        specialityId: "",
        content: "",
      },
    ]);
  };

  const { data: patientData, isLoading: isPatientLoading } = useQuery({
    ...loadPatient(patientId),
    enabled: Boolean(patientId),
  });

  const { data: inspectionSearchData } = useQuery({
    ...loadPatientInspectionsSearch(patientId),
    enabled: Boolean(patientId),
  });

  const { data: allInspectionsData } = useQuery({
    ...loadPatientInspections(patientId, {
      grouped: false,
      page: 1,
      size: 1000,
    }),
    enabled: Boolean(patientId),
  });

  const { data: icd10Data } = useQuery({
    ...loadIcd10Diagnoses(undefined, 1, 100),
    enabled: Boolean(patientId),
  });

  const { data: specialitiesData } = useQuery({
    ...loadSpecialities(),
    enabled: Boolean(patientId),
  });

  const previousInspections = useMemo(
    () => normalizeInspections(inspectionSearchData),
    [inspectionSearchData],
  );

  const allInspections = useMemo(
    () => normalizeInspections(allInspectionsData),
    [allInspectionsData],
  );

  const diagnosesDictionary = useMemo(
    () => normalizeIcd10Diagnoses(icd10Data),
    [icd10Data],
  );

  const specialityOptions = useMemo(
    () =>
      normalizeSpecialities(specialitiesData).filter(
        (item) => Boolean(item.id) && Boolean(item.name?.trim()),
      ),
    [specialitiesData],
  );

  const hasDeathInspection = useMemo(
    () => allInspections.some((inspection) => inspection.conclusion === "Death"),
    [allInspections],
  );

  const previousInspectionDate = useMemo(() => {
    if (!form.previousInspectionId) return null;
    const selected = previousInspections.find(
      (item) => item.id === form.previousInspectionId,
    );
    if (!selected?.date) return null;
    const parsed = new Date(selected.date);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }, [form.previousInspectionId, previousInspections]);

  const validateForm = () => {
    const inspectionDate = new Date(form.date);
    if (Number.isNaN(inspectionDate.getTime())) {
      return "Укажите корректную дату осмотра";
    }

    if (inspectionDate.getTime() > Date.now()) {
      return "Нельзя создавать осмотр в будущем";
    }

    if (
      isRepeatedInspection &&
      previousInspectionDate &&
      inspectionDate < previousInspectionDate
    ) {
      return "Дата осмотра не может быть раньше предыдущего осмотра";
    }
    if (isRepeatedInspection && !form.previousInspectionId) {
      return "Для повторного осмотра выберите предыдущий осмотр";
    }

    if (form.conclusion === "Disease") {
      const nextVisitDate = new Date(form.nextVisitDate);
      if (
        !form.nextVisitDate ||
        Number.isNaN(nextVisitDate.getTime()) ||
        nextVisitDate <= inspectionDate
      ) {
        return "Для заключения 'Болезнь' укажите корректную дату следующего визита";
      }
    }

    if (form.conclusion === "Death") {
      const deathDate = new Date(form.deathDate);
      if (!form.deathDate || Number.isNaN(deathDate.getTime())) {
        return "Для заключения 'Смерть' укажите дату и время смерти";
      }
      if (deathDate.getTime() > Date.now()) {
        return "Дата смерти не может быть в будущем";
      }
      if (hasDeathInspection) {
        return "У пациента уже есть осмотр с заключением 'Смерть'";
      }
    }

    if (diagnoses.length === 0) {
      return "Добавьте хотя бы один диагноз";
    }

    if (diagnoses.some((item) => !item.icdDiagnosisId)) {
      return "Выберите диагноз для каждой записи";
    }

    const mainCount = diagnoses.filter((item) => item.type === "Main").length;
    if (mainCount !== 1) {
      return "Осмотр должен содержать ровно один основной диагноз";
    }

    const selectedSpecialities = consultations
      .map((item) => item.specialityId)
      .filter(Boolean);
    const uniqueSpecialities = new Set(selectedSpecialities);
    if (uniqueSpecialities.size !== selectedSpecialities.length) {
      return "Нельзя добавлять несколько консультаций одной специальности";
    }

    if (
      consultations.some(
        (item) => !item.specialityId || !item.content.trim(),
      )
    ) {
      return "Для консультации укажите специальность и комментарий";
    }
    if (isConsultationRequired && consultations.length === 0) {
      return "Добавьте хотя бы одну консультацию";
    }

    return null;
  };

  const onSubmit = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      showToast(error, "error");
      return;
    }

    if (!patientId) {
      const message = "Не найден id пациента";
      setFormError(message);
      showToast(message, "error");
      return;
    }

    const payload: CreateInspectionPayload = {
      date: new Date(form.date).toISOString(),
      complaints: form.complaints.trim(),
      anamnesis: form.anamnesis.trim(),
      treatment: form.treatment.trim(),
      conclusion: form.conclusion,
      nextVisitDate:
        form.conclusion === "Disease" ? toIsoOrNull(form.nextVisitDate) : null,
      deathDate: form.conclusion === "Death" ? toIsoOrNull(form.deathDate) : null,
      previousInspectionId:
        isRepeatedInspection && form.previousInspectionId
          ? form.previousInspectionId
          : null,
      diagnoses: diagnoses.map((item) => ({
        icdDiagnosisId: item.icdDiagnosisId,
        description: item.description.trim(),
        type: item.type,
      })),
      consultations: consultations.map((item) => ({
        specialityId: item.specialityId,
        comment: {
          content: item.content.trim(),
        },
      })),
    };

    setIsSubmitting(true);
    setFormError(null);
    try {
      await createInspection(patientId, payload);
      await queryClient.invalidateQueries({
        queryKey: ["loadPatientInspections", patientId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["loadPatientInspectionsSearch", patientId],
      });
      showToast("Осмотр успешно создан", "success");
      navigate(`/patient/${patientId}`, { replace: true });
    } catch (error) {
      console.error(error);
      const message = "Не удалось создать осмотр";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patientId) {
    return (
      <div className="min-h-screen bg-white px-4 py-10">
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
          Не указан пациент для создания осмотра
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 rounded-2xl bg-transparent p-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h1 className="text-4xl font-semibold text-gray-800">Создание осмотра</h1>
          <button
            type="button"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
            onClick={() => navigate(`/patient/${patientId}`)}
          >
            Отмена
          </button>
        </div>

        <SectionCard className="text-sm text-gray-700">
          {!isPatientLoading && patientData && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xl font-semibold text-sky-700">
                  <span>{patientData.name || "-"}</span>
                  <span
                    title={patientData.gender === "Male" ? "Мужской" : "Женский"}
                    className="text-2xl leading-none"
                  >
                    {getGenderIcon(patientData.gender)}
                  </span>
                </div>
                <div className="pt-1 text-xs text-gray-500">
                  Дата рождения: {formatDate(patientData.birthday)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Первичный осмотр</span>
                <label className="relative inline-flex h-6 w-11 items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isRepeatedInspection}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setIsRepeatedInspection(checked);
                      if (!checked) {
                        setForm((prev) => ({ ...prev, previousInspectionId: "" }));
                      }
                    }}
                  />
                  <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-sky-500" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                </label>
                <span className="text-sm text-gray-700">Повторный осмотр</span>
              </div>

              {isRepeatedInspection && (
                <label className="block">
                  <span className="mb-1 block text-gray-500">Предыдущий осмотр</span>
                  <select
                    value={form.previousInspectionId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        previousInspectionId: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                  >
                    <option value="">Не выбрано</option>
                    {previousInspections.map((inspection) => (
                      <option key={inspection.id} value={inspection.id}>
                        {`${formatDateTimeOption(inspection.date)} ${
                          inspection.diagnosis?.code ?? ""
                        }${inspection.diagnosis?.code ? " - " : ""}${
                          inspection.diagnosis?.name ?? ""
                        }`.trim()}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block max-w-md">
                <span className="mb-1 block text-gray-500">Дата осмотра</span>
                <input
                  type="datetime-local"
                  max={nowLocalDateTime()}
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                />
              </label>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Жалобы" className="text-sm text-gray-700">
          <textarea
            value={form.complaints}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, complaints: event.target.value }))
            }
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
            placeholder="Введите жалобы"
          />
        </SectionCard>

        <SectionCard title="Анамнез заболевания" className="text-sm text-gray-700">
          <textarea
            value={form.anamnesis}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, anamnesis: event.target.value }))
            }
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
            placeholder="Введите анамнез"
          />
        </SectionCard>

        <SectionCard
          title="Консультации"
          className="text-sm text-gray-700"
          headerClassName="mb-3"
        >
          <div className="mb-3 flex items-center gap-3">
              <span className="text-sm text-gray-700">Требуется консультация</span>
              <label className="relative inline-flex h-6 w-11 items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isConsultationRequired}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setIsConsultationRequired(checked);
                    if (checked) {
                      if (consultations.length === 0) {
                        addConsultation();
                      }
                    } else {
                      setConsultations([]);
                    }
                  }}
                />
                <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-sky-500" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
          </div>

          {isConsultationRequired && (
            <div className="space-y-3">
              {consultations.map((consultation, index) => (
              <div
                key={consultation.key}
                className="rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="grid gap-3">
                  {index === 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div />
                      <label className="block">
                        <span className="mb-1 block text-gray-500">
                          Специализация
                        </span>
                        <select
                          value={consultation.specialityId}
                          onChange={(event) =>
                            setConsultations((prev) =>
                              prev.map((item) =>
                                item.key === consultation.key
                                  ? { ...item, specialityId: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                        >
                          <option value="">Выберите специальность</option>
                          {specialityOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <label className="block">
                      <span className="mb-1 block text-gray-500">Специализация</span>
                      <select
                        value={consultation.specialityId}
                        onChange={(event) =>
                          setConsultations((prev) =>
                            prev.map((item) =>
                              item.key === consultation.key
                                ? { ...item, specialityId: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                      >
                        <option value="">Выберите специальность</option>
                        {specialityOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1 block text-gray-500">
                      Комментарий к консультации
                    </span>
                    <textarea
                      value={consultation.content}
                      onChange={(event) =>
                        setConsultations((prev) =>
                          prev.map((item) =>
                            item.key === consultation.key
                              ? { ...item, content: event.target.value }
                              : item,
                          ),
                        )
                      }
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                      placeholder="Опишите проблему для консультанта"
                    />
                  </label>

                  <button
                    type="button"
                    className="w-fit rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-300"
                    onClick={() =>
                      setConsultations((prev) =>
                        prev.filter((item) => item.key !== consultation.key),
                      )
                    }
                  >
                    Удалить консультацию
                  </button>
                </div>
              </div>
              ))}

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                onClick={addConsultation}
              >
                <span className="text-base leading-none">+</span>
                <span>Добавить консультацию</span>
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Диагнозы"
          className="text-sm text-gray-700"
          headerClassName="mb-3"
        >

          <div className="space-y-3">
            {diagnoses.map((diagnosis, index) => (
              <div
                key={diagnosis.key}
                className="rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-gray-500">
                      Поиск по коду или названию
                    </span>
                    <input
                      list="create-inspection-icd10"
                      value={diagnosis.search}
                      onChange={(event) => {
                        const searchValue = event.target.value;
                        const matched = diagnosesDictionary.find(
                          (item) => `${item.code} - ${item.name}` === searchValue,
                        );
                        setDiagnoses((prev) =>
                          prev.map((item) =>
                            item.key === diagnosis.key
                              ? {
                                  ...item,
                                  search: searchValue,
                                  icdDiagnosisId: matched?.id ?? "",
                                }
                              : item,
                          ),
                        );
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                      placeholder="Выберите диагноз"
                    />
                    <datalist id="create-inspection-icd10">
                      {diagnosesDictionary.map((item) => (
                        <option key={item.id} value={`${item.code} - ${item.name}`} />
                      ))}
                    </datalist>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-gray-500">Описание</span>
                    <input
                      value={diagnosis.description}
                      onChange={(event) =>
                        setDiagnoses((prev) =>
                          prev.map((item) =>
                            item.key === diagnosis.key
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                      placeholder="Введите описание диагноза"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <div className="mb-2 text-gray-500">Тип диагноза в осмотре</div>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { value: "Main", label: "Основной" },
                        { value: "Concomitant", label: "Сопутствующий" },
                        { value: "Complication", label: "Осложнение" },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`diagnosis-type-${diagnosis.key}`}
                            checked={diagnosis.type === option.value}
                            onChange={() =>
                              setDiagnoses((prev) =>
                                prev.map((item) =>
                                  item.key === diagnosis.key
                                    ? {
                                        ...item,
                                        type: option.value as DiagnosisDraft["type"],
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {diagnoses.length > 1 && (
                    <button
                      type="button"
                      className="w-fit rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-300"
                      onClick={() =>
                        setDiagnoses((prev) =>
                          prev.filter((item) => item.key !== diagnosis.key),
                        )
                      }
                    >
                      Удалить диагноз
                    </button>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-400">Диагноз #{index + 1}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
            onClick={() =>
              setDiagnoses((prev) => [
                ...prev,
                {
                  key: `diagnosis-${Date.now()}-${prev.length}`,
                  search: "",
                  icdDiagnosisId: "",
                  description: "",
                  type: "Concomitant",
                },
              ])
            }
          >
            <span className="text-base leading-none">+</span>
            <span>Добавить диагноз</span>
          </button>
        </SectionCard>

        <SectionCard
          title="Рекомендации по лечению"
          className="text-sm text-gray-700"
        >
          <textarea
            value={form.treatment}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, treatment: event.target.value }))
            }
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
            placeholder="Введите рекомендации"
          />
        </SectionCard>

        <SectionCard title="Заключение" className="text-sm text-gray-700">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-gray-500">Заключение</span>
              <select
                value={form.conclusion}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    conclusion: event.target
                      .value as CreateInspectionPayload["conclusion"],
                  }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
              >
                <option value="Disease">Болезнь</option>
                <option value="Recovery">Выздоровление</option>
                <option value="Death">Смерть</option>
              </select>
            </label>

            {form.conclusion === "Disease" && (
              <label className="block">
                <span className="mb-1 block text-gray-500">Дата следующего визита</span>
                <input
                  type="datetime-local"
                  value={form.nextVisitDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      nextVisitDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                />
              </label>
            )}

            {form.conclusion === "Death" && (
              <label className="block">
                <span className="mb-1 block text-gray-500">Дата смерти</span>
                <input
                  type="datetime-local"
                  value={form.deathDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, deathDate: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                />
              </label>
            )}
          </div>
        </SectionCard>

        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Сохраняем..." : "Сохранить осмотр"}
          </button>
          <button
            type="button"
            className="rounded-lg bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
            onClick={() => navigate(`/patient/${patientId}`)}
            disabled={isSubmitting}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
