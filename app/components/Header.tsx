import { loadProfileData } from "app/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

export const Header = () => {
  const { data } = useQuery(loadProfileData());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    if (!data) return;
    setMenuOpen((prev) => !prev);
  };
  const handleLogout = () => {
    setMenuOpen(false);
    localStorage.removeItem("accessToken");
    queryClient.clear();
    navigate("/login");
  };

  const goToProfile = () => {
    setMenuOpen(false);
    navigate("/profile");
  };

  const displayName = data ? data.name : "Вход";

  return (
    <header className="bg-blue-900 text-white p-4 flex items-center justify-between gap-8 relative">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/10 text-2xl">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3c-3.866 0-7 3.134-7 7 0 4.25 1.562 6 2.3 7.16.876 1.319 1.523 1.84 1.523 1.84-.142 1.35-.153 2.195.2 2.72.3.46 1.269.28 2.227-.07.955.35 1.926.53 2.228.07.352-.525.342-1.37.2-2.72 0 0 .647-.52 1.522-1.839C17.438 16 19 14.25 19 10c0-3.866-3.134-7-7-7z" />
            <path d="M9.5 10.5c0 .828-.672 1.5-1.5 1.5S6.5 11.328 6.5 10.5 7.172 9 8 9s1.5.672 1.5 1.5zM18 10.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5z" />
            <path d="M8 15c1.333 1.334 3.333 1.334 4 1.334s2.667 0 4-1.334" />
          </svg>
        </span>
        <div className="ml-10 leading-tight">
          <p className="text-xl leading-tight tracking-tight">Try not to</p>
          <p className="text-xl font-black">DIE</p>
        </div>
      </div>

      {data ? (
        <nav className="ml-10 flex flex-1 gap-6 text-sm font-semibold text-white/90">
          <button
            type="button"
            className="cursor-pointer transition hover:text-white"
            onClick={() => navigate("/patients")}
          >
            Пациенты
          </button>
          <button
            type="button"
            className="cursor-pointer transition hover:text-white"
            onClick={() => navigate("/consultations")}
          >
            Консультации
          </button>
          <button
            type="button"
            className="cursor-pointer transition hover:text-white"
            onClick={() => navigate("/reports")}
          >
            Отчеты и статистика
          </button>
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      <div className="relative">
        {data ? (
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity"
            onClick={toggleMenu}
          >
            <span>{displayName}</span>
            <svg
              className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="mr-3 hover: cursor-pointer"
          >
            {displayName}
          </button>
        )}

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-32 rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg z-10">
            <button
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100"
              onClick={goToProfile}
            >
              Профиль
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100"
              onClick={handleLogout}
            >
              Выход
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
