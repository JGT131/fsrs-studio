// Founder's Guest beta-code chip + activation popover.
// Lets two licensed engineer beta testers unlock unlimited simulated +
// real-mode access for their session by entering a code (default
// "FSRS-BETA-FRIEND"). Code is verified against the backend, then stored
// in localStorage so the axios interceptor attaches X-Guest-Code to every
// API call.

import { useEffect, useState } from "react";
import axios from "axios";
import { Key, KeyRound, X, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { getGuestCode, setGuestCode, clearGuestCode } from "@/lib/clientId";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GuestCodeChip() {
    const [active, setActive] = useState(false);
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [windowHours, setWindowHours] = useState(24);

    useEffect(() => {
        // Reflect current state on mount + verify against backend
        const code = getGuestCode();
        if (!code) return;
        (async () => {
            try {
                const res = await axios.post(`${API}/studio/guest/verify`, null, {
                    headers: { "X-Guest-Code": code },
                });
                setActive(!!res.data?.ok);
                if (res.data?.window_hours) setWindowHours(res.data.window_hours);
                if (!res.data?.ok) clearGuestCode();
            } catch (e) {
                /* leave state as-is on transient error */
            }
        })();
    }, []);

    const handleActivate = async (e) => {
        e?.preventDefault();
        const code = input.trim();
        if (!code) {
            toast.error("Enter a guest code first.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/studio/guest/verify`, null, {
                headers: { "X-Guest-Code": code },
            });
            if (res.data?.ok) {
                setGuestCode(code);
                setActive(true);
                if (res.data?.window_hours) setWindowHours(res.data.window_hours);
                toast.success("Founder's Guest access activated.");
                setOpen(false);
                setInput("");
            } else {
                toast.error("Invalid guest code.");
            }
        } catch (e) {
            toast.error("Could not verify code. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = () => {
        clearGuestCode();
        setActive(false);
        toast.success("Founder's Guest access cleared.");
    };

    return (
        <>
            {active ? (
                <button
                    onClick={handleDeactivate}
                    className="inline-flex items-center gap-2 border border-emerald-400/50 bg-emerald-400/10 hover:bg-emerald-400/20 px-2.5 py-1.5 fsrs-label text-emerald-300 transition-colors"
                    title="Click to clear Founder's Guest access"
                    data-testid="guest-code-active-chip"
                >
                    <ShieldCheck className="w-3 h-3" strokeWidth={2} />
                    GUEST&nbsp;·&nbsp;UNLIMITED
                    <X className="w-3 h-3 opacity-60" strokeWidth={2} />
                </button>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 border border-white/15 hover:border-amber-400 hover:text-amber-300 px-2.5 py-1.5 fsrs-label text-slate-400 transition-colors"
                    data-testid="guest-code-open-button"
                >
                    <Key className="w-3 h-3" strokeWidth={2} />
                    BETA&nbsp;CODE
                </button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="!rounded-none !p-0 !max-w-md !border-white/15 !bg-black !shadow-[0_0_0_1px_rgba(16,185,129,0.4),0_30px_80px_-20px_rgba(16,185,129,0.25)]"
                    data-testid="guest-code-modal"
                >
                    <div className="relative">
                        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-400" />
                        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-400" />
                        <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-400" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-400" />

                        <div className="px-7 pt-8 pb-5 border-b border-white/10">
                            <div className="fsrs-overline mb-3 flex items-center gap-3 text-emerald-300">
                                <KeyRound className="w-3 h-3" strokeWidth={2} />
                                FOUNDER&apos;S&nbsp;GUEST&nbsp;//&nbsp;BETA&nbsp;ACCESS
                            </div>
                            <DialogTitle asChild>
                                <h3 className="fsrs-heading text-white text-2xl leading-tight">
                                    Activate extended beta access.
                                </h3>
                            </DialogTitle>
                            <DialogDescription asChild>
                                <p className="mt-2 text-slate-400 text-base font-mono">
                                    Enter your guest code to unlock unlimited
                                    simulated runs and bypass project caps
                                    for this {windowHours}-hour session.
                                </p>
                            </DialogDescription>
                        </div>

                        <form onSubmit={handleActivate} className="px-7 py-7 space-y-5">
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    GUEST CODE
                                </span>
                                <input
                                    autoFocus
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="FSRS-BETA-FRIEND"
                                    className="fsrs-input uppercase tracking-wider"
                                    data-testid="guest-code-input"
                                />
                            </label>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="fsrs-cta-ghost"
                                    data-testid="guest-code-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="fsrs-cta disabled:opacity-60"
                                    data-testid="guest-code-activate"
                                >
                                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                                    {submitting ? "Verifying…" : "Activate"}
                                </button>
                            </div>
                            <p className="text-lg font-mono text-slate-500 leading-relaxed">
                                Codes are issued individually to licensed beta
                                testers. Keep yours private. All FSRS output
                                disclaimers (preliminary only, PE review
                                required) still apply.
                            </p>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
