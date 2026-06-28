import { useEffect, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import MiniDisclaimer from "@/components/founding/MiniDisclaimer";

const PRICING_BG =
    "https://static.prod-images.emergentagent.com/jobs/128abae8-a09d-412a-a1e2-c3f5643e5632/images/3a09e4f046c71a2228a0dd1d28bda79029016245bd5ea969782ec09776514b66.png";

// Persist countdown end across reloads so it feels real
const COUNTDOWN_KEY = "fsrs_beta_deadline";

function getDeadline() {
    const stored = typeof window !== "undefined" && localStorage.getItem(COUNTDOWN_KEY);
    if (stored) {
        const n = parseInt(stored, 10);
        if (!Number.isNaN(n) && n > Date.now()) return n;
    }
    const newDeadline = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (typeof window !== "undefined") {
        localStorage.setItem(COUNTDOWN_KEY, String(newDeadline));
    }
    return newDeadline;
}

function pad(n) {
    return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function useCountdown() {
    const [deadline] = useState(() => getDeadline());
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const diff = Math.max(0, deadline - now);
    const days = diff / (1000 * 60 * 60 * 24);
    const hours = (diff / (1000 * 60 * 60)) % 24;
    const minutes = (diff / (1000 * 60)) % 60;
    const seconds = (diff / 1000) % 60;

    return { days: pad(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

export default function Offer({ onCtaClick }) {
    const t = useCountdown();
    return (
        <section
            id="offer"
            className="relative border-b border-white/10 bg-black"
            data-testid="offer-section"
        >
            <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Left: label / context */}
                    <div className="lg:col-span-4">
                        <div className="fsrs-overline mb-4">
                            /&nbsp;FOUNDING&nbsp;OFFER
                        </div>
                        <h2 className="fsrs-heading text-white text-4xl sm:text-5xl leading-[0.95] mb-6">
                            THE FIRST 100
                            <br />
                            ENGINEERS
                            <br />
                            <span className="text-red-500">LOCK IT IN.</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-sm">
                            A one-time $249 access with 10 SRUs included. Save
                            20+ hours per retrofit. After founding window
                            closes, Professional pricing starts at $399 one-time.
                        </p>

                        <div className="border border-white/10 divide-y divide-white/10">
                            <Row k="OFFER WINDOW" v="30 DAYS" />
                            <Row k="SEATS" v="FIRST 100 ENGINEERS" highlight />
                            <Row k="BILLING" v="ONE-TIME" />
                            <Row k="SUBSCRIPTION" v="NONE" />
                        </div>
                    </div>

                    {/* Right: pricing card */}
                    <div className="lg:col-span-8 relative">
                        <div className="relative border border-white/15 bg-[#0a0a0a] overflow-hidden">
                            {/* texture overlay */}
                            <div
                                className="absolute inset-0 opacity-[0.18] pointer-events-none"
                                style={{
                                    backgroundImage: `url(${PRICING_BG})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    mixBlendMode: "screen",
                                }}
                            />
                            <div className="absolute inset-0 fsrs-grid-bg-fine opacity-50 pointer-events-none" />
                            <div className="fsrs-scanline" />

                            {/* corner ticks */}
                            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
                            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
                            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

                            <div className="relative p-8 lg:p-12">
                                <div className="flex items-center justify-between mb-10">
                                    <span className="fsrs-label text-slate-400">
                                        SKU&nbsp;//&nbsp;FSRS-BETA-FND
                                    </span>
                                    <span className="inline-flex items-center gap-2 fsrs-label text-red-500">
                                        <Lock
                                            className="w-3 h-3"
                                            strokeWidth={2}
                                        />
                                        LOCKED&nbsp;IN&nbsp;3&nbsp;MO.
                                    </span>
                                </div>

                                <div className="flex items-end gap-6 flex-wrap mb-2">
                                    <div className="flex items-start gap-1">
                                        <span className="fsrs-mono text-slate-400 text-2xl mt-3">
                                            $
                                        </span>
                                        <span
                                            className="fsrs-heading text-white text-[120px] sm:text-[160px] lg:text-[200px] leading-[0.85]"
                                            data-testid="offer-price"
                                        >
                                            249
                                        </span>
                                        <span className="fsrs-mono text-slate-400 text-base mb-6">
                                            one-time
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2 mb-6">
                                        <span className="fsrs-mono text-slate-300 text-base">
                                            Founding rate · 10 SRUs included
                                        </span>
                                        <span className="fsrs-label text-red-500">
                                            SAVE&nbsp;20+&nbsp;HOURS&nbsp;PER&nbsp;RETROFIT
                                        </span>
                                    </div>
                                </div>

                                <div className="fsrs-mono text-slate-400 text-base mb-10">
                                    One-time $249 · 10 SRUs included · no
                                    subscription
                                </div>

                                {/* Countdown */}
                                <div className="mb-10">
                                    <div className="fsrs-label text-slate-400 mb-3 flex items-center gap-3">
                                        <span className="fsrs-dot" />
                                        OFFER&nbsp;EXPIRES&nbsp;IN
                                    </div>
                                    <div
                                        className="grid grid-cols-4 gap-2 sm:gap-3"
                                        data-testid="countdown-timer"
                                    >
                                        {[
                                            { v: t.days, l: "DAYS" },
                                            { v: t.hours, l: "HRS" },
                                            { v: t.minutes, l: "MIN" },
                                            { v: t.seconds, l: "SEC" },
                                        ].map((u, i) => (
                                            <div
                                                key={i}
                                                className="border border-white/15 bg-black px-3 py-4 text-center"
                                            >
                                                <div className="fsrs-mono text-white text-2xl sm:text-3xl lg:text-4xl tabular-nums">
                                                    {u.v}
                                                </div>
                                                <div className="fsrs-label text-slate-500 mt-1">
                                                    {u.l}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <MiniDisclaimer testId="offer-mini-disclaimer" />
                                <button
                                    onClick={onCtaClick}
                                    className="fsrs-cta-claim w-full sm:w-auto justify-center"
                                    data-testid="offer-cta-button"
                                >
                                    Claim My Founding Spot
                                    <ArrowRight
                                        className="w-4 h-4"
                                        strokeWidth={2}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Row({ k, v, highlight }) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <span className="fsrs-label text-slate-500">{k}</span>
            <span
                className={`fsrs-mono text-base ${highlight ? "text-red-500" : "text-slate-200"}`}
            >
                {v}
            </span>
        </div>
    );
}
