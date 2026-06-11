import { tr } from "./tr";
import { en } from "./en";

export type Locale = "tr" | "en";
export type Dict = Record<keyof typeof tr, string>;
export { tr, en };
