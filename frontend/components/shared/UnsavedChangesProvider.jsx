import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useState } from "react";
import { UNSAFE_DataRouterContext, useBlocker } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const UnsavedChangesContext = createContext(null);

// Presentation changes keep the mounted form. Changing tournament or leaving
// the form needs a decision, including browser Back and Forward.
export function leavesDraft(current, next) {
  if (current.pathname !== next.pathname) return true;
  const first = new URLSearchParams(current.search), second = new URLSearchParams(next.search);
  return ["id", "sample", "name"].some((key) => first.get(key) !== second.get(key));
}

function NavigationGuard({ dirty }) {
  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) => dirty && leavesDraft(currentLocation, nextLocation), [dirty]));
  return <Dialog open={blocker.state === "blocked"} onOpenChange={(open) => { if (!open && blocker.state === "blocked") blocker.reset(); }}>
    <DialogContent>
      <DialogTitle className="pr-6 text-xl font-semibold">Rời trang khi chưa lưu?</DialogTitle>
      <DialogDescription className="mt-3 text-sm leading-7 text-dp-read">Thay đổi trên trang này chưa được lưu. Rời trang sẽ bỏ các thay đổi đó.</DialogDescription>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => blocker.reset?.()}>Tiếp tục chỉnh sửa</Button>
        <Button onClick={() => blocker.proceed?.()}>Bỏ thay đổi và rời trang</Button>
      </div>
    </DialogContent>
  </Dialog>;
}

export default function UnsavedChangesProvider({ children }) {
  const [sources, setSources] = useState({});
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  const register = useCallback((id, dirty) => {
    setSources((previous) => {
      if (Boolean(previous[id]) === dirty) return previous;
      const next = { ...previous };
      if (dirty) next[id] = true; else delete next[id];
      return next;
    });
  }, []);
  const value = useMemo(() => ({ register }), [register]);
  const dirty = Object.keys(sources).length > 0;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return <UnsavedChangesContext.Provider value={value}>{children}{dataRouter && <NavigationGuard dirty={dirty} />}</UnsavedChangesContext.Provider>;
}

export function useUnsavedChanges(dirty) {
  const context = useContext(UnsavedChangesContext);
  const id = useId();
  useLayoutEffect(() => {
    context?.register(id, Boolean(dirty));
    return () => context?.register(id, false);
  }, [context, id, dirty]);
}
