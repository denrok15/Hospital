import { useForm } from "react-hook-form";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { AuthApi, normalizeSpecialities } from "app/utils";
import { FormBlock, type FormField } from "./FormBlock";
import type { AxiosError } from "axios";
import type { RegisterDto } from "app/shared";
import { loadSpecialities } from "app/api/user";
import { useNavigate } from "react-router-dom";
import { useToaster } from "app/components/toaster-context";

type RegisterFormValues = Omit<RegisterDto, "gender"> & {
  gender: "Male" | "Female" | "";
};

const formatRuPhone = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";

  let digits = digitsOnly;
  if (digits[0] === "8") digits = `7${digits.slice(1)}`;
  if (digits[0] !== "7") digits = `7${digits}`;
  digits = digits.slice(0, 11);

  const national = digits.slice(1);
  const part1 = national.slice(0, 3);
  const part2 = national.slice(3, 6);
  const part3 = national.slice(6, 8);
  const part4 = national.slice(8, 10);

  let formatted = "+7";
  if (part1) formatted += ` ${part1}`;
  if (part2) formatted += ` ${part2}`;
  if (part3) formatted += `-${part3}`;
  if (part4) formatted += `-${part4}`;
  return formatted;
};

const schema = yup.object({
  name: yup.string().min(3, "Минимум 3 символа").required("Введите ФИО"),
  email: yup.string().email("Некорректный email").required("Введите email"),
  password: yup
    .string()
    .min(8, "Минимум 8 символов")
    .required("Введите пароль"),
  birthday: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Формат даты: ГГГГ-ММ-ДД")
    .required("Введите дату рождения"),
  gender: yup
    .mixed<RegisterFormValues["gender"]>()
    .oneOf(["Male", "Female", ""], "Выберите пол")
    .defined(),
  phone: yup
    .string()
    .matches(
      /^\+7 \d{3} \d{3}-\d{2}-\d{2}$/,
      "Телефон в формате +7 900 000-00-00",
    )
    .required("Введите телефон"),
  speciality: yup.string().required("Укажите специальность"),
});

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToaster();
  const { data: specialitiesData, isLoading: isSpecialitiesLoading } =
    useQuery(loadSpecialities());
  const specialities = useMemo(
    () => normalizeSpecialities(specialitiesData),
    [specialitiesData],
  );

  const specialityOptions = useMemo(() => {
    const fromApi = specialities
      .map((item) => ({
        value: item.id?.trim() ?? "",
        label: item.name?.trim() ?? "",
      }))
      .filter((item) => item.value && item.label);

    return [{ value: "", label: "Выберите специальность" }, ...fromApi];
  }, [specialities]);

  const fields: FormField<RegisterFormValues>[] = useMemo(
    () => [
      {
        name: "name",
        placeholder: "Введите ФИО",
        label: "Имя",
        wrapperClassName: "sm:col-span-2",
      },
      {
        name: "gender",
        placeholder: "Выберите пол",
        label: "Пол",
        type: "select",
        options: [
          { value: "", label: "Выберите пол" },
          { value: "Male", label: "Мужской" },
          { value: "Female", label: "Женский" },
        ],
      },
      {
        name: "birthday",
        placeholder: "ГГГГ-ММ-ДД",
        label: "Дата рождения",
        type: "date",
      },
      {
        name: "phone",
        placeholder: "+7 900 000-00-00",
        label: "Телефон",
        type: "tel",
        wrapperClassName: "sm:col-span-2",
        inputMode: "tel",
        autoComplete: "tel",
        maxLength: 16,
        formatValue: formatRuPhone,
      },
      {
        name: "speciality",
        placeholder: "Выберите специальность",
        label: "Специальность",
        type: "select",
        wrapperClassName: "sm:col-span-2",
        options: isSpecialitiesLoading
          ? [{ value: "", label: "Загрузка специальностей..." }]
          : specialityOptions,
      },
      {
        name: "email",
        placeholder: "example@gmail.com",
        label: "Email",
        type: "email",
        wrapperClassName: "sm:col-span-2",
      },
      {
        name: "password",
        placeholder: "Введите пароль",
        label: "Пароль",
        type: "password",
        wrapperClassName: "sm:col-span-2",
      },
    ],
    [isSpecialitiesLoading, specialityOptions],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      birthday: "",
      gender: "",
      phone: "",
      speciality: "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (!formData.gender) {
        showToast("Выберите пол", "error");
        return;
      }

      const birthDateOnly = new Date(formData.birthday);
      const normalizedData: RegisterDto = {
        ...formData,
        gender: formData.gender,
        birthday: Number.isNaN(birthDateOnly.getTime())
          ? formData.birthday
          : birthDateOnly.toISOString(),
      };

      const { token } = await AuthApi.register(normalizedData);

      localStorage.setItem("accessToken", token);
      reset();
      showToast("Регистрация прошла успешно", "success");
      navigate("/patients", { replace: true });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;

      const message =
        err.response?.data?.message || err.message || "Ошибка регистрации";

      showToast(message, "error");
      console.error(err);
    }
  });

  return (
    <FormBlock<RegisterFormValues>
      title="Регистрация пользователя"
      fields={fields}
      submitText="Зарегистрироваться"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      fieldsClassName="grid gap-5 sm:grid-cols-2"
    />
  );
};
