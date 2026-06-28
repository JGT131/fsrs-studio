// Floating legal/engineering disclaimer modal.
//
// - Auto-opens on a user's FIRST arrival to the site (per browser, tracked
//   via localStorage flag `fsrs_disclaimer_ack_v1`).
// - Can be reopened any time via the footer "Engineering Disclaimer" link
//   (call `openLegalDisclaimer()` exported from this module).
// - "Acknowledge & Continue" sets the flag so it doesn't auto-popup again.
//
// PERMANENT GATE: Real-export PE-stamp acknowledgment in the Studio is
// ENTIRELY SEPARATE from this banner — it is still required at export
// time regardless of whether this modal was acknowledged.

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const ACK_KEY = "fsrs_disclaimer_ack_v1";

// Tiny pub/sub so the Footer can request the modal to open.
const listeners = new Set();
export function openLegalDisclaimer() {
    listeners.forEach((fn) => fn(true));
}

export default function LegalDisclaimerModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Auto-open on first arrival
        try {
            const ack = localStorage.getItem(ACK_KEY);
            if (!ack) {
                // tiny delay so it doesn't appear before the first paint
                const t = setTimeout(() => setOpen(true), 450);
                return () => clearTimeout(t);
            }
        } catch (e) {
            /* SSR / blocked storage — no auto-popup */
        }
    }, []);

    useEffect(() => {
        const fn = (val) => setOpen(val);
        listeners.add(fn);
        return () => {
            listeners.delete(fn);
        };
    }, []);

    const handleAck = () => {
        try {
            localStorage.setItem(ACK_KEY, new Date().toISOString());
        } catch (e) {
            /* ignore */
        }
        setOpen(false);
    };

    return (
        <Dialog 
  open={open} 
  onOpenChange={(isOpen) => {
    if (!isOpen) return; // Prevent closing via X, backdrop, or Escape
    setOpen(isOpen);
  }}
>
            <DialogContent
                className="!rounded-none !p-0 !max-w-2xl !border-amber-400/40 !bg-black !shadow-[0_0_0_1px_rgba(245,158,11,0.45),0_30px_90px_-20px_rgba(245,158,11,0.35)]"
                data-testid="legal-disclaimer-modal"
            >
                <div className="relative">
                    {/* corner ticks */}
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-400" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-400" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-400" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-400" />

                    <div className="px-7 pt-8 pb-5 border-b border-amber-400/20">
                        <div className="fsrs-overline mb-3 flex items-center gap-3 text-amber-300">
                            <AlertTriangle
                                className="w-3.5 h-3.5"
                                strokeWidth={2}
                            />
                            ENGINEERING&nbsp;DISCLAIMER
                        </div>
                        <DialogTitle asChild>
                            <h3 className="fsrs-heading text-white text-2xl sm:text-3xl leading-tight">
                                Read this before using FSRS.
                            </h3>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <p className="mt-2 text-slate-400 text-base font-mono">
                                One-time acknowledgment. Reopen any time from
                                the footer.
                            </p>
                        </DialogDescription>
                    </div>

                    <div className="px-7 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
                        <section>
                            <div className="fsrs-label text-amber-300 mb-1.5">
                                INTENDED&nbsp;USE
                            </div>
                            <p className="fsrs-mono text-amber-100/95 text-lg leading-relaxed">
                                FSRS is a rapid preliminary analysis tool to
                                help licensed fire protection engineers
                                quickly evaluate drawings received for
                                RFP&nbsp;/&nbsp;bidding purposes.
                            </p>
                        </section>

                        <section>
                            <div className="fsrs-label text-amber-300 mb-1.5">
                                CRITICAL&nbsp;RESTRICTION
                            </div>
                            <p className="fsrs-mono text-amber-100/95 text-lg leading-relaxed">
                                Outputs are{" "}
                                <span className="text-amber-50 underline decoration-amber-400 underline-offset-2">
                                    NOT for use as final construction documents
                                    or client deliverables.
                                </span>{" "}
                                All outputs are preliminary only and must be
                                reviewed, modified, and stamped by a licensed
                                PE before any permitting, fabrication,
                                installation, or client submittal.
                            </p>
                        </section>

                        <section>
                            <p className="fsrs-mono text-amber-200/90 text-base leading-relaxed">
                                FSRS is not a substitute for professional
                                engineering judgment.
                            </p>
                        </section>

                        <section className="border-t border-amber-400/15 pt-4">
                            <p className="text-slate-400 text-base leading-relaxed">
                                A separate PE-stamp acknowledgment is still
                                required inside the Studio before any export
                                is generated.
                            </p>
                        </section>
                    </div>

                    <div className="px-7 py-5 border-t border-amber-400/20 flex items-center justify-end gap-3">
                        <button
                            onClick={handleAck}
                            className="fsrs-cta"
                            data-testid="legal-disclaimer-acknowledge"
                        >
                            <CheckCircle2
                                className="w-4 h-4"
                                strokeWidth={2}
                            />
                            Acknowledge &amp; Continue
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
