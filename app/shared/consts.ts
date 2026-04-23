const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 5;
const SIZE_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const CONCLUSIONS_OPTIONS = [
  { value: "Disease", label: "Болезнь" },
  { value: "Recovery", label: "Выздоровление" },
  { value: "Death", label: "Смерть" },
];
const DEFAULT_ICD_ROOTS = [
  "A00-B99",
  "C00-D48",
  "D50-D89",
  "E00-E90",
  "F00-F99",
  "G00-G99",
  "H00-H59",
  "H60-H95",
  "I00-I99",
  "J00-J99",
  "K00-K93",
  "L00-L99",
  "M00-M99",
  "N00-N99",
  "O00-O99",
  "P00-P96",
  "Q00-Q99",
  "R00-R99",
  "S00-T98",
  "U00-U85",
  "V01-Y98",
  "Z00-Z99",
];
const TOAST_LIFETIME_MS = 3500;
export {
  DEFAULT_PAGE,
  DEFAULT_SIZE,
  SIZE_OPTIONS,
  CONCLUSIONS_OPTIONS,
  DEFAULT_ICD_ROOTS,
  TOAST_LIFETIME_MS,
};
