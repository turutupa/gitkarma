import { useEffect, useState } from 'react';

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize on first render
  useEffect(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const item = window.sessionStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Update sessionStorage when the state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving to sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
