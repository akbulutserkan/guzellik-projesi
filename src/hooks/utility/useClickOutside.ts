// hooks/utility/useClickOutside.ts
import { useEffect, RefObject } from 'react';

/**
 * Bir öğenin dışına tıklandığında tetiklenen hook
 */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, handler]);
}
