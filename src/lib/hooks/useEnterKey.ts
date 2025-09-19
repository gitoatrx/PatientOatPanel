import { useCallback } from "react";

export function useEnterKey(handler: () => void) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handler();
      }
    },
    [handler],
  );
}
