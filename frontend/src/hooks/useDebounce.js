import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * has passed without `value` changing. Used to avoid firing an API call
 * (or a client-side filter) on every keystroke in a search input.
 *
 * @param {*} value - the live value (e.g. what the user is typing)
 * @param {number} delayMs - debounce delay in milliseconds (default 400ms)
 */
export default function useDebounce(value, delayMs = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
