import type { LoginDto, RegisterDto } from "app/shared";
import { http } from "./request";
export interface AuthResponse {
  token: string;
}

export const AuthApi = {
  login: (data: LoginDto) => http.post<AuthResponse>("/doctor/login", data),
  register: (data: RegisterDto) =>
    http.post<AuthResponse>("/doctor/register", data),
};
