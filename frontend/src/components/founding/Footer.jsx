import { Link } from "react-router-dom";
import Logo from "@/components/founding/Logo";
import { openLegalDisclaimer } from "@/components/founding/LegalDisclaimerModal";

export default function Footer() {
    return (
        <footer
            className="relative bg-black border-t border-white/10"
            data-testid="footer"
        >
            <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 pb-10">
                {/* Brand + Links */}
                <div className="grid md:grid-cols-12 gap-10 pb-10 border-b border-white/10">
                    <div className="md:col-span-4">
                        <Link
                            to="/"
                            aria-label="FSRS — Home"
                            className="inline-flex cursor-pointer transition-opacity duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 mb-4"
                            data-testid="footer-home-logo-link"
                        >
                            <Logo
                                size={36}
                                showTagline
                                variant="stacked"
                                data-testid="footer-logo"
                            />
                        </Link>
                        <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                            Fire Suppression Retrofit Studio — the AI fire
                            suppression design assistant for Florida high-rise
                            and NFPA 13 existing-building sprinkler retrofit
                            projects. Engineered for licensed PE review.
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <div className="fsrs-label text-slate-500 mb-4">
                            PRODUCT
                        </div>
                        <ul
                            className="space-y-2 text-lg text-slate-300"
                            data-testid="footer-product-links"
                        >
                            <li>
                                <Link to="/how-it-works" className="hover:text-red-500">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link to="/pricing" className="hover:text-red-500">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link to="/examples" className="hover:text-red-500">
                                    Examples
                                </Link>
                            </li>
                            <li>
                                <Link to="/testimonials" className="hover:text-red-500">
                                    Testimonials
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <div className="fsrs-label text-slate-500 mb-4">
                            BY&nbsp;LOCATION
                        </div>
                        <ul
                            className="space-y-2 text-lg text-slate-300"
                            data-testid="footer-solutions-links"
                        >
                            <li>
                                <Link
                                    to="/solutions/miami-high-rise-retrofit"
                                    className="hover:text-red-500"
                                    data-testid="footer-link-miami"
                                >
                                    Miami
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/solutions/orlando-condo-fire-safety"
                                    className="hover:text-red-500"
                                    data-testid="footer-link-orlando"
                                >
                                    Orlando
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/solutions/tampa-fire-code-compliance"
                                    className="hover:text-red-500"
                                    data-testid="footer-link-tampa"
                                >
                                    Tampa
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <div className="fsrs-label text-slate-500 mb-4">
                            RESOURCES
                        </div>
                        <ul
                            className="space-y-2 text-lg text-slate-300"
                            data-testid="footer-resources-links"
                        >
                            <li>
                                <Link
                                    to="/resources"
                                    className="hover:text-red-500"
                                    data-testid="footer-link-resources"
                                >
                                    Resource Center
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/resources/florida-high-rise-fire-code-retrofit-checklist-2026"
                                    className="hover:text-red-500"
                                    data-testid="footer-link-florida-checklist"
                                >
                                    Florida Retrofit Checklist
                                </Link>
                            </li>
                        </ul>
                        <div className="fsrs-label text-slate-500 mt-6 mb-2">
                            STANDARDS
                        </div>
                        <ul className="space-y-1 text-lg text-slate-300">
                            <li>NFPA 13</li>
                            <li>NFPA 13R</li>
                            <li>NFPA 13D</li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <div className="fsrs-label text-slate-500 mb-4">
                            SUPPORT
                        </div>
                        <ul
                            className="space-y-2 text-lg text-slate-300"
                            data-testid="footer-support-links"
                        >
                            <li>
                                <Link
                                    to="/support"
                                    className="hover:text-red-500"
                                    data-testid="footer-link-support"
                                >
                                    Customer Support
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="mailto:support@fsr-studio.com"
                                    className="hover:text-red-500 break-all"
                                    data-testid="footer-link-support-email"
                                >
                                    support@fsr-studio.com
                                </a>
                            </li>
                            <li className="fsrs-mono text-base text-slate-500">
                                Response time: ~2 business days
                            </li>
                            <li>
                                <a
                                    href="#privacy"
                                    className="hover:text-red-500 underline decoration-white/20 underline-offset-2"
                                >
                                    Privacy & Security
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Privacy block */}
                <div
                    id="privacy"
                    className="mt-10 mb-6 border border-white/10 bg-white/[0.02] p-5"
                    data-testid="footer-privacy-block"
                >
                    <div className="fsrs-label text-slate-400 mb-2">
                        /&nbsp;PRIVACY&nbsp;&&nbsp;SECURITY
                    </div>
                    <p className="fsrs-mono text-slate-300 text-base leading-relaxed">
                        Your drawings are encrypted in transit and at rest. We never use your data for training. You own your data and can delete it anytime. Sessions are private — no human reviews your drawings.
                    </p>
                </div>

                <div className="pt-8 flex flex-wrap items-center justify-between gap-4 fsrs-label text-slate-500">
                    <span>
                        © {new Date().getFullYear()} FSRS&nbsp;//&nbsp;ALL&nbsp;SYSTEMS&nbsp;NOMINAL
                    </span>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={openLegalDisclaimer}
                            className="hover:text-amber-300 underline decoration-amber-500/30 underline-offset-4 cursor-pointer transition-colors"
                            data-testid="footer-legal-disclaimer-link"
                        >
                            ENGINEERING&nbsp;DISCLAIMER
                        </button>
                        <span className="hidden md:inline">
                            BUILT&nbsp;FOR&nbsp;LICENSED&nbsp;FIRE&nbsp;PROTECTION&nbsp;ENGINEERS
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
