import { moment } from "obsidian";

import en from "./locale/en";
import jp from "./locale/jp";

const localeMap: { [k: string]: Partial<typeof en> } = {
	en,
	jp: jp,
};

const locale = localeMap[moment.locale()];

export function t(str: keyof typeof en): string {
	return (locale && locale[str]) || en[str];
}
