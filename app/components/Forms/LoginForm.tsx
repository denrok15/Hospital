import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { AuthApi } from "app/utils";
import { FormBlock, type FormField } from "./FormBlock";
import type { AxiosError } from "axios";
import type { LoginDto } from "app/shared";
import { useNavigate } from "react-router-dom";
import { useToaster } from "app/components/toaster-context";

const schema = yup.object({
  email: yup.string().email("Некорректный email").required("Введите email"),
  password: yup
    .string()
    .min(8, "Минимум 8 символов")
    .required("Введите пароль"),
});

const fields: FormField<LoginDto>[] = [
  {
    name: "email",
    placeholder: "Введите email",
    label: "Email",
    type: "email",
  },
  {
    name: "password",
    placeholder: "Введите пароль",
    label: "Пароль",
    type: "password",
  },
];

export const LoginForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToaster();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginDto>({
    resolver: yupResolver(schema),
  });

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const { token } = await AuthApi.login(formData);
      localStorage.setItem("accessToken", token);
      reset();
      showToast("Вход выполнен успешно", "success");
      navigate("/patients", { replace: true });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;

      const message =
        err.response?.data?.message || err.message || "Ошибка входа";
      showToast(message, "error");
      console.error(err);
    }
  });

  return (
    <FormBlock<LoginDto>
      title="Вход"
      fields={fields}
      submitText="Войти"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      children={
        <button
          type="button"
          className="mt-4 w-full cursor-pointer rounded-lg bg-gray-300 p-4 text-center text-white transition hover:bg-gray-400"
          onClick={() => {
            navigate("/register");
          }}
        >
          Регистрация
        </button>
      }
    />
  );
};
