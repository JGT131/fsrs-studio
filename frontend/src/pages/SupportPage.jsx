// V2.3 — Customer Support page (/support).
// Founding Beta support pathway for licensed fire protection engineers.
import { Link } from "react-router-dom";
import PageShell from "@/components/founding/PageShell";
import SeoHead from "@/components/seo/SeoHead";
import { organizationSchema, softwareApplicationSchema, faqSchema } from "@/lib/seo";
import {
    LifeBuoy,
    Mail,
    Clock,
    ShieldAlert,
    Sparkles,
    ArrowRight,
    MessageCircle,
} from "lucide-react";

export const SUPPORT_EMAIL = "support@fsr-studio.com";
export const SUPPORT_RESPONSE = "Within 2 business days";

// NOTE: These three technical/liability FAQs anchor the support page.
// Swap the `q`/`a` strings to update copy without changing layout.
const SUPPORT_FAQS = [
    {
        q: "Is FSRS a stamped design tool — can I submit its outputs directly to the AHJ?",
        a: "No. FSRS is an AI fire suppression design assistant that produces preliminary, watermarked drafts. Every layout, hazard classification, hydraulic summary, and PDF / DXF / IFC export is labelled SIMULATED · PRELIMINARY · NOT FOR ENGINEERING USE and must be reviewed, modified, and stamped by a licensed Florida Professional Engineer before any AHJ submittal, fabrication, or installation. The PE of record retains full engineering responsibility.",
    },
    {
        q: "Who carries professional liability for a FSRS-assisted retrofit design?",
        a: "The licensed Professional Engineer who reviews, modifies, and stamps the deliverable carries professional liability — exactly as with any other design tool used in the FPE&rsquo;s workflow. FSRS is positioned as a draft accelerator; it does not certify outputs and does not relieve the PE of independent engineering judgment. Our Terms of Service make this explicit and your firm&rsquo;s E&amp;O policy should treat FSRS as an internal design aid only.",
    },
    {
        q: "Which NFPA edition and Florida code amendments does FSRS reference for its drafts?",
        a: "Drafts reference NFPA 13 / 13R / 13D in alignment with the Florida Fire Prevention Code 8th Edition (NFPA 1 / NFPA 101, 2021 with Florida amendments). FSRS surfaces relevant SB 4-D and SB 154 context but does not auto-merge local AHJ amendments. The PE of record is responsible for overlaying jurisdiction-specific amendments (e.g., Miami-Dade RER, City of Orlando, City of Tampa) prior to stamping.",
    },
];

