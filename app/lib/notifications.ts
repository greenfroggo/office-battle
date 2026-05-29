import { supabase } from "./supabase";

let isSendingFriends = false;
let isSendingChallenge = false;

export const notifyFriends = async (
  userId: string,
  game: "click" | "trivia",
  score: number,
  senderName: string
) => {
  if (isSendingFriends) return;
  isSendingFriends = true;

  try {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (!friendships || friendships.length === 0) return;

    const friendIds = friendships.map((f) =>
      f.sender_id === userId ? f.receiver_id : f.sender_id
    );

    const gameLabel =
      game === "click" ? "Click Battle" : "Finance Trivia";

    const message = `${senderName} ha appena giocato a ${gameLabel} e ha fatto ${score}${
      game === "trivia" ? "/10" : ""
    } punti!`;

    const notifications = friendIds.map((friendId) => ({
      user_id: friendId,
      sender_id: userId,
      type: "game_result",
      game,
      score,
      message,
      read: false,
    }));

    await supabase.from("notifications").insert(notifications);
  } finally {
    setTimeout(() => {
      isSendingFriends = false;
    }, 1500);
  }
};

export const notifyChallenge = async (
  userId: string,
  friendId: string,
  game: "click" | "trivia",
  myScore: number,
  friendScore: number,
  senderName: string
) => {
  if (isSendingChallenge) return;
  isSendingChallenge = true;

  try {
    const gameLabel =
      game === "click" ? "Click Battle" : "Finance Trivia";

    const iWon = myScore > friendScore;

    const message = iWon
      ? `${senderName} ti ha sfidato a ${gameLabel} e ti ha battuto! Ha fatto ${myScore}${
          game === "trivia" ? "/10" : ""
        } contro i tuoi ${friendScore}${
          game === "trivia" ? "/10" : ""
        }.`
      : `${senderName} ti ha sfidato a ${gameLabel} ma non ce l'ha fatta! Ha fatto ${myScore}${
          game === "trivia" ? "/10" : ""
        } contro i tuoi ${friendScore}${
          game === "trivia" ? "/10" : ""
        }.`;

    await supabase.from("notifications").insert([
      {
        user_id: friendId,
        sender_id: userId,
        type: "challenge_result",
        game,
        score: myScore,
        message,
        read: false,
      },
    ]);
  } finally {
    setTimeout(() => {
      isSendingChallenge = false;
    }, 1500);
  }
};