import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
};

export const SectionCard = ({
  title,
  actions,
  children,
  className = "",
  headerClassName = "",
  titleClassName = "",
}: SectionCardProps) => {
  const showHeader = Boolean(title) || Boolean(actions);

  return (
    <section
      className={`rounded-xl border border-violet-100 bg-[#fefcff] p-4 ${className}`}
    >
      {showHeader && (
        <div
          className={`mb-1 flex items-center justify-between gap-3 ${headerClassName}`}
        >
          {title ? (
            <div className={`text-lg font-semibold text-sky-700 ${titleClassName}`}>
              {title}
            </div>
          ) : (
            <div />
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
};
