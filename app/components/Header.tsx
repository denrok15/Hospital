import { loadProfileData } from "app/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { BrandIcon, ChevronDownIcon } from "app/components";

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
          <BrandIcon className="h-6 w-6" />
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
            <span className="max-w-xs truncate">{displayName}</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
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
