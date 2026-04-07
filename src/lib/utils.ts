import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Development-only logging utility
 * Logs are stripped in production builds
 */
export const devLog = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args)
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args)
  },
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info(...args)
    }
  }
}
