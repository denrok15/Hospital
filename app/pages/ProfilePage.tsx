import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormBlock, type FormField } from "app/components/Forms/FormBlock";
import { useToaster } from "app/components/toaster-context";
import { useProfile } from "app/hooks";
import { profileKeyFactory, updateProfile } from "app/api/user";

type ProfileFormValues = {
  name: string;
  email: string;
  birthDate: string;
  gender: "Male" | "Female";
  phone: string;
};

const schema = yup.object({
  name: yup.string().required("Введите ФИО"),
  email: yup.string().email("Некорректный email").required("Введите email"),
  birthDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Формат даты: ГГГГ-ММ-ДД")
    .required("Введите дату рождения"),
  gender: yup
    .string()
    .oneOf(["Male", "Female"], "Выберите пол")
    .required("Укажите пол"),
  phone: yup.string().required("Введите телефон"),
});

const fields: FormField<ProfileFormValues>[] = [
  {
    name: "name",
    placeholder: "Введите ФИО",
    label: "ФИО",
    wrapperClassName: "sm:col-span-2",
  },
  {
    name: "birthDate",
    placeholder: "ГГГГ-ММ-ДД",
    label: "Дата рождения",
    type: "date",
  },
  {
    name: "gender",
    placeholder: "Male или Female",
    label: "Пол",
    type: "select",
    options: [
      { value: "Male", label: "Мужской" },
      { value: "Female", label: "Женский" },
    ],
  },
  {
    name: "phone",
    placeholder: "+7 900 000-00-00",
    label: "Телефон",
    type: "tel",
    wrapperClassName: "sm:col-span-2",
  },
  {
    name: "email",
    placeholder: "Введите email",
    label: "Email",
    type: "email",
    wrapperClassName: "sm:col-span-2",
  },
];

const normalizeBirthDate = (value: string) => {
  const birthDateOnly = new Date(value);
  return Number.isNaN(birthDateOnly.getTime())
    ? value
    : birthDateOnly.toISOString();
};

export const ProfilePage = () => {
  const { data, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToaster();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      birthDate: "",
      gender: "Male",
      phone: "",
    },
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    reset({
      name: data.name ?? "",
      email: data.email ?? "",
      birthDate: data.birthday ? data.birthday.slice(0, 10) : "",
      gender: data.gender,
      phone: data.phone ?? "",
    });
  }, [data, reset]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen justify-center">
        <p className="text-xl text-gray-600">Загрузка профиля...</p>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (formData) => {
    setIsSaving(true);
    try {
      const normalizedBirthday = normalizeBirthDate(formData.birthDate);
      await updateProfile({
        name: formData.name,
        email: formData.email,
        birthday: normalizedBirthday,
        gender: formData.gender,
        phone: formData.phone,
      });
      await queryClient.invalidateQueries({
        queryKey: profileKeyFactory.loadProfileData(),
      });
      showToast("Профиль успешно обновлен", "success");
    } catch (error) {
      console.error(error);
      showToast("Не удалось сохранить изменения", "error");
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 px-4 pt-6 pb-10">
      <FormBlock<ProfileFormValues>
        title="Профиль"
        fields={fields}
        submitText={
          isSaving || isSubmitting ? "Сохраняем..." : "Сохранить изменения"
        }
        onSubmit={onSubmit}
        register={register}
        errors={errors}
        isSubmitting={isSaving || isSubmitting}
        containerClassName="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200"
        fieldsClassName="grid gap-5 sm:grid-cols-2"
      />
    </div>
  );
};
