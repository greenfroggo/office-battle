import { getAvatarById } from "@/app/lib/getAvatar";

export default function UserAvatar({
  avatarId,
  size = 40,
}: {
  avatarId?: string;
  size?: number;
}) {
  const avatar = getAvatarById(avatarId);

  return (
    <div
      className="flex items-center justify-center rounded-full bg-slate-800 border border-slate-700"
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.6 }}>{avatar.emoji}</span>
    </div>
  );
}
