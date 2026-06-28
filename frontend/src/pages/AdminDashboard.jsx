// V1.8 — ADMIN PREVIEW Dashboard.
// Restricted route — must pass X-Admin-Key. Default demo key
// "FSRS-ADMIN-PREVIEW" is filled into the auth field for quick review.
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    DollarSign,
    Cpu,
    TrendingUp,
    ShieldCheck,
    ShieldAlert,
    Loader2,
    Activity,
    Banknote,
    Lock,
    KeyRound,
    Receipt,
} from "lucide-react";
import Logo from "@/components/founding/Logo";
import Footer from "@/components/founding/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ADMIN_KEY_STORAGE = "fsrs_admin_key";
const DEFAULT_DEMO_KEY = "FSRS-ADMIN-PREVIEW";

const fmtUsd = (n, digits = 2) => {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    if (Math.abs(v) >= 1000) {
        return `$${v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
    }
    return `$${v.toFixed(digits)}`;
};
const fmtUsdMicro = (n) => {
    if (n == null) return "—";
    const v = Number(n);
    if (v === 0) return "$0.00";
    if (Math.abs(v) < 0.01) return `$${v.toFixed(6)}`;
    return fmtUsd(v);
};
const fmtTime = (iso) => {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    } catch {
        return iso;
    }
};

export default function AdminDashboard() {
    const [adminKey, setAdminKey] = useState(
        () =>
            (typeof window !== "undefined" && localStorage.getItem(ADMIN_KEY_STORAGE)) ||
            DEFAULT_DEMO_KEY,
    );
    const [authed, setAuthed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [subscribers, setSubscribers] = useState([]);

    const headers = useMemo(
        () => ({ "X-Admin-Key": (adminKey || "").trim() }),
        [adminKey],
    );

    const fetchAll = async () => {
        if (!(adminKey || "").trim()) {
            setError("Admin key is required.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [dash, tx, subs] = await Promise.all([
                axios.get(`${API}/studio/admin/dashboard`, { headers }),
                axios.get(`${API}/studio/admin/transactions?limit=50`, { headers }),
                axios.get(`${API}/studio/admin/subscribers?limit=100`, { headers }),
            ]);
            setDashboard(dash.data);
            setTransactions(tx.data.rows || []);
            setSubscribers(subs.data.rows || []);
            setAuthed(true);
            localStorage.setItem(ADMIN_KEY_STORAGE, (adminKey || "").trim());
        } catch (e) {
            const detail = e?.response?.data?.detail;
            setError(
                typeof detail === "object" ? detail.message : (detail || e.message),
            );
            setAuthed(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminKey) fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main
            className="min-h-screen bg-black text-slate-200"
            data-testid="admin-dashboard-page"
        >
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-white/10 bg-black/85 backdrop-blur">
                <div className="mx-auto max-w-[1500px] px-5 lg:px-10 h-16 flex items-center justify-between gap-6">
                    <Link to="/" className="shrink-0">
                        <Logo size={28} variant="inline" showTagline={false} />
                    </Link>
                    <div className="hidden md:flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 fsrs-mono text-lg tracking-wider text-amber-300 border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 font-bold uppercase">
                            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                            ADMIN&nbsp;PREVIEW&nbsp;·&nbsp;RESTRICTED
                        </span>
                        <span className="fsrs-mono text-lg tracking-wider text-slate-500">
                            All&nbsp;data&nbsp;MOCKED
                        </span>
                    </div>
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="fsrs-cta-ghost text-lg tracking-wider py-2 px-3 disabled:opacity-60"
                        data-testid="dashboard-refresh-button"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                                REFRESHING
                            </>
                        ) : (
                            <>REFRESH&nbsp;DATA</>
                        )}
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-[1500px] px-5 lg:px-10 py-10 lg:py-14">
                {/* Title */}
                <div className="mb-10">
                    <div className="fsrs-overline mb-3 flex items-center gap-3 text-amber-300">
                        <span className="fsrs-dot bg-amber-400" />
                        ADMIN&nbsp;PREVIEW&nbsp;//&nbsp;REVENUE&nbsp;&amp;&nbsp;PAYOUTS
                    </div>
                    <h1
                        className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl leading-[0.95]"
                        data-testid="dashboard-title"
                    >
                        OPERATING&nbsp;CONSOLE.
                        <br />
                        <span className="text-red-500">MARGIN-LOCK</span> AT A GLANCE.
                    </h1>
                    <p className="mt-4 max-w-3xl text-slate-400 text-lg leading-relaxed">
                        Internal dashboard for FSRS operators. Aggregates the{" "}
                        <span className="text-white">usage_ledger</span> + mocked
                        Stripe metadata into a live revenue / cost / net-profit
                        snapshot. All numbers below are MOCKED until real Stripe +
                        Gemini billing are wired.
                    </p>
                </div>

                {/* Admin key gate */}
                <AdminKeyGate
                    adminKey={adminKey}
                    setAdminKey={setAdminKey}
                    onSubmit={fetchAll}
                    loading={loading}
                    error={error}
                    authed={authed}
                />

                {authed && dashboard && (
                    <>
                        <KpiGrid kpi={dashboard.kpi} />
                        <div className="mt-8 grid lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
                            <PayoutCard stripe={dashboard.stripe} />
                            <RatesCard rates={dashboard.rates} />
                            <SummaryCard kpi={dashboard.kpi} generated={dashboard.generated_at} />
                        </div>
                        <SubscriberAudit rows={subscribers} />
                        <TransactionFeed rows={transactions} />
                    </>
                )}
            </div>

            <Footer />
        </main>
    );
}

// ----- Components -----

function AdminKeyGate({ adminKey, setAdminKey, onSubmit, loading, error, authed }) {
    return (
        <div
            className="mb-10 border border-white/10 bg-black/70 px-6 lg:px-8 py-5"
            data-testid="admin-key-gate"
        >
            <div className="flex flex-wrap items-end gap-5">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 border flex items-center justify-center ${authed ? "border-emerald-400/60 bg-emerald-400/10" : "border-amber-400/50 bg-amber-400/10"}`}>
                        {authed ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-300" strokeWidth={1.5} />
                        ) : (
                            <KeyRound className="w-5 h-5 text-amber-300" strokeWidth={1.5} />
                        )}
                    </div>
                    <div>
                        <div className="fsrs-overline text-slate-400 mb-1">
                            ADMIN&nbsp;KEY
                        </div>
                        <div className="fsrs-mono text-lg text-slate-500">
                            Demo key:{" "}
                            <span className="text-emerald-300">
                                FSRS-ADMIN-PREVIEW
                            </span>
                        </div>
                    </div>
                </div>
                <label className="flex-1 min-w-[260px]">
                    <input
                        type="text"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="X-Admin-Key"
                        className="fsrs-input w-full"
                        data-testid="admin-key-input"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSubmit();
                        }}
                    />
                </label>
                <button
                    onClick={onSubmit}
                    disabled={loading}
                    className="fsrs-cta justify-center disabled:opacity-50"
                    data-testid="admin-key-submit"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            Unlocking
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" strokeWidth={2} />
                            Unlock&nbsp;Dashboard
                        </>
                    )}
                </button>
            </div>
            {error && (
                <p
                    className="mt-3 fsrs-mono text-[12px] text-red-400 leading-relaxed"
                    data-testid="admin-key-error"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

function KpiGrid({ kpi }) {
    const margin = kpi?.gross_margin_pct;
    const isLocked = !!kpi?.margin_locked;

    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-0 border border-white/10"
            data-testid="kpi-grid"
        >
            <KpiCard
                Icon={DollarSign}
                label="GROSS REVENUE"
                value={fmtUsd(kpi?.gross_revenue_usd)}
                sub={`${kpi?.paying_customers ?? 0} paying customers (mocked)`}
                tone="white"
                testid="kpi-gross-revenue"
                borderRight
            />
            <KpiCard
                Icon={Cpu}
                label="AI COST (RAW GOOGLE API)"
                value={fmtUsdMicro(kpi?.ai_cost_usd)}
                sub={`${kpi?.exports_processed ?? 0} exports · ${kpi?.total_sru_charged?.toFixed(2) ?? "0.00"} SRUs charged`}
                tone="amber"
                testid="kpi-ai-cost"
                borderRight
            />
            <KpiCard
                Icon={TrendingUp}
                label="NET PROFIT"
                value={fmtUsd(kpi?.net_profit_usd)}
                sub={
                    margin == null
                        ? "No revenue recorded yet"
                        : `Margin ${margin}% · after ${fmtUsd(kpi?.estimated_fees_usd)} fees`
                }
                tone={(kpi?.net_profit_usd ?? 0) > 0 ? "emerald" : "red"}
                testid="kpi-net-profit"
                borderRight
            />
            <KpiCard
                Icon={isLocked ? ShieldCheck : ShieldAlert}
                label="MARGIN STATUS"
                value={isLocked ? "MARGIN LOCKED" : "AT RISK"}
                sub={
                    margin == null
                        ? `Multiplier ×${kpi?.margin_lock_multiplier ?? 1.2} ready`
                        : `${margin}% gross margin · ×${kpi?.margin_lock_multiplier ?? 1.2} lock`
                }
                tone={isLocked ? "emerald" : "amber"}
                testid="kpi-margin-status"
                pill={
                    <span
                        className={`fsrs-mono text-lg tracking-wider font-bold uppercase border px-2 py-1 ${
                            isLocked
                                ? "text-emerald-200 bg-emerald-400/10 border-emerald-400/50"
                                : "text-amber-200 bg-amber-400/10 border-amber-400/50"
                        }`}
                        data-testid="margin-status-pill"
                    >
                        {isLocked
                            ? `MARGIN LOCKED (×${kpi?.margin_lock_multiplier ?? 1.2})`
                            : `BELOW 20% — REVIEW`}
                    </span>
                }
            />
        </div>
    );
}

function KpiCard({ Icon, label, value, sub, tone = "white", testid, borderRight, pill }) {
    const toneClasses = {
        white: "text-white",
        emerald: "text-emerald-300",
        amber: "text-amber-300",
        red: "text-red-400",
    }[tone];
    return (
        <div
            className={`relative bg-black p-6 lg:p-7 flex flex-col gap-3 ${borderRight ? "xl:border-r border-white/10" : ""} border-t md:border-t-0 first:border-t-0 md:[&:nth-child(3)]:border-t md:[&:nth-child(4)]:border-t xl:border-t-0`}
            data-testid={testid}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="w-10 h-10 border border-white/15 bg-black flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${toneClasses}`} strokeWidth={1.5} />
                </div>
                <span className="fsrs-label text-slate-600">{label}</span>
            </div>
            <div className={`fsrs-heading text-3xl xl:text-4xl tracking-tight leading-none ${toneClasses}`}>
                {value}
            </div>
            <div className="fsrs-mono text-lg text-slate-500 leading-relaxed">
                {sub}
            </div>
            {pill && <div className="pt-1">{pill}</div>}
        </div>
    );
}

function PayoutCard({ stripe }) {
    return (
        <div
            className="bg-black p-6 lg:p-7 flex flex-col gap-3"
            data-testid="payout-card"
        >
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 border border-amber-400/50 bg-amber-400/10 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-amber-300" strokeWidth={1.5} />
                </div>
                <span
                    className="fsrs-mono text-lg tracking-wider font-bold uppercase text-amber-200 border border-amber-400/50 bg-amber-400/10 px-2 py-1"
                    data-testid="stripe-status-pill"
                >
                    STRIPE&nbsp;STATUS:&nbsp;{stripe?.mode || "TEST MODE"}
                </span>
            </div>
            <div>
                <div className="fsrs-label text-slate-500 mb-1">NEXT&nbsp;PAYOUT</div>
                <div
                    className="fsrs-heading text-white text-3xl tracking-tight leading-none"
                    data-testid="next-payout-amount"
                >
                    {fmtUsd(stripe?.next_payout_amount_usd)}
                </div>
                <div
                    className="mt-2 fsrs-mono text-lg text-slate-500"
                    data-testid="next-payout-date"
                >
                    Scheduled&nbsp;{fmtTime(stripe?.next_payout_at)}&nbsp;·&nbsp;{stripe?.currency || "USD"}
                </div>
            </div>
            <div className="mt-1 fsrs-mono text-lg text-slate-600 leading-relaxed">
                Processing fee&nbsp;{(stripe?.fee_rate_pct ?? 2.9).toFixed(1)}%
                ·{" "}
                <span className="text-amber-400">Placeholder</span> — real Stripe
                payouts wire up in the production cut-over.
            </div>
        </div>
    );
}

function RatesCard({ rates }) {
    return (
        <div className="bg-black p-6 lg:p-7 flex flex-col gap-3" data-testid="rates-card">
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 border border-emerald-400/50 bg-emerald-400/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-300" strokeWidth={1.5} />
                </div>
                <span className="fsrs-label text-slate-600">MARGIN&nbsp;LOCK&nbsp;CONFIG</span>
            </div>
            <ul className="fsrs-mono text-[12px] text-slate-300 space-y-1.5">
                <Row k="Gemini input / 1K" v={fmtUsdMicro(rates?.gemini_input_rate_usd_per_1k)} />
                <Row k="Gemini output / 1K" v={fmtUsdMicro(rates?.gemini_output_rate_usd_per_1k)} />
                <Row k="Margin-Lock ×" v={`${rates?.margin_lock_multiplier ?? 1.2}`} />
                <Row k="SRU retail" v={fmtUsd(rates?.sru_usd_value)} />
            </ul>
            <div className="fsrs-mono text-lg text-slate-600 leading-relaxed">
                Configurable via env: {(rates?.configurable_via_env || []).join(", ")}
            </div>
        </div>
    );
}

function SummaryCard({ kpi, generated }) {
    return (
        <div className="bg-black p-6 lg:p-7 flex flex-col gap-3" data-testid="summary-card">
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 border border-white/20 bg-black flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
                </div>
                <span className="fsrs-label text-slate-600">RUN&nbsp;TOTALS</span>
            </div>
            <ul className="fsrs-mono text-[12px] text-slate-300 space-y-1.5">
                <Row k="Total SRUs charged" v={(kpi?.total_sru_charged ?? 0).toFixed(2)} />
                <Row k="Marked-up cost" v={fmtUsd(kpi?.total_marked_up_usd)} />
                <Row k="Estimated Stripe fees" v={fmtUsd(kpi?.estimated_fees_usd)} />
                <Row k="Exports processed" v={(kpi?.exports_processed ?? 0).toString()} />
            </ul>
            <div className="fsrs-mono text-lg text-slate-600 leading-relaxed">
                Generated&nbsp;{fmtTime(generated)}&nbsp;UTC.
            </div>
        </div>
    );
}

function Row({ k, v }) {
    return (
        <li className="flex items-baseline justify-between gap-3">
            <span className="text-slate-500">{k}</span>
            <span className="text-white tabular-nums">{v}</span>
        </li>
    );
}

function SubscriberAudit({ rows }) {
    return (
        <section
            className="mt-10 border border-white/10"
            data-testid="subscriber-audit"
        >
            <div className="px-5 lg:px-7 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="fsrs-overline text-amber-300 flex items-center gap-3">
                    <span className="fsrs-dot bg-amber-400" />
                    SUBSCRIBER&nbsp;AUDIT&nbsp;//&nbsp;PAID&nbsp;PROFILES
                </div>
                <span className="fsrs-mono text-lg text-slate-500">
                    {rows.length}&nbsp;paying&nbsp;profile{rows.length === 1 ? "" : "s"}&nbsp;·&nbsp;Stripe TEST MODE
                </span>
            </div>
            {rows.length === 0 ? (
                <div
                    className="px-5 lg:px-7 py-10 text-center fsrs-mono text-[12px] text-slate-500"
                    data-testid="subscriber-audit-empty"
                >
                    No paying profiles yet. Once Rod / Joe (or any tester) completes the Stripe TEST MODE checkout, they will appear here in real time.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left" data-testid="subscriber-audit-table">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <Th>SUBSCRIBER</Th>
                                <Th>PLAN</Th>
                                <Th className="text-right">SRUs GRANTED</Th>
                                <Th className="text-right">SRUs USED</Th>
                                <Th className="text-right">SRUs REMAINING</Th>
                                <Th>ACTIVATED</Th>
                                <Th>LAST ACTIVITY</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr
                                    key={r.client_id || i}
                                    className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.015]"} hover:bg-white/[0.04] transition-colors`}
                                    data-testid={`subscriber-row-${i}`}
                                >
                                    <Td>
                                        <span className="text-white">{r.label}</span>
                                        <div className="fsrs-mono text-lg text-slate-500">{r.email || r.client_id?.slice(0, 18)}…</div>
                                    </Td>
                                    <Td className="text-emerald-300">{r.tier_label || r.plan || "—"}</Td>
                                    <Td className="text-white text-right tabular-nums">
                                        {r.sru_total_granted}
                                        <div className="fsrs-mono text-lg text-slate-500">
                                            {r.sru_included} incl + {r.sru_purchased} paid
                                        </div>
                                    </Td>
                                    <Td className="text-amber-300 text-right tabular-nums">
                                        {(r.sru_used ?? 0).toFixed(2)}
                                    </Td>
                                    <Td className="text-emerald-300 text-right tabular-nums">
                                        {(r.sru_remaining ?? 0).toFixed(2)}
                                    </Td>
                                    <Td className="text-slate-400">{fmtTime(r.card_added_at)}</Td>
                                    <Td className="text-slate-400">
                                        {r.last_activity_at ? fmtTime(r.last_activity_at) : "—"}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="px-5 lg:px-7 py-3 border-t border-white/10 fsrs-mono text-lg text-slate-600">
                MOCKED · Stripe checkout fires <span className="text-emerald-300">$249 → +15 SRUs</span> for Founding Beta · grants propagate via /api/payments webhook + status polling.
            </div>
        </section>
    );
}

function TransactionFeed({ rows }) {
    return (
        <section
            className="mt-10 border border-white/10"
            data-testid="transaction-feed"
        >
            <div className="px-5 lg:px-7 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="fsrs-overline text-emerald-300 flex items-center gap-3">
                    <span className="fsrs-dot" />
                    USAGE&nbsp;LEDGER&nbsp;//&nbsp;TRANSACTION&nbsp;FEED
                </div>
                <span className="fsrs-mono text-lg text-slate-500">
                    {rows.length}&nbsp;recent&nbsp;event{rows.length === 1 ? "" : "s"}
                </span>
            </div>
            {rows.length === 0 ? (
                <div className="px-5 lg:px-7 py-10 text-center fsrs-mono text-[12px] text-slate-500">
                    No exports recorded yet. Run an export from{" "}
                    <Link to="/studio" className="text-emerald-300 underline">
                        /studio
                    </Link>{" "}
                    to populate this feed.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left" data-testid="transaction-table">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <Th>WHEN</Th>
                                <Th>PROJECT</Th>
                                <Th>OPERATION</Th>
                                <Th>PLAN</Th>
                                <Th className="text-right">RAW COST</Th>
                                <Th className="text-right">CUSTOMER DEDUCTION</Th>
                                <Th className="text-right">SRU</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr
                                    key={r.id || i}
                                    className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.015]"} hover:bg-white/[0.04] transition-colors`}
                                    data-testid={`transaction-row-${i}`}
                                >
                                    <Td className="text-slate-400">{fmtTime(r.at)}</Td>
                                    <Td>
                                        <span className="text-white">{r.project_name || "—"}</span>
                                        {r.is_simulated && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-amber-300 text-lg uppercase tracking-wider">
                                                <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                                                SIM
                                            </span>
                                        )}
                                    </Td>
                                    <Td className="text-slate-300">{r.operation || "—"}</Td>
                                    <Td className="text-slate-300">{r.plan || "—"}</Td>
                                    <Td className="text-amber-300 text-right">
                                        {fmtUsdMicro(r.raw_cost_usd)}
                                    </Td>
                                    <Td className="text-emerald-300 text-right">
                                        {fmtUsd(r.marked_up_cost_usd)}
                                    </Td>
                                    <Td className="text-white text-right tabular-nums">
                                        {(r.sru_deducted ?? 0).toFixed(4)}
                                        {r.margin_protected && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-emerald-300 text-lg uppercase tracking-wider">
                                                <ShieldCheck className="w-3 h-3" strokeWidth={2} />
                                                LOCK
                                            </span>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="px-5 lg:px-7 py-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <span className="fsrs-mono text-lg text-slate-600">
                    Read-only · margin-lock protects every retail SRU
                </span>
                <Link
                    to="/studio"
                    className="fsrs-cta-ghost text-lg tracking-wider py-1.5 px-3"
                >
                    GO&nbsp;TO&nbsp;STUDIO
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                </Link>
            </div>
        </section>
    );
}

function Th({ children, className = "" }) {
    return (
        <th
            className={`px-4 py-2.5 fsrs-label text-slate-500 font-normal whitespace-nowrap ${className}`}
        >
            {children}
        </th>
    );
}

function Td({ children, className = "" }) {
    return (
        <td
            className={`px-4 py-3 fsrs-mono text-[12px] whitespace-nowrap align-middle ${className}`}
        >
            {children}
        </td>
    );
}
