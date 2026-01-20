const ENABLE_LOGS = process.env.DEBUG_LOGS === "true"; // اضبط DEBUG_LOGS=true عند الحاجة للـ debug

export const debug = (...args: any[]) => {
  if (!ENABLE_LOGS) return;
  // keep debug separate so it can be filtered by consumer
  // eslint-disable-next-line no-console
  console.debug("[debug]", ...args);
};

export const info = (...args: any[]) => {
  if (!ENABLE_LOGS) return;
  // eslint-disable-next-line no-console
  console.info("[info]", ...args);
};

export const warn = (...args: any[]) => {
  if (!ENABLE_LOGS) return;
  // eslint-disable-next-line no-console
  console.warn("[warn]", ...args);
};

export const error = (...args: any[]) => {
  // always print errors to help troubleshooting even when DEBUG_LOGS is off
  // eslint-disable-next-line no-console
  console.error("[error]", ...args);
};

export default {
  debug,
  info,
  warn,
  error,
};
