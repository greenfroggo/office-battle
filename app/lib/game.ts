import { supabase } from "./supabase";

export const saveScore = async (score: number, user: any, profile: any) => {
  return supabase.from("scores").insert([
    {
      name: `${profile.first_name} ${profile.last_name}`,
      score,
      company: profile.company,
    },
  ]);
};