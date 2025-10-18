import { type ClassValue,clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeSessionStorageGetItem<T>(key: string) {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) {
      return null;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    console.error(error);
    return null;
  }
}
