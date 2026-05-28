import { avatars } from "@/app/lib/avatars";

export function getAvatarById(id?: string) {
  return avatars.find((a) => a.id === id) || avatars[0];
}