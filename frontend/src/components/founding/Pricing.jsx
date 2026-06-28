import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
    Check, Sparkles, ArrowRight, Crown, Briefcase, Users,
    Infinity as InfinityIcon, Download, Rocket, ShieldCheck, Loader2
} from "lucide-react";

const API = "/api";
const CLIENT_KEY = "fsrs_client_id";

function getClientId() {
    if (typeof window === "undefined") return null;
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
        id = `fsrs_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
        localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
}

async function startCheckout(packageId) {
    const r = await axios.post(`${API}/payments/v1/checkout/session`, {
        package_id: packageId,
        origin_url: window.location.origin,
        client_id: getClientId(),
    });
    if (r.data?.checkout_url) {
        window.location.href = r.data.checkout_url;
        return;
    }
    throw new Error("No checkout URL returned");
}

const COUNTDOWN_KEY = "fsrs_beta_deadline";
function getDeadline() {
    const stored = typeof window !== "undefined" && localStorage.getItem(COUNTDOWN_KEY);
    if (stored) {
        const n = parseInt(stored, 10);
        if (!Number.isNaN(n) && n > Date.now()) return n;
    }
    const d = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (typeof window !== "undefined") localStorage.setItem(COUNTDOWN_KEY, String(d));
    return d;
}
function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }

function useCountdown() {
    const [d] = useState(() => getDeadline());
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const diff = Math.max(0, d - now);
    return {
        days: pad(diff / 86400000),
        hours: pad((diff / 3600000) % 24),
        minutes: pad((diff / 60000) % 60),
        seconds: pad((diff / 1000) % 60),
    };
}

const TIERS = [
    {
        key: "starter", name: "STARTER", price: "$99", period: " one-time",
        tag: "Lowest-cost entry · single-engineer",
        bullets: ["5 SRUs included", "Heavy watermarked exports", "Single seat"],
        cta: "Get Starter — $99",
    },
    {
        key: "founding_beta", name: "FOUNDING BETA", price: "$249", period: " one-time",
        tag: "First 100 engineers · offer expires in 30 days",
        bullets: ["15 SRUs included", "Lifetime Founding badge", "Priority feature requests"],
        cta: "Claim $249 Founding Spot",
    },
    {
        key: "professional", name: "PROFESSIONAL", price: "$399", period: " one-time",
        popular: true, guarantee: true, tag: "For active firms",
        bullets: ["30 SRUs included", "Team seats (up to 3)", "30-Day Money-Back Guarantee"],
        cta: "Notify Me at Launch",
    },
    {
        key: "firm", name: "FIRM PLAN", price: "$1,499", period: " one-time",
        guarantee: true, tag: "For multi-engineer firms",
        bullets: ["100 SRUs included", "Team seats (up to 5)", "Shared Project Dashboard"],
        cta: "Reserve Firm Seat",
    },
];

export default function Pricing() {
    const t = useCountdown();
    const [pendingPkg, setPendingPkg] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleClaim = async (packageKey) => {
        if (pendingPkg) return;
        if (!termsAccepted) {
            toast.error("Please agree to the Terms of Service before proceeding.");
            return;
        }
        setPendingPkg(packageKey);
        try {
            await startCheckout(packageKey);
        } catch (e) {
            setPendingPkg(null);
            toast.error("Checkout failed. Please check your connection.");
        }
    };

    return (
        <section className="bg-black py-20">
            <div className="mx-auto max-w-[1400px] px-6">
                <div className="grid lg:grid-cols-4 gap-6">
                    {TIERS.map((p) => (
                        <div key={p.key} className="border border-white/10 p-6 flex flex-col">
                            <h2 className="fsrs-heading text-white text-xl mb-4">{p.name}</h2>
                            <div className="text-white text-4xl font-bold mb-6">{p.price}</div>
                            <ul className="space-y-3 mb-10 flex-1">
                                {p.bullets.map((b, i) => (
                                    <li key={i} className="text-slate-400 text-lg flex gap-2">
                                        <Check className="w-5 h-5 text-emerald-500" /> {b}
                                    </li>
                                ))}
                            </ul>
                            <div className="mb-6 flex items-start gap-3">
                                <input 
                                    type="checkbox" 
                                    id={`terms-${p.key}`} 
                                    checked={termsAccepted} 
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1.5 h-5 w-5 rounded border-white/20 bg-white/5 text-red-600"
                                />
                                <label htmlFor={`terms-${p.key}`} className="text-slate-400 text-base cursor-pointer">
                                    Agree to <Link to="/terms" target="_blank" className="underline">Terms & Disclaimer</Link>
                                </label>
                            </div>
                            <button 
                                onClick={() => handleClaim(p.key)}
                                className={`fsrs-cta-ghost py-4 flex justify-center items-center gap-2 ${pendingPkg === p.key ? "opacity-50" : ""}`}
                            >
                                {pendingPkg === p.key ? <Loader2 className="animate-spin" /> : p.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
