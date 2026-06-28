import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Low-friction Demo Experience feedback modal.
 *
 * Distinct from the "Share Your FSRS Story" testimonial modal:
 *  - No email, no project completion, no credit card required
 *  - Required: Name, Quote
 *  - Optional: Firm
 *  - Backend stores in private 'demo_feedback' queue tagged "Demo Experience"
 *  - NEVER mixed with verified testimonials
 */
export default function DemoFeedbackModal({ open, onOpenChange, source = "testimonials" }) {
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [form, setForm] = useState({ name: "", quote: "", firm: "" });

    const handleChange = (k) => (e) =>
        setForm((s) => ({ ...s, [k]: e.target.value }));

    const reset = () => {
        setForm({ name: "", quote: "", firm: "" });
        setDone(false);
    };

    const handleClose = (next) => {
        onOpenChange(next);
        if (!next) setTimeout(reset, 250);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || form.quote.trim().length < 5) {
            toast.error("Name and a short quote (5+ chars) are required.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/testimonials/demo-feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, source }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `HTTP ${res.status}`);
            }
            setDone(true);
            toast.success("Demo feedback received.");
        } catch (err) {
            toast.error("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="!rounded-none !p-0 !max-w-lg !border-white/15 !bg-black !shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_30px_80px_-20px_rgba(245,158,11,0.25)]"
                data-testid="demo-feedback-modal"
            >
                <div className="relative">
                    {/* amber corner ticks distinguish this from real testimonial flow */}
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-400" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-400" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-400" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-400" />

                    <div className="px-7 pt-8 pb-5 border-b border-white/10">
                        <div className="fsrs-overline mb-3 flex items-center gap-3 text-amber-300">
                            <MessageSquare className="w-3 h-3" strokeWidth={2} />
                            DEMO&nbsp;EXPERIENCE&nbsp;//&nbsp;FEEDBACK
                        </div>
                        <DialogTitle asChild>
                            <h3 className="fsrs-heading text-white text-2xl sm:text-3xl leading-tight">
                                {done
                                    ? "Feedback received."
                                    : "Share your demo experience."}
                            </h3>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <p className="mt-2 text-slate-400 text-base font-mono">
                                {done
                                    ? "Filed under 'Demo Experience' — reviewed separately from verified engineer testimonials."
                                    : "No email · no card · no project required. Tell us what you thought of the FSRS simulated demo."}
                            </p>
                        </DialogDescription>
                    </div>

                    {done ? (
                        <div className="px-7 py-10 flex flex-col items-center text-center">
                            <div className="w-14 h-14 border border-amber-400/60 flex items-center justify-center mb-5">
                                <CheckCircle2
                                    className="w-7 h-7 text-amber-400"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <p className="text-slate-200 fsrs-mono text-lg mb-2">
                                LABEL&nbsp;·&nbsp;DEMO&nbsp;EXPERIENCE
                            </p>
                            <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                                Thanks. Your note is in our private review
                                queue and will never be presented as a
                                verified engineer testimonial.
                            </p>
                            <button
                                onClick={() => handleClose(false)}
                                className="fsrs-cta-ghost mt-8"
                                data-testid="demo-feedback-close-button"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="px-7 py-7 space-y-4"
                        >
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    YOUR NAME
                                    <span className="text-amber-400"> *</span>
                                </span>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange("name")}
                                    placeholder="Jane Doe"
                                    className="fsrs-input"
                                    data-testid="demo-feedback-name-input"
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    SHORT QUOTE
                                    <span className="text-amber-400"> *</span>
                                </span>
                                <textarea
                                    value={form.quote}
                                    onChange={handleChange("quote")}
                                    placeholder="What stood out about the simulated demo?"
                                    rows={3}
                                    className="fsrs-input resize-none"
                                    data-testid="demo-feedback-quote-input"
                                    minLength={5}
                                    maxLength={600}
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    FIRM (OPTIONAL)
                                </span>
                                <input
                                    type="text"
                                    value={form.firm}
                                    onChange={handleChange("firm")}
                                    placeholder="Firm name"
                                    className="fsrs-input"
                                    data-testid="demo-feedback-firm-input"
                                />
                            </label>

                            <div className="pt-3 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleClose(false)}
                                    className="fsrs-cta-ghost"
                                    data-testid="demo-feedback-cancel-button"
                                >
                                    Maybe later
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="fsrs-cta disabled:opacity-60"
                                    data-testid="demo-feedback-submit-button"
                                >
                                    {submitting ? "Sending…" : "Send Feedback"}
                                    <ArrowRight
                                        className="w-4 h-4"
                                        strokeWidth={2}
                                    />
                                </button>
                            </div>

                            <p className="pt-2 text-lg font-mono text-slate-500 leading-relaxed">
                                This feedback is labeled <span className="text-amber-300">&ldquo;Demo Experience&rdquo;</span> and stored separately from verified engineer testimonials. It will never be displayed as a real-engineer quote.
                            </p>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
