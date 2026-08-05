import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { BakeryDomainAdapter, BakeryId } from "../domain/types";
import {
  createBakeryDomainController,
  initialBakeryDomainState,
  type BakeryDomainCommands,
  type BakeryDomainState,
} from "./domainState";

interface BakeryDomainContextValue {
  readonly controller: BakeryDomainCommands & {
    getState(): BakeryDomainState;
    subscribe(listener: () => void): () => void;
  };
  readonly bakeryId: BakeryId;
  readonly loadingState: BakeryDomainState;
  readonly commands: BakeryDomainCommands;
}

const BakeryDomainContext = createContext<BakeryDomainContextValue | null>(null);

export function BakeryDomainProvider({ adapter, bakeryId, children }: { readonly adapter: BakeryDomainAdapter; readonly bakeryId: BakeryId; readonly children: ReactNode }) {
  const controller = useMemo(() => createBakeryDomainController(adapter), [adapter]);
  const loadingState = useMemo<BakeryDomainState>(() => ({ resource: { status: "loading", bakeryId }, mutations: {} }), [bakeryId]);

  useEffect(() => {
    void controller.load(bakeryId);
  }, [controller, bakeryId]);

  const value = useMemo(() => ({ controller, bakeryId, loadingState, commands: controller }), [controller, bakeryId, loadingState]);
  return <BakeryDomainContext.Provider value={value}>{children}</BakeryDomainContext.Provider>;
}

export function useBakeryDomain(): { readonly state: BakeryDomainState; readonly commands: BakeryDomainCommands; readonly bakeryId: BakeryId } {
  const context = useDomainContext();
  const state = useBakeryDomainSelector((next) => next);
  return useMemo(() => ({ state, commands: context.commands, bakeryId: context.bakeryId }), [context.bakeryId, context.commands, state]);
}

function useDomainContext(): BakeryDomainContextValue {
  const value = useContext(BakeryDomainContext);
  if (!value) throw new Error("useBakeryDomain must be used inside BakeryDomainProvider.");
  return value;
}

export function useBakeryDomainSelector<T>(selector: (state: BakeryDomainState) => T, isEqual: (left: T, right: T) => boolean = Object.is): T {
  const { controller, bakeryId, loadingState } = useDomainContext();
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  const selectedRef = useRef<T | undefined>(undefined);
  const hasSelectedRef = useRef(false);
  const getVisibleState = useCallback(() => {
    const state = controller.getState();
    return state.resource.status !== "idle" && state.resource.bakeryId === bakeryId ? state : loadingState;
  }, [controller, bakeryId, loadingState]);

  const selectCurrent = useCallback(() => selectorRef.current(getVisibleState()), [getVisibleState]);
  const currentSelection = selectCurrent();
  if (!hasSelectedRef.current || !isEqualRef.current(selectedRef.current as T, currentSelection)) {
    selectedRef.current = currentSelection;
    hasSelectedRef.current = true;
  }

  const subscribe = useCallback((notify: () => void) => controller.subscribe(() => {
    const nextSelection = selectCurrent();
    if (hasSelectedRef.current && isEqualRef.current(selectedRef.current as T, nextSelection)) return;
    selectedRef.current = nextSelection;
    hasSelectedRef.current = true;
    notify();
  }), [controller, selectCurrent]);
  const getSnapshot = useCallback(() => selectedRef.current as T, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
