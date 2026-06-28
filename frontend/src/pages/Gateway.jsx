import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Logo from "@/components/founding/Logo";
import Footer from "@/components/founding/Footer";
import LegalDisclaimerModal from "@/components/founding/LegalDisclaimerModal";
import { getClientId } from "@/lib/clientId";
import {
    User,
    CreditCard,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Loader2,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLANS = [
    {
        key: "founding_beta",
        label: "Founding Beta",
        price: "$249 one-time",
        sub: "One-time access · no subscription",
        bullets: ["Real AI processing", "10 SRUs included one-time · $25/extra SRU", "Submit unlimited drawings — limits apply only to exports", "Lifetime Founding badge"],
    },
    {
        key: "payg",
        label: "Pay-As-You-Go",
        price: "Usage-based",
        sub: "Monthly cap default $100",
        bullets: ["Real AI processing", "Unlimited projects", "Default $100/mo cap"],
    },
];

export default function Gateway() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState({ name: "", email: "", firm: "", license: "" });
    const [card, setCard] = useState({ cardholder: "", number: "", exp: "", cvc: "" });
    const [plan, setPlan] = useState("founding_beta");
    const [cap, setCap] = useState(100);
    const [submitting, setSubmitting] = useState(false);
    const [meTier, setMeTier] = useState(null);

    useEffect(() => {
        // Resume gateway state
        (async () => {
            try {
                const me = await axios.get(`${API}/billing/me`, {
                    headers: { "X-Client-Id": getClientId() },
                });
                setMeTier(me.data);
                if (me.data.profile) {
                    setStep(me.data.profile.card_added ? (me.data.profile.plan ? 4 : 3) : 2);
                    setProfile({
                        name: me.data.profile.name || "",
                        email: me.data.profile.email || "",
                        firm: me.data.profile.firm || "",
                        license: me.data.profile.license || "",
                    });
                }
            } catch (e) {
                /* ignore */
            }
        })();
    }, []);

    const submitProfile = async (e) => {
        e.preventDefault();
        if (!profile.name.trim() || !profile.email.trim()) {
            toast.error("Name and email are required.");
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`${API}/billing/profile`, profile, {
                headers: { "X-Client-Id": getClientId() },
            });
            toast.success("Profile saved [MOCKED]");
            setStep(2);
        } catch (err) {
            toast.error(err?.response?.data?.detail || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const submitCard = async (e) => {
        e.preventDefault();
        const digits = card.number.replace(/\D/g, "");
        if (digits.length < 4) {
            toast.error("Enter a card number (this is MOCKED — no real charge).");
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(
                `${API}/billing/card`,
                {
                    cardholder: card.cardholder || profile.name,
                    last4: digits.slice(-4),
                    brand: digits.startsWith("4") ? "VISA" : "MASTERCARD",
                },
                { headers: { "X-Client-Id": getClientId() } },
            );
            toast.success("Card stored (MOCKED — no Stripe call made)");
            setStep(3);
        } catch (err) {
            toast.error(err?.response?.data?.detail || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const submitPlan = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(
                `${API}/billing/plan`,
                { plan, monthly_cap_usd: plan === "payg" ? Number(cap) : null },
                { headers: { "X-Client-Id": getClientId() } },
            );
            toast.success(`Plan activated: ${plan} [MOCKED]`);
            setStep(4);
        } catch (err) {
            const d = err?.response?.data?.detail;
            toast.error(typeof d === "string" ? d : err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-slate-100 flex flex-col" data-testid="gateway-page">
            <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur border-b border-white/10">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-10 h-16 flex items-center justify-between">
                    <Link
                        to="/"
                        aria-label="FSRS — Home"
                        className="cursor-pointer transition-opacity duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                        data-testid="gateway-home-logo-link"
                    >
                        <Logo size={30} />
                    </Link>
                    <span className="fsrs-label text-slate-500">
                        REAL-MODE&nbsp;GATEWAY&nbsp;//&nbsp;MOCKED&nbsp;BILLING
                    </span>
                    <Link to="/studio" className="fsrs-cta-ghost text-lg py-2 px-3">
                        ← Back to Demo
                    </Link>
                </div>
            </header>

            {/* MOCKED billing warning banner */}
            <div className="border-b-2 border-amber-500 bg-amber-500/10" data-testid="gateway-mocked-banner">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-10 py-3 flex items-center gap-3 flex-wrap">
                    <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={2} />
                    <span className="fsrs-mono text-amber-200 font-bold text-base sm:text-lg">
                        MOCKED&nbsp;BILLING&nbsp;—&nbsp;NO&nbsp;REAL&nbsp;STRIPE&nbsp;INTEGRATION.
                        &nbsp;NO&nbsp;CARD&nbsp;IS&nbsp;CHARGED.
                    </span>
                    <span className="ml-auto fsrs-label text-amber-300/80">
                        REAL&nbsp;PAYMENTS&nbsp;=&nbsp;P0&nbsp;FOLLOW-UP
                    </span>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-10 py-12 flex-1">
                {/* Step strip */}
                <div className="grid grid-cols-3 gap-3 mb-10" data-testid="gateway-steps">
                    <Step idx="01" label="PROFILE" icon={User} active={step >= 1} done={step > 1} />
                    <Step idx="02" label="PAYMENT METHOD" icon={CreditCard} active={step >= 2} done={step > 2} />
                    <Step idx="03" label="CHOOSE PLAN" icon={ShieldCheck} active={step >= 3} done={step > 3} />
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Form column */}
                    <div className="lg:col-span-7 border border-white/10 bg-black p-6 lg:p-8">
                        {step === 1 && (
                            <form onSubmit={submitProfile} className="space-y-4" data-testid="profile-form">
                                <h2 className="fsrs-heading text-white text-2xl mb-2">Create your profile</h2>
                                <p className="fsrs-mono text-slate-400 text-base leading-relaxed mb-6">
                                    Profile is stored in MongoDB keyed by an anonymous client ID. <span className="text-amber-300">No real authentication yet — that&apos;s a P0 follow-up.</span>
                                </p>
                                <Field label="FULL NAME" required>
                                    <input className="fsrs-input" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} data-testid="profile-name" placeholder="Jane Doe, P.E." />
                                </Field>
                                <Field label="WORK EMAIL" required>
                                    <input type="email" className="fsrs-input" required value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} data-testid="profile-email" placeholder="jane@firmname.com" />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="FIRM (OPTIONAL)">
                                        <input className="fsrs-input" value={profile.firm} onChange={(e) => setProfile({ ...profile, firm: e.target.value })} placeholder="Firm name" />
                                    </Field>
                                    <Field label="PE LICENSE #">
                                        <input className="fsrs-input" value={profile.license} onChange={(e) => setProfile({ ...profile, license: e.target.value })} placeholder="State + Number" />
                                    </Field>
                                </div>
                                <button type="submit" disabled={submitting} className="fsrs-cta disabled:opacity-50" data-testid="profile-submit">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    Continue to payment
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={submitCard} className="space-y-4" data-testid="card-form">
                                <h2 className="fsrs-heading text-white text-2xl mb-2">Add a payment method</h2>
                                {/* Plan H — transparent billing */}
                                <div className="border border-emerald-500/40 bg-emerald-500/[0.05] p-3 mb-3">
                                    <p className="fsrs-mono text-emerald-200 text-base leading-relaxed font-bold">
                                        You will only be charged after you start real processing. Cancel anytime. No long-term contracts.
                                    </p>
                                </div>
                                <p className="fsrs-mono text-amber-300 text-base leading-relaxed mb-6 font-bold">
                                    MOCKED INPUT — no real Stripe call. Only the last 4 digits are stored. Real card processing requires the Stripe integration playbook before launch.
                                </p>
                                <Field label="CARDHOLDER">
                                    <input className="fsrs-input" value={card.cardholder} onChange={(e) => setCard({ ...card, cardholder: e.target.value })} placeholder={profile.name || "Cardholder name"} data-testid="card-name" />
                                </Field>
                                <Field label="CARD NUMBER" required>
                                    <input className="fsrs-input" required value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242 (mocked)" data-testid="card-number" />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="EXP (MM/YY)">
                                        <input className="fsrs-input" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="12/29" />
                                    </Field>
                                    <Field label="CVC">
                                        <input className="fsrs-input" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="123" />
                                    </Field>
                                </div>
                                <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                                    <button type="button" onClick={() => setStep(1)} className="fsrs-cta-ghost text-lg">← Back</button>
                                    <button type="submit" disabled={submitting} className="fsrs-cta disabled:opacity-50" data-testid="card-submit">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                        Continue to plan
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={submitPlan} className="space-y-4" data-testid="plan-form">
                                <h2 className="fsrs-heading text-white text-2xl mb-2">Choose your plan</h2>
                                <p className="fsrs-mono text-slate-400 text-base leading-relaxed mb-4">
                                    Tier policy is enforced server-side via the mocked client-id.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {PLANS.map((p) => {
                                        const active = plan === p.key;
                                        return (
                                            <button
                                                type="button"
                                                key={p.key}
                                                onClick={() => setPlan(p.key)}
                                                className={`text-left p-5 border transition-all ${active ? "border-red-500 bg-red-500/5 shadow-[inset_0_0_60px_-20px_rgba(239,68,68,0.3)]" : "border-white/15 hover:border-white/40"}`}
                                                data-testid={`plan-${p.key}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="fsrs-heading text-white text-lg">{p.label}</span>
                                                    {active && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                                                </div>
                                                <div className="fsrs-mono text-white text-xl mb-1">{p.price}</div>
                                                <div className="fsrs-label text-slate-500 mb-3">{p.sub}</div>
                                                <ul className="space-y-1">
                                                    {p.bullets.map((b, i) => (
                                                        <li key={i} className="fsrs-mono text-slate-300 text-base flex items-center gap-2">
                                                            <span className="w-1 h-1 bg-red-500" /> {b}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </button>
                                        );
                                    })}
                                </div>
                                {plan === "payg" && (
                                    <Field label="MONTHLY CAP (USD)">
                                        <input type="number" min="20" max="5000" className="fsrs-input" value={cap} onChange={(e) => setCap(e.target.value)} data-testid="payg-cap" />
                                    </Field>
                                )}
                                <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                                    <button type="button" onClick={() => setStep(2)} className="fsrs-cta-ghost text-lg">← Back</button>
                                    <button type="submit" disabled={submitting} className="fsrs-cta disabled:opacity-50" data-testid="plan-submit">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Activate plan [MOCKED]
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 4 && (
                            <div className="text-center py-8" data-testid="gateway-success">
                                <div className="w-14 h-14 border border-emerald-500/60 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
                                </div>
                                <h2 className="fsrs-heading text-white text-2xl mb-3">Real Mode unlocked</h2>
                                <p className="fsrs-mono text-slate-400 text-base max-w-md mx-auto mb-2 leading-relaxed">
                                    Your profile, payment method, and plan are now stored (MOCKED). Real Stripe + auth swap is the P0 follow-up before any production charge.
                                </p>
                                <p className="fsrs-mono text-amber-300 text-base max-w-md mx-auto mb-6 leading-relaxed">
                                    Reminder: even in &quot;real&quot; mode, the underlying AI / hydraulic solver / CAD kernel are still mocked. All outputs require PE review.
                                </p>
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    <Link to="/studio" className="fsrs-cta-ghost text-lg">
                                        Back to demo
                                    </Link>
                                    <button onClick={() => navigate("/studio")} className="fsrs-cta">
                                        Open Studio (real-mode flag) <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right sidebar — tier policy */}
                    <aside className="lg:col-span-5 border border-white/10 bg-black p-6 lg:p-8">
                        <div className="fsrs-overline mb-4">
                            /&nbsp;TIER&nbsp;POLICY
                        </div>
                        <ul className="space-y-4">
                            <PolicyItem k="FREE TIER (DEMO)" v="1 simulated demo export per lifetime · no real AI · no real uploads" tone="amber" />
                            <PolicyItem k="FOUNDING BETA · $249 one-time" v="Real AI · 10 SRUs included one-time · $25/extra SRU · no subscription · lifetime founder badge" tone="emerald" />
                            <PolicyItem k="PAY-AS-YOU-GO" v="Real AI · usage-based · default $100/mo cap (configurable)" tone="emerald" />
                        </ul>
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="fsrs-mono text-slate-500 text-lg leading-relaxed">
                                Tier limits are enforced server-side. Real Stripe billing is a P0 follow-up — current implementation persists profile + last-4 digit only, no charge.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            <Footer />
            <LegalDisclaimerModal />
        </main>
    );
}

function Step({ idx, label, icon: Icon, active, done }) {
    return (
        <div className={`flex items-center gap-3 px-3 py-3 border ${active ? "border-red-500/60 bg-red-500/5" : "border-white/10 bg-black"}`}>
            <div className={`w-8 h-8 border flex items-center justify-center shrink-0 ${active ? "border-red-500" : "border-white/15"}`}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} /> : <Icon className={`w-3.5 h-3.5 ${active ? "text-red-500" : "text-slate-500"}`} strokeWidth={1.5} />}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="fsrs-label text-slate-500">STEP&nbsp;{idx}</span>
                <span className={`fsrs-mono text-base ${active ? "text-white" : "text-slate-400"}`}>{label}</span>
            </div>
            <span className={`ml-auto fsrs-label ${done ? "text-emerald-400" : active ? "text-red-500" : "text-slate-700"}`}>
                {done ? "OK" : active ? "•" : "—"}
            </span>
        </div>
    );
}

function PolicyItem({ k, v, tone }) {
    const c = tone === "amber" ? "text-amber-300" : tone === "emerald" ? "text-emerald-300" : "text-slate-300";
    return (
        <li className="border-l-2 border-white/15 pl-3">
            <div className={`fsrs-label ${c} font-bold mb-1`}>{k}</div>
            <div className="fsrs-mono text-slate-300 text-base leading-relaxed">{v}</div>
        </li>
    );
}

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="fsrs-label text-slate-400 mb-2 block">
                {label}{required && <span className="text-red-500"> *</span>}
            </span>
            {children}
        </label>
    );
}
