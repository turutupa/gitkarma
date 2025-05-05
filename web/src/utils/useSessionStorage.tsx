import { useEffect, useState } from 'react';

const subscribers = new Map<string, Set<(val: any) => void>>();

function notifySubscribers<T>(key: string, value: T) {
  const subs = subscribers.get(key);
  if (subs) {
    subs.forEach((callback) => callback(value));
  }
}

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    }
    return initialValue;
  });

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === window.sessionStorage && event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorage);

    const callback = (value: T) => setStoredValue(value);

    if (!subscribers.has(key)) {
      subscribers.set(key, new Set());
    }
    subscribers.get(key)!.add(callback);

    return () => {
      window.removeEventListener('storage', handleStorage);
      subscribers.get(key)!.delete(callback);
      if (subscribers.get(key)!.size === 0) {
        subscribers.delete(key);
      }
    };
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
      notifySubscribers(key, valueToStore);
    } catch (error) {
      console.error(`Error saving to sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
