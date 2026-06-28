// SRU Estimator — cost-transparency panel in the Studio.
//
// Renders inline (above the export CTA) and shows:
//   - Estimated Standard Retrofit Units (SRUs) for the current project
//   - User's tier, included allowance, used this month
//   - Any projected overage cost
//   - "Proceed?" framing so the engineer sees the cost BEFORE running.
//
// Calls POST /api/studio/sru/estimate (heuristic; not a billing quote).

import { useEffect, useState } from "react";
import axios from "axios";
import { Calculator, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function fmtUsd(n) {
    if (n == null) return "—";
    if (n === 0) return "$0";
    return `$${Number(n).toFixed(2)}`;
}

export default function SruEstimator({
    project,
    classification,
    onProceed,
    proceedLabel = "Proceed",
    "data-testid": testId = "sru-estimator",
}) {
    const [loading, setLoading] = useState(false);
    const [est, setEst] = useState(null);
    const [err, setErr] = useState(null);

    const sqft = classification?.design_area_sqft || classification?.area_sqft || 1500;
    const hazard = (classification?.hazard_key
        || (classification?.occupancy_hazard || "").toString().toLowerCase().replace(/[, ]+/g, "_")
        || "ordinary_group_1"
    );

    useEffect(() => {
        if (!project?.id) return;
        let cancelled = false;
        setLoading(true);
        setErr(null);
        const form = new FormData();
        form.append("area_sqft", sqft);
        form.append("hazard", hazard);
        form.append("complexity", "standard");
        axios
            .post(`${API}/studio/sru/estimate`, form)
            .then((r) => {
                if (!cancelled) setEst(r.data);
            })
            .catch((e) => {
                if (!cancelled) setErr(e?.message || "Estimate failed");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [project?.id, sqft, hazard]);

    if (!project?.id) return null;

    return (
        <div
            className="relative border border-white/10 bg-black/40 px-5 py-4 mb-3"
            data-testid={testId}
        >
            <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-emerald-400" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-emerald-400" />
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-emerald-400" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-emerald-400" />

            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 border border-emerald-400/40 flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4 text-emerald-300" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                        <div className="fsrs-overline text-emerald-300 mb-1">
                            ESTIMATED&nbsp;USAGE&nbsp;//&nbsp;SRU
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-lg">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                                Calculating…
                            </div>
                        ) : err ? (
                            <div className="text-amber-300 text-base font-mono">
                                Estimate unavailable.
                            </div>
                        ) : est ? (
                            <>
                                <div
                                    className="text-white text-lg leading-snug"
                                    data-testid="sru-estimate-line"
                                >
                                    <span className="font-bold">
                                        {est.estimated_sru} Standard{" "}
                                        {est.estimated_sru === 1 ? "Unit" : "Units"}
                                    </span>{" "}
                                    <span className="text-slate-400">
                                        ({fmtUsd(est.overage_cost_usd)} overage this run)
                                    </span>
                                    .{" "}
                                    <span className="text-emerald-300">Proceed?</span>
                                </div>
                                <div className="mt-1 fsrs-mono text-lg text-slate-500">
                                    {est.tier_label} ·{" "}
                                    {est.included_per_month == null
                                        ? "unlimited"
                                        : `${est.used_this_month}/${est.included_per_month} SRU used this month`}
                                    {est.overage_rate_usd != null && est.included_per_month !== null && (
                                        <>
                                            {" "}
                                            · overage&nbsp;
                                            {fmtUsd(est.overage_rate_usd)}/SRU
                                        </>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {onProceed && (
                    <button
                        onClick={onProceed}
                        disabled={loading}
                        className="fsrs-cta-ghost border-emerald-400/50 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400 shrink-0 disabled:opacity-60"
                        data-testid="sru-estimator-proceed"
                    >
                        {proceedLabel}
                    </button>
                )}
            </div>

            <p className="mt-2 text-lg font-mono text-slate-600 leading-relaxed">
                Heuristic estimate only · 1 SRU ≈ ordinary-hazard zone ≤5,000 sf
                · no hard limits, you only pay the per-SRU rate above your
                base allowance.
            </p>
        </div>
    );
}
