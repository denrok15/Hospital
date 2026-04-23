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
interface SpecialityDictionaryItem {
  id?: string;
  name: string;
}
export {
  type UserProfile,
  type LoginDto,
  type RegisterDto,
  type SpecialityDictionaryItem,
};
