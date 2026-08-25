import Link from "next/link";

interface HeaderProps {
  xpTotal: number;
  hearts: number;
  streak: number;
}

export function Header({ xpTotal, hearts, streak }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-bold">
          🇮🇹 Patente Facile
        </Link>
        <Link href="/modules" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Módulos
        </Link>
      </div>
      <div className="flex items-center gap-4 text-sm font-semibold">
        <span title="Sequência de dias">🔥 {streak}</span>
        <span title="Vidas">❤️ {hearts}</span>
        <span title="Pontos de experiência">⭐ {xpTotal} XP</span>
        <form action="/api/auth/signout" method="post">
          <button className="text-slate-500 hover:text-slate-800" type="submit">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
