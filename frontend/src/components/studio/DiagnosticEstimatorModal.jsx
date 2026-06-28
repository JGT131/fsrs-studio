// V1.8 — Diagnostic Estimator Modal.
// Mandatory cheap-pass gate that runs BEFORE any real upload or simulated
// shadow preview. Calls /api/studio/diagnose, shows the estimated SRU/USD
// for the full analysis, and requires the user to click Confirm & Process
// before the parent component is permitted to proceed.
import { useEffect, useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Loader2,
    FlaskConical,
    AlertTriangle,
    CheckCircle2,
    Cpu,
    Gauge,
    DollarSign,
    X,
} from "lucide-react";
import { getClientId, getGuestCode } from "@/lib/clientId";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DiagnosticEstimatorModal({
    open,
    onOpenChange,
    file,
    onConfirmed,
}) {
    const [loading, setLoading] = useState(false);
    const [diag, setDiag] = useState(null);
    const [error, setError] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Run the diagnose call when the modal opens with a fresh file.
    useEffect(() => {
        if (!open || !file) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setConfirmed(false);
        setDiag(null);

        const run = async () => {
            try {
                const fd = new FormData();
                // Send only the file (privacy-first; bytes are not persisted).
                fd.append("file", file);
                // Coarse defaults — server fills the rest from MB.
                fd.append("occupancy", "oh1");
                fd.append("stories", "1");
                fd.append("doc_type", "pdf");
                const r = await axios.post(`${API}/studio/diagnose`, fd, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "X-Client-Id": getClientId(),
                        ...(getGuestCode() ? { "X-Guest-Code": getGuestCode() } : {}),
                    },
                });
                if (cancelled) return;
                setDiag(r.data);
            } catch (e) {
                if (cancelled) return;
                const det = e?.response?.data?.detail;
                setError(typeof det === "string" ? det : e.message || "Diagnostic failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [open, file]);

    const handleConfirm = async () => {
        if (!diag?.diagnose_id) return;
        setConfirming(true);
        try {
            await axios.post(
                `${API}/studio/diagnose/${diag.diagnose_id}/confirm`,
                null,
                { headers: { "X-Client-Id": getClientId() } },
            );
            setConfirmed(true);
            toast.success("Estimate confirmed · running full analysis");
            onConfirmed?.(diag);
            onOpenChange(false);
        } catch (e) {
            toast.error("Could not record confirmation. Try again.");
        } finally {
            setConfirming(false);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const sru = diag?.estimated_full_sru;
    const usd = diag?.estimated_full_cost_usd;
    const complexity = diag?.complexity;
    const complexityTone =
        complexity === "LOW"
            ? "text-emerald-300 border-emerald-500/60 bg-emerald-500/[0.08]"
            : complexity === "MEDIUM"
              ? "text-amber-300 border-amber-500/60 bg-amber-500/[0.08]"
              : complexity === "HIGH"
                ? "text-red-300 border-red-500/60 bg-red-500/[0.08]"
                : "text-slate-300 border-white/10";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-xl bg-black border border-white/10 text-slate-100 p-0 gap-0"
                data-testid="diagnostic-estimator-modal"
            >
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="fsrs-overline text-amber-300 flex items-center gap-2">
                            <FlaskConical className="w-3 h-3" strokeWidth={2} />
                            /&nbsp;DIAGNOSTIC&nbsp;ESTIMATOR&nbsp;//&nbsp;STEP&nbsp;00
                        </span>
                        <span
                            className="fsrs-label text-slate-500 hover:text-white cursor-pointer"
                            onClick={handleCancel}
                            data-testid="diagnostic-close"
                            role="button"
                            aria-label="Close diagnostic"
                        >
                            <X className="w-4 h-4" strokeWidth={2} />
                        </span>
                    </div>
                    <DialogTitle className="fsrs-heading text-white text-2xl tracking-tight">
                        Cost Estimate
                    </DialogTitle>
                    <DialogDescription className="fsrs-mono text-slate-400 text-base leading-relaxed pt-1">
                        Cheap-pass scan of{" "}
                        <span className="text-slate-200">{file?.name || "drawing"}</span>{" "}
                        — uses the Flash tier (~10× cheaper) to size the full
                        analysis. SIMULATED · NOT FOR ENGINEERING USE.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5">
                    {loading && (
                        <div
                            className="flex items-center gap-3 fsrs-mono text-slate-300 text-lg py-6"
                            data-testid="diagnostic-loading"
                        >
                            <Loader2
                                className="w-5 h-5 text-amber-300 animate-spin"
                                strokeWidth={1.5}
                            />
                            Scanning drawing density…
                        </div>
                    )}

                    {error && (
                        <div
                            className="flex items-start gap-3 border border-red-500/60 bg-red-500/[0.06] p-4"
                            data-testid="diagnostic-error"
                        >
                            <AlertTriangle
                                className="w-4 h-4 text-red-400 mt-[2px]"
                                strokeWidth={2}
                            />
                            <div className="fsrs-mono text-red-200 text-base leading-relaxed">
                                {error}
                            </div>
                        </div>
                    )}

                    {diag && !loading && !error && (
                        <>
                            {/* Headline cost line */}
                            <div
                                className="border border-white/10 bg-[#080808] p-5"
                                data-testid="estimate-line"
                            >
                                <div className="fsrs-label text-slate-500 mb-3 flex items-center gap-2">
                                    <Gauge className="w-3 h-3" strokeWidth={2} />
                                    ESTIMATED&nbsp;CONSUMPTION
                                </div>
                                <p
                                    className="fsrs-mono text-slate-200 text-lg leading-relaxed mb-3"
                                    data-testid="estimate-sentence"
                                >
                                    Estimated Consumption:{" "}
                                    <span
                                        className="fsrs-mono text-white text-lg font-bold tabular-nums tracking-tight px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm"
                                        data-testid="estimate-sru"
                                    >
                                        {Number(sru).toFixed(2)} SRUs
                                    </span>
                                    {" "}(
                                    <span
                                        className="fsrs-mono text-emerald-300 text-base font-bold tabular-nums tracking-tight"
                                        data-testid="estimate-usd"
                                    >
                                        ~${Number(usd).toFixed(2)}
                                    </span>
                                    ) &mdash; Continue?
                                </p>
                                <p className="fsrs-mono text-slate-400 text-lg leading-relaxed">
                                    Based on drawing complexity. Margin-Lock ×1.20
                                    above raw Gemini cost. No SRUs are deducted
                                    until you confirm.
                                </p>
                                <p
                                    className="mt-3 pt-3 border-t border-white/5 text-slate-400 text-lg italic leading-relaxed"
                                    data-testid="estimate-planning-disclaimer"
                                >
                                    Cost estimates are for planning only and may vary slightly.
                                </p>
                            </div>

                            {/* Complexity + diagnostic-pass cost */}
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className={`border p-4 ${complexityTone}`}
                                    data-testid="estimate-complexity"
                                >
                                    <div className="fsrs-label opacity-70 mb-1.5 flex items-center gap-1.5">
                                        <Cpu className="w-3 h-3" strokeWidth={2} />
                                        COMPLEXITY
                                    </div>
                                    <div
                                        className="fsrs-heading text-2xl tracking-tight"
                                        data-testid="estimate-complexity-value"
                                    >
                                        {complexity}
                                    </div>
                                    <p className="mt-2 fsrs-mono text-lg opacity-80 leading-snug">
                                        {diag.complexity_note}
                                    </p>
                                </div>
                                <div
                                    className="border border-white/10 bg-black p-4"
                                    data-testid="diagnostic-pass-cost"
                                >
                                    <div className="fsrs-label text-slate-500 mb-1.5 flex items-center gap-1.5">
                                        <DollarSign className="w-3 h-3" strokeWidth={2} />
                                        THIS&nbsp;DIAGNOSTIC
                                    </div>
                                    <div
                                        className="fsrs-heading text-emerald-300 text-2xl tracking-tight tabular-nums"
                                        data-testid="diagnostic-pass-sru"
                                    >
                                        {Number(diag.diagnostic?.sru ?? 0).toFixed(4)}
                                        <span className="ml-1 text-lg text-slate-400">
                                            SRU
                                        </span>
                                    </div>
                                    <p className="mt-2 fsrs-mono text-lg text-slate-500 leading-snug">
                                        Capped at {diag.diagnostic?.max_allowed_sru} SRU
                                        · ~${Number(diag.diagnostic?.cost_usd ?? 0).toFixed(4)}
                                    </p>
                                </div>
                            </div>

                            {/* File metadata strip */}
                            <div
                                className="border border-white/10 bg-black p-4 grid grid-cols-3 gap-3"
                                data-testid="diagnostic-meta"
                            >
                                <Meta k="FILE" v={diag.filename} />
                                <Meta k="SIZE" v={`${diag.file_mb} MB`} />
                                <Meta k="TYPE" v={diag.ext} />
                            </div>

                            <p className="fsrs-mono text-amber-300/80 text-lg leading-relaxed flex items-start gap-1.5">
                                <FlaskConical
                                    className="w-3 h-3 mt-[2px] shrink-0"
                                    strokeWidth={2}
                                />
                                SIMULATED preview. All outputs require PE review,
                                modification, and stamping before any submission
                                or construction use.
                            </p>
                        </>
                    )}
                </div>

                {/* Footer CTAs */}
                <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3 border-t border-white/10 bg-black">
                    <button
                        onClick={handleCancel}
                        className="fsrs-cta-ghost text-lg tracking-wider py-2.5 px-4"
                        data-testid="diagnostic-cancel-button"
                        disabled={confirming}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!diag || loading || !!error || confirming || confirmed}
                        className="fsrs-cta text-lg tracking-wider py-2.5 px-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 !bg-red-500 hover:!bg-red-400 !text-white shadow-[0_0_24px_-6px_rgba(239,68,68,0.7)]"
                        data-testid="diagnostic-confirm-button"
                    >
                        {confirming ? (
                            <Loader2
                                className="w-3.5 h-3.5 animate-spin"
                                strokeWidth={2}
                            />
                        ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                        )}
                        {confirmed
                            ? "CONFIRMED"
                            : "CONFIRM & INITIATE FULL ANALYSIS"}
                        {diag && !confirmed && (
                            <span className="tabular-nums opacity-80">
                                — {Number(sru).toFixed(2)} SRUs
                            </span>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Meta({ k, v }) {
    return (
        <div>
            <div className="fsrs-label text-slate-500 mb-1">{k}</div>
            <div className="fsrs-mono text-slate-200 text-base truncate">{v}</div>
        </div>
    );
}
