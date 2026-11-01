import { useEffect, useState } from "react";

export default function useDebounce(value, delay = 300) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setResult(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return result;
}
