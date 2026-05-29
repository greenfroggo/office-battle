import Link from "next/link";

export default function Games() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">🎮 Giochi</h1>

      <div className="space-y-4">
        <Link
          href="/games/click-battle"
          className="block bg-blue-600 p-4 rounded-xl"
        >
          ⚡ Click Battle
        </Link>

        <Link
          href="/games/trivia"
          className="block bg-purple-600 p-4 rounded-xl"
        >
          🧠 Trivia Battle
        </Link>
      </div>
    </main>
  );
}