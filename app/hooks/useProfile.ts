import { useQuery } from "@tanstack/react-query";
import { loadProfileData } from "app/api";

export const useProfile = () => {
  return useQuery(loadProfileData());
};
