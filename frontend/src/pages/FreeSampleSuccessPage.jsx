// Plan I — Free Sample success / thank-you page.
import { Link, useLocation } from "react-router-dom";
import PageShell from "@/components/founding/PageShell";
import SeoHead from "@/components/seo/SeoHead";
import {
    CheckCircle2,
    Mail,
    ArrowRight,
    Sparkles,
    ShieldCheck,
} from "lucide-react";

export default function FreeSampleSuccessPage() {
    const location = useLocation();
    const state = location.state || {};
    const email = state.email || null;
    const sru = state.estimated_full_sru;
    const remaining = state.remaining_after_claim;

    return (
        <PageShell>
            <SeoHead
                title="Free Sample Scheduled · FSRS"
                description="Your FSRS free preliminary hazard scan has been scheduled. Results delivered via email within 1–2 business days."
                canonical="/free-sample/success"
            />
            <section
                className="relative bg-black border-b border-white/10"
                data-testid="free-sample-success-page"
            >
                <div className="mx-auto max-w-[900px] px-6 lg:px-10 py-20 lg:py-28">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 border border-emerald-400/60 bg-emerald-400/[0.10] mb-8">
                            <CheckCircle2
                                className="w-8 h-8 text-emerald-300"
                                strokeWidth={1.5}
                            />
                        </div>
                        <div className="fsrs-overline mb-4 text-emerald-300 flex items-center justify-center gap-2">
                            <Sparkles className="w-3 h-3" strokeWidth={2} />
                            /&nbsp;FREE&nbsp;SAMPLE&nbsp;SCHEDULED
                        </div>
                        <h1
                            className="fsrs-heading text-white text-4xl sm:text-5xl tracking-tight leading-[0.95]"
                            data-testid="free-sample-success-headline"
                        >
                            Thank you!&nbsp;
                            <br className="sm:hidden" />
                            Your Free Sample is&nbsp;
                            <span className="text-red-500">being processed</span>.
                        </h1>
                        <p
                            className="mt-6 fsrs-mono text-slate-300 text-base leading-relaxed max-w-xl mx-auto"
                            data-testid="free-sample-success-body"
                        >
                            We&rsquo;ll email the results to you within&nbsp;
                            <span className="text-white font-bold">
                                1&ndash;2 business days
                            </span>
                            .
                        </p>

                        {/* Meta strip */}
                        <div
                            className="mt-10 grid sm:grid-cols-3 gap-0 border border-white/10 max-w-2xl mx-auto"
                            data-testid="free-sample-success-meta"
                        >
                            <Meta label="DELIVERY" value="Email" icon={Mail} />
                            <Meta
                                label="ESTIMATE"
                                value={sru != null ? `${Number(sru).toFixed(2)} SRUs` : "—"}
                                divider
                            />
                            <Meta
                                label="SLOTS LEFT"
                                value={remaining != null ? String(remaining) : "—"}
                                divider
                            />
                        </div>

                        {email && (
                            <p
                                className="mt-6 fsrs-mono text-slate-500 text-base"
                                data-testid="free-sample-success-email"
                            >
                                Confirmation sent to&nbsp;
                                <span className="text-slate-200">{email}</span>
                            </p>
                        )}

                        {/* PE notice */}
                        <div
                            className="mt-10 border border-amber-500/40 bg-amber-500/[0.05] p-5 max-w-2xl mx-auto text-left"
                            data-testid="free-sample-success-pe-notice"
                            role="alert"
                        >
                            <div className="fsrs-overline text-amber-300 mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" strokeWidth={2} />
                                /&nbsp;PROFESSIONAL&nbsp;NOTICE
                            </div>
                            <p className="text-amber-100 text-lg leading-relaxed">
                                The Free Sample report is preliminary and
                                watermarked. It is NOT for permitting,
                                fabrication, or construction. A licensed
                                Professional Engineer must review, modify, and
                                stamp the outputs before any use.
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="mt-10 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/studio"
                                className="fsrs-cta-claim"
                                data-testid="free-sample-success-cta-studio"
                            >
                                <Sparkles className="w-4 h-4" strokeWidth={2} />
                                Explore Studio Demo
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </Link>
                            <Link
                                to="/pricing"
                                className="fsrs-cta-ghost text-lg tracking-wider py-3 px-5"
                                data-testid="free-sample-success-cta-pricing"
                            >
                                VIEW PRICING
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}

function Meta({ label, value, icon: Icon, divider }) {
    return (
        <div
            className={`p-5 bg-black ${divider ? "sm:border-l border-white/10 border-t sm:border-t-0" : ""}`}
        >
            <div className="fsrs-label text-slate-500 mb-2 flex items-center gap-1.5 justify-center">
                {Icon && <Icon className="w-3 h-3" strokeWidth={2} />}
                {label}
            </div>
            <div className="fsrs-heading text-white text-xl tracking-tight tabular-nums">
                {value}
            </div>
        </div>
    );
}
