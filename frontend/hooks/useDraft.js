import { useEffect, useState } from "react";

export default function useDraft(key, initialValue) {
  const source = JSON.stringify(initialValue);
  const [state, setState] = useState(() => ({ key, source, value: initialValue }));
  const current = state.key === key && state.source === source ? state.value : initialValue;
  useEffect(() => {
    setState((previous) => previous.key === key && previous.source === source ? previous : { key, source, value: JSON.parse(source) });
  }, [key, source]);
  function setValue(update) {
    setState((previous) => {
      const value = previous.key === key && previous.source === source ? previous.value : JSON.parse(source);
      return { key, source, value: typeof update === "function" ? update(value) : update };
    });
  }
  return { value: current, setValue, isDirty: JSON.stringify(current) !== source };
}
