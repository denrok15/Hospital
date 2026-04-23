import { SectionCard } from "app/components";
import type { CreatePatientDto } from "app/shared";

type CreatePatientModalProps = {
  isOpen: boolean;
  form: CreatePatientDto;
  submitError: string | null;
  isSubmitting: boolean;
  onFormChange: (patch: Partial<CreatePatientDto>) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export const CreatePatientModal = ({
  isOpen,
  form,
  submitError,
  isSubmitting,
  onFormChange,
  onSubmit,
  onClose,
}: CreatePatientModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl border border-violet-100 bg-[#fefcff] p-6 shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-900">
          Регистрация пациента
        </h2>

        <div className="mt-5 space-y-4 text-sm text-gray-700">
          <SectionCard>
            <label className="block">
              <span className="mb-1 block text-gray-600">ФИО</span>
              <input
                value={form.name}
                onChange={(event) =>
                  onFormChange({ name: event.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                type="text"
                placeholder="Иванов Иван Иванович"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-gray-600">Пол</span>
                <select
                  value={form.gender}
                  onChange={(event) =>
                    onFormChange({
                      gender: event.target.value as CreatePatientDto["gender"],
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                >
                  <option value="Male">Мужской</option>
                  <option value="Female">Женский</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-gray-600">Дата рождения</span>
                <input
                  value={form.birthday}
                  onChange={(event) =>
                    onFormChange({ birthday: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
                  type="date"
                />
              </label>
            </div>
          </SectionCard>
        </div>

        {submitError && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="button"
            className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};
