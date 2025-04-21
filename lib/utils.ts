import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import globalConfig from "app.config.mjs";

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var appConfig: typeof globalConfig;
}

if (!globalThis.appConfig) {
  globalThis.appConfig = globalConfig;
}
