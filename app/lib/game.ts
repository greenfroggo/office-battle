export const saveScore = async (score, user, profile) => {
    return supabase.from("scores").insert(...);
  };