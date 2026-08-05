import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, LogOut, Plus, Store } from "lucide-react";
import type { BakeryMembership } from "./workspace";

interface WorkspaceSelectorProps {
  memberships: BakeryMembership[];
  onCreate: (name: string) => Promise<void>;
  onSelect: (membership: BakeryMembership) => void;
  onLogout: () => Promise<void>;
}

export function WorkspaceSelector({
  memberships,
  onCreate,
  onSelect,
  onLogout,
}: WorkspaceSelectorProps) {
  const defaultMembership = useMemo(
    () => memberships.find(item => item.isDefault) ?? memberships[0],
    [memberships],
  );
  const [selectedId, setSelectedId] = useState(defaultMembership?.bakeryId ?? "");
  const [bakeryName, setBakeryName] = useState("My Bakery");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedId(current => (
      memberships.some(item => item.bakeryId === current)
        ? current
        : defaultMembership?.bakeryId ?? ""
    ));
  }, [defaultMembership?.bakeryId, memberships]);

  const createBakery = async (event: FormEvent) => {
    event.preventDefault();
    if (!bakeryName.trim()) {
      setError("Enter a bakery name.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onCreate(bakeryName.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the bakery.");
    } finally {
      setPending(false);
    }
  };

  const selected = memberships.find(item => item.bakeryId === selectedId);

  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <main className="min-h-screen bg-[#FBF8F3] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7A3E24] text-white">
              <Store size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="font-extrabold text-[#2F2925]">Bakery workspace</p>
              <p className="text-xs text-[#988D84]">Choose where you&apos;re baking today</p>
            </div>
          </div>
          <button type="button" onClick={() => void onLogout()} className="text-sm font-bold text-[#7A3E24]">
            <LogOut className="mr-2 inline" size={16} aria-hidden="true" />
            Log out
          </button>
        </header>

        <section className="rounded-[22px] border border-[#E5DDD3] bg-white p-5 shadow-[0_18px_55px_rgba(73,47,32,0.08)] sm:p-8">
          {memberships.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A3E24]">Your stores</p>
                  <h1 className="mt-1 text-2xl font-extrabold text-[#2F2925]">Select a bakery</h1>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(v => !v);
                    setError("");
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#D9CEC4] bg-[#FAF1EB] px-3.5 py-2 text-xs font-bold text-[#7A3E24] hover:bg-[#F3DED1] transition-colors"
                >
                  <Plus size={15} />
                  {showCreateForm ? "Cancel" : "Add new bakery"}
                </button>
              </div>
              <p className="mt-2 text-sm text-[#6F655E]">
                Business data stays hidden until you confirm a store.
              </p>

              {!showCreateForm ? (
                <>
                  <div role="radiogroup" aria-label="Available bakeries" className="mt-6 grid gap-3 sm:grid-cols-2">
                    {memberships.map(membership => {
                      const checked = selectedId === membership.bakeryId;
                      return (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          key={membership.id}
                          onClick={() => setSelectedId(membership.bakeryId)}
                          className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            checked ? "border-[#7A3E24] bg-[#F8EEE8] ring-2 ring-[#7A3E24]/10" : "border-[#E5DDD3] hover:border-[#C7B6A8]"
                          }`}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#7A3E24]">
                            <Store size={21} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-extrabold text-[#2F2925]">{membership.bakeryName}</span>
                            <span className="mt-1 block text-xs capitalize text-[#7C7068]">
                              {membership.role}{membership.isDefault ? " · Default" : ""}
                            </span>
                          </span>
                          {checked && <Check size={19} className="text-[#7A3E24]" aria-hidden="true" />}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(true);
                        setError("");
                      }}
                      className="flex min-h-24 items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#D9CEC4] p-4 text-left transition hover:border-[#7A3E24] hover:bg-[#FAF1EB]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FAF1EB] text-[#7A3E24]">
                        <Plus size={21} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-extrabold text-[#7A3E24]">+ Create a new bakery</span>
                        <span className="mt-0.5 block text-xs text-[#988D84]">Add another store location</span>
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => selected && onSelect(selected)}
                    className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#7A3E24] font-bold text-white hover:bg-[#934E2E] disabled:opacity-50 sm:w-auto sm:px-8"
                  >
                    Enter bakery
                  </button>
                </>
              ) : (
                <form onSubmit={createBakery} className="mt-6 rounded-2xl border border-[#E5DDD3] bg-[#FAF1EB]/60 p-5">
                  <h2 className="text-base font-extrabold text-[#2F2925]">Add another bakery</h2>
                  <p className="mt-1 text-xs text-[#6F655E]">You will be assigned as the Owner for this new location.</p>
                  <label htmlFor="bakery-name-add" className="mt-4 block text-xs font-bold text-[#403832] uppercase tracking-wider">Bakery name</label>
                  <input
                    id="bakery-name-add"
                    aria-label="New bakery name"
                    value={bakeryName}
                    onChange={event => setBakeryName(event.target.value)}
                    placeholder="e.g. J'adore Bakery II"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#D9CEC4] bg-white px-4 text-sm outline-none focus:border-[#7A3E24] focus:ring-2 focus:ring-[#7A3E24]/15 sm:max-w-md"
                    maxLength={120}
                  />
                  {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#B8443C]">{error}</p>}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A3E24] px-6 text-xs font-bold text-white hover:bg-[#934E2E] disabled:opacity-60"
                    >
                      {pending && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
                      {pending ? "Creating bakery…" : "Create & Enter Bakery"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="h-11 rounded-xl border border-[#D9CEC4] bg-white px-4 text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={createBakery}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EEE8] text-[#7A3E24]">
                <Plus size={23} aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#7A3E24]">First store</p>
              <h1 className="mt-2 text-2xl font-extrabold text-[#2F2925]">Create your bakery</h1>
              <p className="mt-2 max-w-xl text-sm text-[#6F655E]">
                You&apos;ll become the Owner. You can invite managers and staff after entering.
              </p>
              <label htmlFor="bakery-name" className="mt-6 block text-sm font-bold text-[#403832]">Bakery name</label>
              <input
                id="bakery-name"
                value={bakeryName}
                onChange={event => setBakeryName(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-[#D9CEC4] px-4 outline-none focus:border-[#7A3E24] focus:ring-2 focus:ring-[#7A3E24]/15 sm:max-w-md"
                maxLength={120}
              />
              {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#B8443C]">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7A3E24] px-6 font-bold text-white disabled:opacity-60"
              >
                {pending && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
                {pending ? "Creating bakery…" : "Create bakery"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
