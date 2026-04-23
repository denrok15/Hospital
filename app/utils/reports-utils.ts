const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const toStartOfDayIso = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return date.toISOString();
};

const toEndOfDayIso = (value: string) => {
  const date = new Date(`${value}T23:59:59.999`);
  return date.toISOString();
};

const sortIcdRoots = (roots: string[]) => {
  return [...roots].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }),
  );
};

export { toInputDate, toStartOfDayIso, toEndOfDayIso, sortIcdRoots };
