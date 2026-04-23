import type { ChangeEvent } from "react";
import { SectionCard } from "app/components";
import type {
  Icd10Diagnosis,
  UpdateInspectionDiagnosisDto,
  UpdateInspectionDto,
} from "app/shared";
import { getDiagnosisTypeLabel } from "app/utils";

type EditInspectionModalProps = {
  isOpen: boolean;
  form: {
    complaints: string;
    anamnesis: string;
    treatment: string;
    conclusion: UpdateInspectionDto["conclusion"];
    nextVisitDate: string;
    deathDate: string;
    diagnoses: UpdateInspectionDiagnosisDto[];
  };
  onFormChange: (patch: Partial<EditInspectionModalProps["form"]>) => void;
  diseaseOptions: Icd10Diagnosis[];
  diseaseSearch: string;
  selectedDiseaseDescription: string;
  selectedDiagnosisType: UpdateInspectionDiagnosisDto["type"];
  editingDiagnosisIndex: number | null;
  onDiseaseSearchChange: (value: string) => void;
  onDiseaseDescriptionChange: (value: string) => void;
  onDiagnosisTypeChange: (value: UpdateInspectionDiagnosisDto["type"]) => void;
  onAddDiagnosis: () => void;
  onEditDiagnosis: (index: number) => void;
  onUpdateDiagnosis: () => void;
  onCancelDiagnosisEdit: () => void;
  onRemoveDiagnosis: (index: number) => void;
  saveError: string | null;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
};

const getDiagnosisName = (
  options: Icd10Diagnosis[],
  diagnosis: UpdateInspectionDiagnosisDto,
) => {
  const option = options.find((item) => item.id === diagnosis.icdDiagnosisId);
  return option?.name ?? "-";
};

export const EditInspectionModal = ({
  isOpen,
  form,
  onFormChange,
  diseaseOptions,
  diseaseSearch,
  selectedDiseaseDescription,
  selectedDiagnosisType,
  editingDiagnosisIndex,
  onDiseaseSearchChange,
  onDiseaseDescriptionChange,
  onDiagnosisTypeChange,
  onAddDiagnosis,
  onEditDiagnosis,
  onUpdateDiagnosis,
  onCancelDiagnosisEdit,
  onRemoveDiagnosis,
  saveError,
  isSaving,
  onSave,
  onClose,
}: EditInspectionModalProps) => {
  if (!isOpen) return null;

  const handleInput =
    (field: keyof EditInspectionModalProps["form"]) =>
    (
      event: ChangeEvent<
        HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement
      >,
    ) => {
      onFormChange({ [field]: event.target.value } as Partial<
        EditInspectionModalProps["form"]
      >);
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-2xl font-semibold text-gray-800">
          Редактирование Осмотра
        </div>

        <div className="mt-4 space-y-4">
          <SectionCard title="Жалобы">
            <textarea
              value={form.complaints}
              onChange={handleInput("complaints")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
              rows={3}
            />
          </SectionCard>

          <SectionCard title="Анамнез заболевания">
            <textarea
              value={form.anamnesis}
              onChange={handleInput("anamnesis")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
              rows={3}
            />
          </SectionCard>

          <SectionCard title="Рекомендации по лечению">
            <textarea
              value={form.treatment}
              onChange={handleInput("treatment")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
              rows={3}
            />
          </SectionCard>

          <SectionCard title="Диагнозы">
            <div className="space-y-2 text-sm text-gray-700">
              {form.diagnoses.length === 0 && <div>-</div>}
              {form.diagnoses.map((diagnosis, index) => (
                <div
                  key={`${diagnosis.icdDiagnosisId}-${index}`}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div>
                        Тип в осмотре: {getDiagnosisTypeLabel(diagnosis.type)}
                      </div>
                      <div className="truncate">
                        Расшифровка: {getDiagnosisName(diseaseOptions, diagnosis)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditDiagnosis(index)}
                        className="rounded-md border border-sky-200 bg-white px-3 py-1 text-xs text-sky-700 transition hover:bg-sky-50"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveDiagnosis(index)}
                        className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs text-red-600 transition hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm font-medium text-gray-700">
              Болезни {editingDiagnosisIndex !== null ? "(редактирование)" : ""}
            </div>
            <input
              value={diseaseSearch}
              onChange={(event) => onDiseaseSearchChange(event.target.value)}
              placeholder="Название диагноза"
              list="icd10-diagnoses"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
            />
            <datalist id="icd10-diagnoses">
              {diseaseOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.code} - {option.name}
                </option>
              ))}
            </datalist>

            <input
              value={selectedDiseaseDescription}
              onChange={(event) =>
                onDiseaseDescriptionChange(event.target.value)
              }
              placeholder="Описание"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
            />

            <div className="mt-3 text-sm font-medium text-gray-700">
              Тип диагноза в осмотре
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-700">
              {[
                { value: "Main", label: "Основной" },
                { value: "Concomitant", label: "Сопутствующий" },
                { value: "Complication", label: "Осложнение" },
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="diagnosisType"
                    value={item.value}
                    checked={selectedDiagnosisType === item.value}
                    onChange={() =>
                      onDiagnosisTypeChange(
                        item.value as UpdateInspectionDiagnosisDto["type"],
                      )
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={
                editingDiagnosisIndex !== null ? onUpdateDiagnosis : onAddDiagnosis
              }
              className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              {editingDiagnosisIndex !== null
                ? "Сохранить диагноз"
                : "+Добавить диагноз"}
            </button>
            {editingDiagnosisIndex !== null && (
              <button
                type="button"
                onClick={onCancelDiagnosisEdit}
                className="mt-3 ml-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
              >
                Отмена
              </button>
            )}
          </SectionCard>

          <SectionCard title="Заключение">
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-gray-500">Заключение</div>
                <select
                  value={form.conclusion}
                  onChange={handleInput("conclusion")}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                >
                  <option value="Disease">Болезнь</option>
                  <option value="Recovery">Выздоровление</option>
                  <option value="Death">Смерть</option>
                </select>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  Дата следующего визита
                </div>
                <input
                  type="datetime-local"
                  value={form.nextVisitDate}
                  onChange={handleInput("nextVisitDate")}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {saveError && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {saveError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            {isSaving ? "Сохранение..." : "Сохранить изменения"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
