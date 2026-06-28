import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Logo from "@/components/founding/Logo";

export default function SignupModal({ open, onOpenChange }) {
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        license: "",
        company: "",
    });

    const handleChange = (k) => (e) =>
        setForm((s) => ({ ...s, [k]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) {
            toast.error("Name and email are required.");
            return;
        }
        setSubmitting(true);
        // Frontend-only: simulate request
        setTimeout(() => {
            setSubmitting(false);
            setDone(true);
            toast.success(
                `Spot reserved for ${form.name.split(" ")[0]}. Check your inbox.`,
            );
        }, 900);
    };

    const handleClose = (next) => {
        onOpenChange(next);
        if (!next) {
            // small reset delay so user doesn't see flash
            setTimeout(() => {
                setDone(false);
                setForm({ name: "", email: "", license: "", company: "" });
            }, 250);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="!rounded-none !p-0 !max-w-lg !border-white/15 !bg-black !shadow-[0_0_0_1px_rgba(239,68,68,0.4),0_30px_80px_-20px_rgba(239,68,68,0.25)]"
                data-testid="signup-modal"
            >
                <div className="relative">
                    {/* corner ticks */}
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

                    {/* Header */}
                    <div className="px-7 pt-8 pb-5 border-b border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <Logo size={28} data-testid="modal-logo" />
                            <span className="fsrs-label text-slate-500">
                                BETA&nbsp;//&nbsp;SEAT
                            </span>
                        </div>
                        <div className="fsrs-overline mb-3 flex items-center gap-3">
                            <span className="fsrs-dot" />
                            FOUNDING&nbsp;BETA&nbsp;//&nbsp;SEAT&nbsp;RESERVATION
                        </div>
                        <DialogTitle asChild>
                            <h3 className="fsrs-heading text-white text-2xl sm:text-3xl leading-tight">
                                {done ? "Spot reserved." : "Claim your founding spot."}
                            </h3>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <p className="mt-2 text-slate-300 text-base font-mono">
                                {done
                                    ? "We&apos;ll be in touch shortly with onboarding details."
                                    : "$249 one-time access · 10 SRUs included · no subscription"}
                            </p>
                        </DialogDescription>
                    </div>

                    {/* Body */}
                    {done ? (
                        <div className="px-7 py-10 flex flex-col items-center text-center">
                            <div className="w-14 h-14 border border-red-500/60 flex items-center justify-center mb-5">
                                <CheckCircle2
                                    className="w-7 h-7 text-red-500"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <p className="text-slate-200 fsrs-mono text-lg mb-1">
                                CONF#&nbsp;FSRS-
                                {Math.floor(Math.random() * 90000 + 10000)}
                            </p>
                            <p className="text-slate-300 text-lg max-w-xs leading-relaxed">
                                You&apos;re officially on the Founding Beta
                                list. Watch your inbox for next steps.
                            </p>
                            <button
                                onClick={() => handleClose(false)}
                                className="fsrs-cta mt-8"
                                data-testid="signup-modal-close-button"
                            >
                                Acknowledged
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="px-7 py-7 space-y-4"
                        >
                            <Field label="FULL NAME" required>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange("name")}
                                    placeholder="Jane Doe, P.E."
                                    className="fsrs-input"
                                    data-testid="signup-name-input"
                                    required
                                />
                            </Field>
                            <Field label="WORK EMAIL" required>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange("email")}
                                    placeholder="jane@firmname.com"
                                    className="fsrs-input"
                                    data-testid="signup-email-input"
                                    required
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="FIRM (OPTIONAL)">
                                    <input
                                        type="text"
                                        value={form.company}
                                        onChange={handleChange("company")}
                                        placeholder="Firm name"
                                        className="fsrs-input"
                                        data-testid="signup-company-input"
                                    />
                                </Field>
                                <Field label="PE LICENSE #">
                                    <input
                                        type="text"
                                        value={form.license}
                                        onChange={handleChange("license")}
                                        placeholder="State + #"
                                        className="fsrs-input"
                                        data-testid="signup-license-input"
                                    />
                                </Field>
                            </div>

                            <div className="pt-3 flex items-center justify-between gap-4 flex-wrap">
                                <div className="fsrs-label text-slate-500">
                                    FIRST&nbsp;100&nbsp;ENGINEERS&nbsp;·&nbsp;$249&nbsp;ONE-TIME
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="fsrs-cta disabled:opacity-60"
                                    data-testid="signup-submit-button"
                                >
                                    {submitting
                                        ? "Reserving…"
                                        : "Reserve My Spot"}
                                    <ArrowRight
                                        className="w-4 h-4"
                                        strokeWidth={2}
                                    />
                                </button>
                            </div>

                            <p className="pt-3 text-lg font-mono text-slate-500 leading-relaxed">
                                By reserving a spot you agree to receive
                                onboarding emails from FSRS. No spam. All
                                outputs require licensed PE review before use.
                            </p>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="fsrs-label text-slate-300 mb-2 block">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </span>
            {children}
        </label>
    );
}
