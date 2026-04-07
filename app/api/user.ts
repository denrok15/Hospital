import { http } from "app/utils";
import { queryOptions } from "@tanstack/react-query";
import type { UserProfile } from "app/shared";

export const profileKeyFactory = {
  loadProfileData: () => ["loadProfile"],
  loadSpecialities: () => ["loadSpecialities"],
};

export const loadProfileData = () => {
  return queryOptions({
    queryKey: profileKeyFactory.loadProfileData(),
    queryFn: () => http.get<UserProfile>("/doctor/profile"),
  });
};

export const updateProfile = (data: unknown) => {
  return http.put<UserProfile>("/doctor/profile", data);
};

export type SpecialityDictionaryItem = {
  id?: string;
  name: string;
};

export const loadSpecialities = () => {
  return queryOptions({
    queryKey: profileKeyFactory.loadSpecialities(),
    queryFn: () =>
      http.get<
        | SpecialityDictionaryItem[]
        | {
            specialties?: SpecialityDictionaryItem[];
            specialities?: SpecialityDictionaryItem[];
            items?: SpecialityDictionaryItem[];
            data?: SpecialityDictionaryItem[];
          }
      >("/dictionary/speciality?page=1&size=20"),
  });
};
