import { useEffect, useState } from "react";
import { currentDay } from "@/lib/dates";

export default function useCurrentDay() {
  const [day, setDay] = useState(currentDay);
  useEffect(() => {
    let timer;
    function update() {
      const today = currentDay();
      setDay(today);
      clearTimeout(timer);
      const midnight = Date.parse(`${today}T00:00:00+07:00`) + 86400000;
      timer = setTimeout(update, Math.max(1, midnight - Date.now()));
    }
    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => { clearTimeout(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  return day;
}
