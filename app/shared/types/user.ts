interface RegisterDto {
  name: string;
  password: string;
  email: string;
  birthday: string;
  gender: "Male" | "Female";
  phone: string;
  speciality: string;
}
interface LoginDto {
  email: string;
  password: string;
}

interface UserProfile {
  id: string;
  createTime: string;
  name: string;
  birthday: string;
  gender: "Male" | "Female";
  email: string;
  phone: string;
}
export { type UserProfile, type LoginDto, type RegisterDto };
