// Persistent top navigation used on every public page.
// All sub-page nav links open in the SAME tab using react-router <Link>.
import { ArrowUpRight } from "lucide-react";
import Logo from "@/components/founding/Logo";
import { Link } from "react-router-dom";

const NAV = [
    { to: "/how-it-works", label: "How It Works" },
    { to: "/examples", label: "Examples" },
    { to: "/pricing", label: "Pricing" },
    { to: "/resources", label: "Resources" },
    { to: "/support", label: "Support" },
    { to: "/testimonials", label: "Testimonials" },
];

export default function TopNav({ onCtaClick }) {
    return (
        <header
            className="sticky top-0 z-40 w-full bg-black/85 backdrop-blur border-b border-white/10"
            data-testid="top-nav"
        >
            <div className="mx-auto max-w-[1500px] px-5 lg:px-10 h-16 flex items-center justify-between gap-6">
                <Link
                    to="/"
                    aria-label="FSRS — Home"
                    className="cursor-pointer transition-opacity duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 shrink-0"
                    data-testid="nav-home-logo-link"
                >
                    <Logo
                        size={30}
                        showTagline
                        variant="inline"
                        data-testid="brand-wordmark"
                        className="hidden lg:inline-flex"
                    />
                    <Logo
                        size={30}
                        showTagline={false}
                        variant="inline"
                        data-testid="brand-wordmark-mobile"
                        className="lg:hidden"
                    />
                </Link>

                <nav
                    className="hidden md:flex items-center gap-2"
                    data-testid="primary-nav-buttons"
                >
                    {NAV.map((n) => (
                        <Link
                            key={n.to}
                            to={n.to}
                            className="fsrs-cta-ghost text-lg tracking-wider py-2 px-3"
                            data-testid={`nav-link-${n.to.replace(/\//g, "")}`}
                        >
                            {n.label.toUpperCase()}
                            <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                        </Link>
                    ))}
                    <Link
                        to="/studio"
                        className="fsrs-cta-ghost text-lg tracking-wider py-2 px-3"
                        data-testid="nav-studio-link"
                    >
                        STUDIO DEMO
                        <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                    </Link>
                </nav>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onCtaClick}
                        className="fsrs-cta-ghost text-lg tracking-wider py-2 px-3 hidden md:inline-flex"
                        data-testid="nav-cta-button"
                    >
                        CLAIM
                    </button>
                </div>
            </div>

            {/* mobile secondary nav row */}
            <nav
                className="md:hidden flex items-center gap-1 overflow-x-auto px-5 pb-3 border-t border-white/5"
                data-testid="primary-nav-buttons-mobile"
            >
                {NAV.map((n) => (
                    <Link
                        key={n.to}
                        to={n.to}
                        className="fsrs-cta-ghost shrink-0 text-lg py-1.5 px-2.5"
                    >
                        {n.label.toUpperCase()}
                    </Link>
                ))}
                <Link
                    to="/studio"
                    className="fsrs-cta-ghost shrink-0 text-lg py-1.5 px-2.5"
                >
                    DEMO
                </Link>
            </nav>
        </header>
    );
}
