import { FormField } from "./FormField";
import useCurrentDay from "@/hooks/useCurrentDay";

export default function FutureDateField(props) {
  const today = useCurrentDay();
  return <FormField {...props} type="datetime-local" min={`${today}T00:00`} />;
}
