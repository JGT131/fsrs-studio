import { useEffect, useState } from "react";
import { Quote, ArrowRight, CheckCircle2, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import DemoFeedbackModal from "@/components/founding/DemoFeedbackModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Testimonials() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shareOpen, setShareOpen] = useState(false);
    const [readAllOpen, setReadAllOpen] = useState(false);
    const [demoFeedbackOpen, setDemoFeedbackOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API}/testimonials`, {
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const visible = items.slice(0, 8);
    const hasMany = items.length >= 5;

    return (
        <section
            id="testimonials"
            className="relative border-b border-white/10 bg-black overflow-hidden"
            data-testid="testimonials-section"
        >
            <div className="absolute inset-0 fsrs-grid-bg-fine opacity-30 pointer-events-none" />
            <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
                <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
                    <div>
                        <div className="fsrs-overline mb-4">
                            /&nbsp;FIELD&nbsp;REPORTS
                        </div>
                        <h2 className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
                            WHAT BETA MEMBERS
                            <br />
                            ARE SAYING.
                        </h2>
                    </div>
                    {items.length > 0 && (
                        <p
                            className="max-w-md text-slate-400 text-lg leading-relaxed"
                            data-testid="testimonials-social-proof-counter"
                        >
                            Join {items.length}&nbsp;other engineer
                            {items.length === 1 ? "" : "s"} who&apos;ve shared
                            their FSRS results.
                        </p>
                    )}
                </div>

                {loading ? (
                    <LoadingShell />
                ) : items.length === 0 ? (
                    <EmptyState
                        onShareStory={() => setShareOpen(true)}
                        onShareDemo={() => setDemoFeedbackOpen(true)}
                    />
                ) : (
                    <>
                        <TestimonialGrid items={visible} />
                        {hasMany && (
                            <div className="mt-10 flex items-center justify-between flex-wrap gap-4">
                                <button
                                    onClick={() => setReadAllOpen(true)}
                                    className="fsrs-cta-ghost"
                                    data-testid="testimonials-read-all-button"
                                >
                                    Read all testimonials
                                    <ArrowRight
                                        className="w-4 h-4"
                                        strokeWidth={2}
                                    />
                                </button>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                        onClick={() => setDemoFeedbackOpen(true)}
                                        className="fsrs-cta-ghost border-amber-400/40 text-amber-300 hover:text-amber-200 hover:border-amber-400"
                                        data-testid="testimonials-share-demo-cta"
                                    >
                                        <MessageSquare className="w-4 h-4" strokeWidth={2} />
                                        Share Your Demo Experience
                                    </button>
                                    <button
                                        onClick={() => setShareOpen(true)}
                                        className="fsrs-cta"
                                        data-testid="testimonials-share-cta"
                                    >
                                        Share Your FSRS Story
                                        <ArrowRight
                                            className="w-4 h-4"
                                            strokeWidth={2}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ShareStoryModal
                open={shareOpen}
                onOpenChange={setShareOpen}
                onSubmitted={() => toast.success("Submission received. Pending verification.")}
            />
            <ReadAllModal
                open={readAllOpen}
                onOpenChange={setReadAllOpen}
                items={items}
            />
            <DemoFeedbackModal
                open={demoFeedbackOpen}
                onOpenChange={setDemoFeedbackOpen}
                source="testimonials_section"
            />
        </section>
    );
}

function TestimonialGrid({ items }) {
    return (
        <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10"
            data-testid="testimonials-grid"
        >
            {items.map((t, i) => (
                <figure
                    key={t.id || i}
                    className="relative bg-black p-8 lg:p-10 flex flex-col group transition-all duration-300 hover:bg-white/[0.03] hover:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.35)]"
                    data-testid={`testimonial-${i}`}
                >
                    <div className="flex items-start justify-between mb-6">
                        <Quote
                            className="w-6 h-6 text-red-500 transition-transform duration-300 group-hover:scale-110"
                            strokeWidth={1.5}
                        />
                        <span className="fsrs-label text-slate-600">
                            REF&nbsp;/&nbsp;
                            {String(i + 1).padStart(2, "0")}
                        </span>
                    </div>
                    <blockquote className="text-slate-100 fsrs-heading font-bold text-lg lg:text-xl leading-snug mb-8 flex-1">
                        &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="pt-6 border-t border-white/10">
                        <div className="fsrs-mono text-white text-lg">
                            — {t.full_name}
                        </div>
                        <div className="fsrs-label text-slate-500 mt-1">
                            {t.title}
                            {t.company ? ` · ${t.company}` : ""}
                        </div>
                        {(t.project_type || t.location) && (
                            <div className="fsrs-label text-slate-600 mt-1">
                                {[t.project_type, t.location]
                                    .filter(Boolean)
                                    .join("  //  ")}
                            </div>
                        )}
                    </figcaption>
                </figure>
            ))}
        </div>
    );
}

function EmptyState({ onShareStory, onShareDemo }) {
    return (
        <div
            className="relative border border-white/10 bg-black/40 backdrop-blur-sm"
            data-testid="testimonials-empty-state"
        >
            {/* corner ticks */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

            <div className="px-8 lg:px-14 py-16 lg:py-20 flex flex-col lg:flex-row items-start lg:items-center gap-12">
                <div className="flex-1 max-w-2xl">
                    <div className="fsrs-overline mb-4 flex items-center gap-3">
                        <span className="fsrs-dot" />
                        AUTHENTIC&nbsp;TESTIMONIALS&nbsp;ONLY
                    </div>
                    <h3
                        className="fsrs-heading text-white text-3xl sm:text-4xl lg:text-5xl leading-[1.05] mb-5"
                        data-testid="testimonials-empty-headline"
                    >
                        Real results from
                        <br />
                        real engineers.
                    </h3>
                    <p
                        className="text-slate-300 text-base leading-relaxed mb-6 max-w-xl"
                        data-testid="testimonials-empty-body"
                    >
                        Founding Beta members are already seeing dramatic time
                        savings on NFPA&nbsp;13 retrofits. Be among the first
                        to share your experience.
                    </p>
                    <div
                        className="fsrs-label text-slate-500 mb-8"
                        data-testid="testimonials-empty-tag"
                    >
                        COMING&nbsp;SOON&nbsp;FROM&nbsp;FLORIDA&nbsp;FPE&nbsp;FIRMS&nbsp;AND&nbsp;BEYOND
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={onShareStory}
                            className="fsrs-cta"
                            data-testid="testimonials-share-story-button"
                        >
                            Share Your FSRS Story
                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                            onClick={onShareDemo}
                            className="fsrs-cta-ghost border-amber-400/40 text-amber-300 hover:text-amber-200 hover:border-amber-400"
                            data-testid="testimonials-share-demo-button"
                        >
                            <MessageSquare className="w-4 h-4" strokeWidth={2} />
                            Share Your Demo Experience
                        </button>
                    </div>
                    <p className="mt-4 text-lg font-mono text-slate-500 max-w-md leading-relaxed">
                        <span className="text-red-400">FSRS Story</span> — verified PE/engineer who completed a project.&nbsp;&nbsp;
                        <span className="text-amber-300">Demo Experience</span> — anyone who tried the simulated demo. The two are stored & displayed separately.
                    </p>
                </div>

                <div className="hidden lg:flex flex-col items-end gap-3 shrink-0 pr-2">
                    <div className="fsrs-label text-slate-600">
                        AUTHENTICITY&nbsp;PROTOCOL
                    </div>
                    <ul className="text-right space-y-2 text-base font-mono text-slate-400 max-w-[260px]">
                        <li>· No stock quotes</li>
                        <li>· No fabricated names</li>
                        <li>· Verified PE / NICET only</li>
                        <li>· Project completion required</li>
                        <li className="pt-2 text-amber-300/80">· Demo feedback kept separate</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function LoadingShell() {
    return (
        <div
            className="border border-white/10 bg-black/40 px-8 py-16 flex items-center justify-center"
            data-testid="testimonials-loading"
        >
            <div className="fsrs-label text-slate-500 animate-pulse">
                LOADING&nbsp;FIELD&nbsp;REPORTS…
            </div>
        </div>
    );
}

function ShareStoryModal({ open, onOpenChange, onSubmitted }) {
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [form, setForm] = useState({
        full_name: "",
        title: "",
        company: "",
        email: "",
        quote: "",
        project_type: "",
        location: "",
    });

    const handleChange = (k) => (e) =>
        setForm((s) => ({ ...s, [k]: e.target.value }));

    const reset = () => {
        setForm({
            full_name: "",
            title: "",
            company: "",
            email: "",
            quote: "",
            project_type: "",
            location: "",
        });
        setDone(false);
    };

    const handleClose = (next) => {
        onOpenChange(next);
        if (!next) setTimeout(reset, 250);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (
            !form.full_name.trim() ||
            !form.title.trim() ||
            !form.company.trim() ||
            !form.email.trim() ||
            form.quote.trim().length < 20
        ) {
            toast.error("All fields required. Quote must be at least 20 chars.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/testimonials/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `HTTP ${res.status}`);
            }
            setDone(true);
            onSubmitted?.();
        } catch (err) {
            toast.error("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="!rounded-none !p-0 !max-w-xl !border-white/15 !bg-black !shadow-[0_0_0_1px_rgba(239,68,68,0.4),0_30px_80px_-20px_rgba(239,68,68,0.25)]"
                data-testid="share-story-modal"
            >
                <div className="relative">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

                    <div className="px-7 pt-8 pb-5 border-b border-white/10">
                        <div className="fsrs-overline mb-3 flex items-center gap-3">
                            <span className="fsrs-dot" />
                            FIELD&nbsp;REPORT&nbsp;//&nbsp;SUBMISSION
                        </div>
                        <DialogTitle asChild>
                            <h3 className="fsrs-heading text-white text-2xl sm:text-3xl leading-tight">
                                {done
                                    ? "Submission received."
                                    : "Share your FSRS story."}
                            </h3>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <p className="mt-2 text-slate-400 text-base font-mono">
                                {done
                                    ? "We'll verify and publish after review. We never display fabricated quotes."
                                    : "Verified PEs / engineers only. Will publish after manual review."}
                            </p>
                        </DialogDescription>
                    </div>

                    {done ? (
                        <div className="px-7 py-10 flex flex-col items-center text-center">
                            <div className="w-14 h-14 border border-red-500/60 flex items-center justify-center mb-5">
                                <CheckCircle2
                                    className="w-7 h-7 text-red-500"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <p className="text-slate-200 fsrs-mono text-lg mb-2">
                                PENDING&nbsp;REVIEW
                            </p>
                            <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                                Thank you. Your submission will appear publicly
                                only after we verify your credentials and a
                                completed FSRS project.
                            </p>
                            <button
                                onClick={() => handleClose(false)}
                                className="fsrs-cta mt-8"
                                data-testid="share-story-close-button"
                            >
                                Acknowledged
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="px-7 py-7 space-y-4 max-h-[70vh] overflow-y-auto"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="FULL NAME" required>
                                    <input
                                        type="text"
                                        value={form.full_name}
                                        onChange={handleChange("full_name")}
                                        placeholder="Jane Doe, P.E."
                                        className="fsrs-input"
                                        data-testid="share-story-name-input"
                                        required
                                    />
                                </Field>
                                <Field label="TITLE" required>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={handleChange("title")}
                                        placeholder="Principal FPE"
                                        className="fsrs-input"
                                        data-testid="share-story-title-input"
                                        required
                                    />
                                </Field>
                            </div>
                            <Field label="COMPANY / FIRM" required>
                                <input
                                    type="text"
                                    value={form.company}
                                    onChange={handleChange("company")}
                                    placeholder="Firm name"
                                    className="fsrs-input"
                                    data-testid="share-story-company-input"
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
                                    data-testid="share-story-email-input"
                                    required
                                />
                            </Field>
                            <Field label="YOUR QUOTE" required>
                                <textarea
                                    value={form.quote}
                                    onChange={handleChange("quote")}
                                    placeholder="Tell us how FSRS impacted your retrofit work…"
                                    rows={4}
                                    className="fsrs-input resize-none"
                                    data-testid="share-story-quote-input"
                                    minLength={20}
                                    maxLength={600}
                                    required
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="PROJECT TYPE (OPTIONAL)">
                                    <input
                                        type="text"
                                        value={form.project_type}
                                        onChange={handleChange("project_type")}
                                        placeholder="High-Rise · 12 stories"
                                        className="fsrs-input"
                                        data-testid="share-story-project-input"
                                    />
                                </Field>
                                <Field label="LOCATION (OPTIONAL)">
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={handleChange("location")}
                                        placeholder="Miami, FL"
                                        className="fsrs-input"
                                        data-testid="share-story-location-input"
                                    />
                                </Field>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleClose(false)}
                                    className="fsrs-cta-ghost"
                                    data-testid="share-story-cancel-button"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="fsrs-cta disabled:opacity-60"
                                    data-testid="share-story-submit-button"
                                >
                                    {submitting ? "Submitting…" : "Submit for Review"}
                                    <ArrowRight
                                        className="w-4 h-4"
                                        strokeWidth={2}
                                    />
                                </button>
                            </div>

                            <p className="pt-2 text-lg font-mono text-slate-500 leading-relaxed">
                                Submissions are reviewed manually. FSRS only
                                publishes verified quotes from engineers who
                                have completed at least one FSRS project.
                            </p>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ReadAllModal({ open, onOpenChange, items }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="!rounded-none !p-0 !max-w-3xl !border-white/15 !bg-black"
                data-testid="read-all-testimonials-modal"
            >
                <div className="relative">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />

                    <div className="px-7 pt-8 pb-5 border-b border-white/10 flex items-start justify-between">
                        <div>
                            <div className="fsrs-overline mb-3">
                                /&nbsp;ALL&nbsp;FIELD&nbsp;REPORTS
                            </div>
                            <DialogTitle asChild>
                                <h3 className="fsrs-heading text-white text-2xl sm:text-3xl leading-tight">
                                    {items.length} verified testimonial
                                    {items.length === 1 ? "" : "s"}
                                </h3>
                            </DialogTitle>
                            <DialogDescription asChild>
                                <p className="mt-2 text-slate-400 text-base font-mono">
                                    Newest first. Each verified by FSRS and
                                    tied to a completed project.
                                </p>
                            </DialogDescription>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="text-slate-400 hover:text-white p-1"
                            aria-label="Close"
                            data-testid="read-all-close-button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-7 py-7 space-y-5 max-h-[70vh] overflow-y-auto">
                        {items.map((t, i) => (
                            <article
                                key={t.id || i}
                                className="border border-white/10 p-6 hover:border-red-500/40 transition-colors"
                                data-testid={`read-all-testimonial-${i}`}
                            >
                                <Quote
                                    className="w-5 h-5 text-red-500 mb-3"
                                    strokeWidth={1.5}
                                />
                                <p className="text-slate-100 fsrs-heading font-bold text-base leading-snug mb-5">
                                    &ldquo;{t.quote}&rdquo;
                                </p>
                                <div className="fsrs-mono text-white text-base">
                                    — {t.full_name}
                                </div>
                                <div className="fsrs-label text-slate-500 mt-1">
                                    {t.title}
                                    {t.company ? ` · ${t.company}` : ""}
                                </div>
                                {(t.project_type || t.location) && (
                                    <div className="fsrs-label text-slate-600 mt-1">
                                        {[t.project_type, t.location]
                                            .filter(Boolean)
                                            .join("  //  ")}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="fsrs-label text-slate-400 mb-2 block">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </span>
            {children}
        </label>
    );
}
