import * as React from "react";
import { useNavigate, type NavigateOptions, type To } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export type ExitIntent = "navigation" | "dismiss" | "bakery-switch" | "logout" | "browser-unload";

export type DirtyFormRegistration = {
  id: string;
  isDirty: boolean;
  discard?: () => void;
};

type PendingExit = {
  intent: Exclude<ExitIntent, "browser-unload">;
  proceed: () => void;
};

export type DirtyFormGuard = {
  register: (registration: DirtyFormRegistration) => () => void;
  requestExit: (intent: Exclude<ExitIntent, "browser-unload">, proceed: () => void) => "proceeded" | "blocked";
  pendingExit: PendingExit | null;
  stay: () => void;
  discardAndProceed: () => void;
  hasDirtyForms: boolean;
};

const DirtyFormGuardContext = React.createContext<DirtyFormGuard | null>(null);

export function DirtyFormGuardProvider({ children }: { children: React.ReactNode }) {
  const registrations = React.useRef(new Map<string, DirtyFormRegistration>());
  const [version, setVersion] = React.useState(0);
  const [pendingExit, setPendingExit] = React.useState<PendingExit | null>(null);

  const register = React.useCallback((registration: DirtyFormRegistration) => {
    registrations.current.set(registration.id, registration);
    setVersion((current) => current + 1);
    return () => {
      registrations.current.delete(registration.id);
      setVersion((current) => current + 1);
    };
  }, []);

  const hasDirtyForms = [...registrations.current.values()].some((registration) => registration.isDirty);

  const requestExit = React.useCallback<DirtyFormGuard["requestExit"]>((intent, proceed) => {
    if (![...registrations.current.values()].some((registration) => registration.isDirty)) {
      proceed();
      return "proceeded";
    }

    setPendingExit({ intent, proceed });
    return "blocked";
  }, []);

  const stay = React.useCallback(() => setPendingExit(null), []);
  const discardAndProceed = React.useCallback(() => {
    const exit = pendingExit;
    [...registrations.current.values()]
      .filter((registration) => registration.isDirty)
      .forEach((registration) => registration.discard?.());
    setPendingExit(null);
    exit?.proceed();
  }, [pendingExit]);

  React.useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (![...registrations.current.values()].some((registration) => registration.isDirty)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [version]);

  const value = React.useMemo<DirtyFormGuard>(() => ({
    register,
    requestExit,
    pendingExit,
    stay,
    discardAndProceed,
    hasDirtyForms,
  }), [discardAndProceed, hasDirtyForms, pendingExit, register, requestExit, stay]);

  return <DirtyFormGuardContext.Provider value={value}>{children}</DirtyFormGuardContext.Provider>;
}

export function useDirtyFormGuard() {
  const guard = React.useContext(DirtyFormGuardContext);
  if (!guard) throw new Error("useDirtyFormGuard must be used inside DirtyFormGuardProvider");
  return guard;
}

/** Register only the form's dirty lifecycle; the draft itself stays feature-local. */
export function useDirtyFormRegistration(registration: DirtyFormRegistration) {
  const { register } = useDirtyFormGuard();
  const { id, isDirty, discard } = registration;
  React.useEffect(
    () => register({ id, isDirty, discard }),
    [discard, id, isDirty, register],
  );
}

/** Use for workspace links and commands so dirty forms can block route changes. */
export function useGuardedNavigate() {
  const navigate = useNavigate();
  const { requestExit } = useDirtyFormGuard();
  return React.useCallback((to: To, options?: NavigateOptions) => {
    requestExit("navigation", () => navigate(to, options));
  }, [navigate, requestExit]);
}

/**
 * Wrap an already-authorized workspace action (dismiss, switch, or logout)
 * without making this module responsible for whether that action is allowed.
 */
export function useGuardedExit(intent: Exclude<ExitIntent, "browser-unload" | "navigation">) {
  const { requestExit } = useDirtyFormGuard();
  return React.useCallback((proceed: () => void) => requestExit(intent, proceed), [intent, requestExit]);
}

export function UnsavedChangesDialog() {
  const { pendingExit, stay, discardAndProceed } = useDirtyFormGuard();
  return (
    <AlertDialog open={pendingExit !== null} onOpenChange={(open) => !open && stay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Your draft has not been saved. You can stay and keep editing, or discard the draft and continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={stay}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={discardAndProceed}>Discard changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
