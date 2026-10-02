import { ArrowRight, Check, Package, ShoppingBag, Sparkles, Store } from "lucide-react";
import type { Screen } from "../types";
import type { OnboardingProgress } from "../onboarding";

type SetupStep = {
  id: "product" | "materials" | "order";
  label: string;
  description: string;
  Icon: typeof Store;
};

const steps: readonly SetupStep[] = [
  { id: "product", label: "Add your first product", description: "Start with one thing you bake and sell.", Icon: Store },
  { id: "materials", label: "Add ingredients and packaging", description: "Connect the materials your product needs.", Icon: ShoppingBag },
  { id: "order", label: "Create your first order", description: "See how an order becomes a clear plan.", Icon: Package },
];

export function OnboardingScreen({
  bakeryName = "your bakery",
  progress,
  onNavigate,
  onSkip,
}: {
  bakeryName?: string;
  progress: OnboardingProgress;
  onNavigate: (screen: Screen) => void;
  onSkip: () => void;
}) {
  const activeStep = steps.find(step => !progress[step.id]);
  const activeIndex = Math.max(0, steps.findIndex(step => step.id === activeStep?.id));
  const actionLabel = !activeStep
    ? "Continue to workspace"
    : activeStep.id === "product"
      ? "Add your first product"
      : activeStep.id === "materials"
        ? "Add ingredients and packaging"
        : "Create your first order";

  const continueSetup = () => {
    if (!activeStep) {
      onSkip();
      return;
    }
    onNavigate(activeStep?.id === "order" ? "orders" : "recipes");
  };

  return (
    <main className="min-h-full bg-[#FBF8F3] px-4 py-8 sm:px-6 lg:px-10 lg:py-12" aria-labelledby="onboarding-title">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-[#E5DDD3] bg-white shadow-[0_24px_80px_rgba(73,47,32,0.10)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#7A3E24] text-white shadow-sm">
              <Sparkles size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#7A3E24]">Bakery setup</p>
              <p className="mt-0.5 text-xs font-semibold text-[#988D84]">A few calm steps to get started</p>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B4643B]">Welcome to {bakeryName}</p>
          <h1 id="onboarding-title" className="mt-3 max-w-lg text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#2F2925] sm:text-4xl">
            Let’s get your bakery ready.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#6F655E]">
            Set up one product, one order, and we’ll show you exactly what needs to be prepared. You can pause anytime.
          </p>

          <div className="mt-8 flex items-center gap-2" aria-label={`Step ${Math.min(activeIndex + 1, steps.length)} of ${steps.length}`}>
            {steps.map((step, index) => {
              const done = progress[step.id];
              return <span key={step.id} className={`h-1.5 flex-1 rounded-full ${done || index === activeIndex ? "bg-[#7A3E24]" : "bg-[#EDE6DC]"}`} />;
            })}
          </div>
          <p className="mt-2 text-xs font-bold text-[#988D84]">Step {Math.min(activeIndex + 1, steps.length)} of {steps.length}</p>

          <div className="mt-7 space-y-2.5">
            {steps.map(step => {
              const done = progress[step.id];
              const active = activeStep?.id === step.id;
              return (
                <div key={step.id} className={`flex items-center gap-3 rounded-[16px] border p-3.5 transition-colors ${active ? "border-[#D7B5A2] bg-[#FAF1EB]" : "border-[#EFE8E0] bg-white"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${done ? "bg-[#E8F3EB] text-[#3F7A55]" : active ? "bg-[#7A3E24] text-white" : "bg-[#F6F0E8] text-[#988D84]"}`}>
                    {done ? <Check size={16} aria-hidden="true" /> : <step.Icon size={16} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-extrabold ${done ? "text-[#3F7A55]" : "text-[#2F2925]"}`}>{step.label}</span>
                    <span className="mt-0.5 block text-xs text-[#7C7068]">{done ? "Done" : step.description}</span>
                  </span>
                  {active && <span className="rounded-full bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#7A3E24]">Next</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={continueSetup} className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#7A3E24] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#934E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3E24] focus-visible:ring-offset-2">
              {actionLabel}<ArrowRight size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={onSkip} className="h-11 rounded-[12px] px-4 text-sm font-bold text-[#7C7068] transition hover:bg-[#F6F0E8] hover:text-[#7A3E24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3E24]">
              Skip for now
            </button>
          </div>
        </section>

        <aside className="relative hidden overflow-hidden bg-[#432719] p-10 text-[#FFF9F4] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[28px] border-[#B4643B]/30" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#E6BFA9]">Bake with clarity</p>
            <p className="mt-7 max-w-sm text-4xl font-extrabold leading-[1.02] tracking-[-0.04em]">From first product to final pickup.</p>
            <p className="mt-6 max-w-sm text-sm leading-6 text-[#E8D8CE]">Your bakery workspace will turn the details into a simple plan for the day.</p>
          </div>
          <div className="relative rounded-[18px] border border-white/15 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6BFA9]">Your first win</p>
            <p className="mt-2 text-lg font-extrabold">A clear Prep List</p>
            <p className="mt-1 text-sm leading-5 text-[#E8D8CE]">Ingredients, packaging, and products in one place.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
