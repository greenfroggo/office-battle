export default function GameCard({ children }: any) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        {children}
      </div>
    );
  }