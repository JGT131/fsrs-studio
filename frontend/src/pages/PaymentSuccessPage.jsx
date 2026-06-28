// V2.4 — Stripe success-return page. Polls /payments/v1/checkout/status
// until paid (or timeout), then surfaces the new SRU balance.
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import PageShell from "@/components/founding/PageShell";
import SeoHead from "@/components/seo/SeoHead";
import {
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Sparkles,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX = 30; // 60s

export default function PaymentSuccessPage() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const aborted = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            setError("Missing session_id in URL.");
            return;
        }
        let attempt = 0;
        let cancelled = false;
        aborted.current = false;

        const tick = async () => {
            if (cancelled) return;
            attempt += 1;
            setAttempts(attempt);
            try {
                const r = await axios.get(
                    `${API}/payments/v1/checkout/status/${sessionId}`,
                );
                setStatus(r.data);
                if (
                    r.data.payment_status === "paid" ||
                    r.data.status === "expired"
                ) {
                    return; // done
                }
                if (attempt >= POLL_MAX) {
                    setError(
                        "Payment is taking longer than expected. You will receive an email confirmation once it completes.",
                    );
                    return;
                }
                setTimeout(tick, POLL_INTERVAL_MS);
            } catch (e) {
                setError(
                    e?.response?.data?.detail || e.message || "Status check failed",
                );
            }
        };
        tick();
        return () => {
            cancelled = true;
            aborted.current = true;
        };
    }, [sessionId]);

    const paid = status?.payment_status === "paid";

    return (
        <PageShell>
            <SeoHead
                title="Payment Confirmation · FSRS"
                description="Confirming your FSRS Founding Beta purchase."
                canonical="/payments/success"
            />
            <section
                className="relative border-b border-white/10 bg-black"
                data-testid="payment-success-page"
            >
                <div className="mx-auto max-w-[900px] px-6 lg:px-10 py-20 lg:py-28">
                    {!sessionId || error ? (
                        <ErrorState message={error || "Missing session id."} />
                    ) : !paid ? (
                        <PendingState attempts={attempts} status={status} />
                    ) : (
                        <PaidState status={status} />
                    )}
                </div>
            </section>
        </PageShell>
    );
}

function PendingState({ attempts, status }) {
    return (
        <div className="text-center" data-testid="payment-pending-state">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-amber-400/50 bg-amber-400/[0.08] mb-8">
                <Loader2
                    className="w-7 h-7 text-amber-300 animate-spin"
                    strokeWidth={1.5}
                />
            </div>
            <div className="fsrs-overline mb-4 text-amber-300">
                /&nbsp;CONFIRMING&nbsp;YOUR&nbsp;PURCHASE
            </div>
            <h1 className="fsrs-heading text-white text-3xl sm:text-4xl tracking-tight leading-tight">
                Checking with Stripe…
            </h1>
            <p className="mt-4 fsrs-mono text-slate-400 text-base">
                Attempt&nbsp;{attempts}&nbsp;·&nbsp;
                {(status?.payment_status || "initiated").toUpperCase()}
            </p>
        </div>
    );
}

function PaidState({ status }) {
    return (
        <div className="text-center" data-testid="payment-paid-state">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-emerald-400/60 bg-emerald-400/[0.10] mb-8">
                <CheckCircle2
                    className="w-8 h-8 text-emerald-300"
                    strokeWidth={1.5}
                />
            </div>
            <div className="fsrs-overline mb-4 text-emerald-300">
                /&nbsp;PAYMENT&nbsp;CONFIRMED
            </div>
            <h1 className="fsrs-heading text-white text-4xl sm:text-5xl tracking-tight leading-[0.95]">
                Welcome to&nbsp;
                <span className="text-red-500">FSRS Founding Beta</span>.
            </h1>
            <div className="mt-8 grid sm:grid-cols-2 gap-0 border border-white/10 max-w-2xl mx-auto">
                <Card
                    label="SRUs CREDITED"
                    value={`+${status.sru_credited ?? 15}`}
                    accent="emerald"
                    testid="paid-sru-credited"
                />
                <Card
                    label="PLAN"
                    value={(status.plan_granted || "founding_beta")
                        .replace("_", " ")
                        .toUpperCase()}
                    accent="white"
                    testid="paid-plan-granted"
                />
            </div>
            <p className="mt-6 fsrs-mono text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
                Session&nbsp;
                <span className="text-slate-300">{status.session_id?.slice(0, 18)}…</span>
                &nbsp;·&nbsp;total&nbsp;
                <span className="text-emerald-300">
                    {((status.amount_total_cents || 0) / 100).toFixed(2)}{" "}
                    {(status.currency || "usd").toUpperCase()}
                </span>
                . Your SRU balance has been updated. Real Stripe payouts will
                land in your firm&rsquo;s configured account post-launch — this
                test purchase is TEST MODE only.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link
                    to="/studio"
                    className="fsrs-cta-claim"
                    data-testid="paid-cta-studio"
                >
                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                    Open Studio
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
                <Link
                    to="/dashboard"
                    className="fsrs-cta-ghost text-lg tracking-wider py-3 px-5"
                    data-testid="paid-cta-dashboard"
                >
                    VIEW DASHBOARD
                </Link>
            </div>
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className="text-center" data-testid="payment-error-state">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-red-500/60 bg-red-500/[0.08] mb-8">
                <AlertTriangle className="w-7 h-7 text-red-400" strokeWidth={1.5} />
            </div>
            <div className="fsrs-overline mb-4 text-red-400">
                /&nbsp;PAYMENT&nbsp;UNAVAILABLE
            </div>
            <h1 className="fsrs-heading text-white text-3xl sm:text-4xl tracking-tight leading-tight">
                We hit a snag.
            </h1>
            <p className="mt-4 fsrs-mono text-slate-400 text-lg max-w-xl mx-auto">
                {message}
            </p>
            <div className="mt-8">
                <Link
                    to="/pricing"
                    className="fsrs-cta-ghost text-lg tracking-wider py-3 px-5"
                >
                    BACK&nbsp;TO&nbsp;PRICING
                </Link>
            </div>
        </div>
    );
}

function Card({ label, value, accent, testid }) {
    const toneClass = {
        emerald: "text-emerald-300",
        white: "text-white",
        red: "text-red-400",
    }[accent || "white"];
    return (
        <div
            className="bg-black p-6 lg:p-7 border-r-0 sm:[&:first-child]:border-r border-white/10 border-b sm:border-b-0 last:border-b-0"
            data-testid={testid}
        >
            <div className="fsrs-label text-slate-500 mb-2">{label}</div>
            <div
                className={`fsrs-heading ${toneClass} text-3xl tracking-tight tabular-nums`}
            >
                {value}
            </div>
        </div>
    );
}