export default function SupportPage() {
    return (
        <PageShell>
            <SeoHead
                title="FSRS Customer Support · Founding Beta Support for Licensed Engineers"
                description="Founding Beta support for licensed fire protection engineers using FSRS — the AI fire suppression retrofit studio. Email support@fsr-studio.com · typical response within 2 business days."
                keywords="fsrs customer support, fire suppression retrofit studio support, founding beta support, ai fire suppression design assistant help, licensed engineer support"
                canonical="/support"
                jsonLd={[
                    organizationSchema(),
                    softwareApplicationSchema(),
                    faqSchema(SUPPORT_FAQS),
                ]}
            />

            <section
                className="relative border-b border-white/10 bg-black"
                data-testid="support-page"
            >
                <div className="mx-auto max-w-[1200px] px-6 lg:px-10 py-16 lg:py-24">
                    {/* Header */}
                    <div className="fsrs-overline mb-4 flex items-center gap-3 text-emerald-300">
                        <LifeBuoy className="w-3.5 h-3.5" strokeWidth={2} />
                        /&nbsp;CUSTOMER&nbsp;SUPPORT
                    </div>
                    <h1
                        className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl leading-[0.95]"
                        data-testid="support-title"
                    >
                        FSRS&nbsp;Customer&nbsp;<span className="text-red-500">Support</span>.
                    </h1>

                    {/* Section 1 — Founding Beta Support */}
                    <div
                        className="mt-10 border-l-4 border-emerald-400 bg-emerald-400/[0.06] px-6 py-5 max-w-3xl"
                        data-testid="support-section-founding"
                    >
                        <div className="fsrs-overline text-emerald-300 mb-2">
                            FOUNDING&nbsp;BETA&nbsp;SUPPORT
                        </div>
                        <p className="text-slate-200 text-base lg:text-lg leading-relaxed">
                            We&rsquo;re here to help licensed fire protection
                            engineers get the most out of FSRS — the{" "}
                            <span className="text-white">
                                Fire Suppression Retrofit Studio
                            </span>
                            . Founding Beta members get direct founder access
                            for product feedback, technical questions, and
                            workflow guidance.
                        </p>
                    </div>

                    {/* Section 2 — Contact */}
                    <div
                        className="mt-10 grid md:grid-cols-2 gap-0 border border-white/10"
                        data-testid="support-section-contact"
                    >
                        <div className="bg-black p-6 lg:p-7 md:border-r border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 border border-red-500/50 bg-red-500/[0.06] flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                                </div>
                                <span className="fsrs-overline text-red-400">
                                    CONTACT
                                </span>
                            </div>
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                className="fsrs-heading text-white text-2xl lg:text-3xl tracking-tight hover:text-red-400 transition-colors"
                                data-testid="support-email-link"
                            >
                                {SUPPORT_EMAIL}
                            </a>
                            <p className="mt-3 fsrs-mono text-slate-400 text-base leading-relaxed">
                                Click to open your default email client.
                                Please include your firm name and Founding
                                Member ID (if applicable) for the fastest
                                response.
                            </p>
                        </div>
                        <div className="bg-black p-6 lg:p-7 border-t md:border-t-0 border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 border border-emerald-400/50 bg-emerald-400/[0.06] flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-emerald-300" strokeWidth={1.5} />
                                </div>
                                <span className="fsrs-overline text-emerald-300">
                                    RESPONSE&nbsp;TIME
                                </span>
                            </div>
                            <div
                                className="fsrs-heading text-white text-2xl lg:text-3xl tracking-tight"
                                data-testid="support-response-time"
                            >
                                {SUPPORT_RESPONSE}
                            </div>
                            <p className="mt-3 fsrs-mono text-slate-400 text-base leading-relaxed">
                                We monitor support inquiries during business
                                hours (Mon–Fri, Eastern). Outages or critical
                                workflow blockers are escalated immediately.
                            </p>
                        </div>
                    </div>

                    {/* Section 3 — FAQ */}
                    <div
                        className="mt-14 border-t border-white/10 pt-10"
                        data-testid="support-section-faq"
                    >
                        <div className="fsrs-overline mb-3 text-emerald-300">
                            /&nbsp;FREQUENTLY&nbsp;ASKED&nbsp;QUESTIONS
                        </div>
                        <h2 className="fsrs-heading text-white text-3xl lg:text-4xl tracking-tight leading-tight">
                            Technical &amp; Liability
                        </h2>
                        <p className="mt-3 max-w-3xl text-slate-400 text-lg leading-relaxed">
                            The three questions licensed engineers ask most
                            before adopting FSRS into their retrofit workflow.
                        </p>
                        <div className="mt-6 divide-y divide-white/10 border border-white/10">
                            {SUPPORT_FAQS.map((f, i) => (
                                <details
                                    key={i}
                                    className="group px-5 py-4"
                                    data-testid={`support-faq-${i}`}
                                >
                                    <summary className="cursor-pointer fsrs-mono text-white text-lg font-semibold flex items-start justify-between gap-4">
                                        <span>{f.q}</span>
                                        <span className="text-red-400 group-open:rotate-45 transition-transform shrink-0">
                                            +
                                        </span>
                                    </summary>
                                    <p
                                        className="mt-3 text-slate-300 text-lg leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: f.a }}
                                    />
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* Liability warning pill — Professional disclaimer */}
                    <div
                        className="mt-12 border-2 border-amber-400 bg-amber-400/[0.10] px-6 py-5 flex items-start gap-4"
                        data-testid="support-liability-pill"
                        role="note"
                        aria-label="Professional disclaimer"
                    >
                        <div className="w-10 h-10 border border-amber-300 bg-amber-400/20 flex items-center justify-center shrink-0">
                            <ShieldAlert
                                className="w-5 h-5 text-amber-200"
                                strokeWidth={2}
                            />
                        </div>
                        <div>
                            <div className="fsrs-overline text-amber-300 mb-1">
                                PROFESSIONAL&nbsp;DISCLAIMER
                            </div>
                            <p className="text-amber-100 text-base lg:text-lg font-semibold leading-snug">
                                FSRS — Fire Suppression Retrofit Studio — is
                                an AI assistant for licensed fire protection
                                engineers only. Every output is preliminary
                                and watermarked, and must be reviewed,
                                modified, and stamped by a licensed PE before
                                any permitting, fabrication, or installation.
                                Support replies are not engineering advice.
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-12 grid lg:grid-cols-12 gap-6 items-center">
                        <div className="lg:col-span-8">
                            <h3 className="fsrs-heading text-white text-2xl lg:text-3xl tracking-tight leading-tight">
                                Ready to pilot FSRS on a real project?
                            </h3>
                            <p className="mt-3 text-slate-400 text-lg leading-relaxed max-w-xl">
                                Founding Beta is $249 one-time with 10 SRUs
                                included — enough to validate FSRS on real
                                Florida retrofit work before scaling.
                            </p>
                        </div>
                        <div className="lg:col-span-4 flex lg:justify-end">
                            <Link
                                to="/app"
                                className="fsrs-cta-claim"
                                data-testid="support-cta-claim"
                            >
                                <Sparkles className="w-4 h-4" strokeWidth={2} />
                                Start Founding Beta — $249 one-time
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </Link>
                        </div>
                    </div>

                    {/* Secondary CTA — direct mail */}
                    <div className="mt-8 flex flex-wrap items-center gap-3 fsrs-mono text-base text-slate-500">
                        <span>Prefer to email directly?</span>
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="fsrs-cta-ghost text-lg tracking-wider py-2 px-3"
                            data-testid="support-mailto-button"
                        >
                            <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
                            Email&nbsp;Support
                        </a>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}
