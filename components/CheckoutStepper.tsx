// Seit dem Single-Page-Checkout (Adresse+Zahlung kombiniert auf
// /checkout/review) gibt es nur noch 3 Schritte. Stepper-active-Indices:
//   0 = /checkout/cart
//   1 = /checkout/review
//   2 = /checkout/success
const steps = [
  { label: "Warenkorb" },
  { label: "Checkout" },
  { label: "Bestätigung" },
];

// Gemeinsamer Checkout-Fortschritt fuer Cart/Review/Success.
// min-w-0 + schmaleres Tracking/Spacing auf Mobile: 3 Labels passen jetzt
// auch bei sehr engen Viewports.
export default function CheckoutStepper({ active }: { active: number }) {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 mb-10">
      <div className="flex items-center gap-1">
        {steps.map((s, i, arr) => (
          <div key={s.label} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex flex-col items-center min-w-0">
              <div
                className={`w-8 h-8 shrink-0 flex items-center justify-center font-headline font-bold text-xs ${
                  i === active
                    ? "bg-primary text-on-primary"
                    : i < active
                    ? "bg-tertiary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`mt-2 font-headline text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest font-bold text-center leading-tight ${
                  i === active
                    ? "text-primary"
                    : i < active
                    ? "text-tertiary"
                    : "text-on-surface-variant"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div className="flex-1 h-px mx-1 sm:mx-2 bg-surface-container" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
