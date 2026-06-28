import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import {
    AlertTriangle,
    FileText,
    Boxes,
    Building2,
    Loader2,
    Download,
    Calculator,
    ShieldCheck,
    ArrowRight,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const REQUIRED_ACK_TEXT =
    "I understand FSRS provides preliminary analysis only. I will not " +
    "submit any FSRS outputs as final deliverables without full PE " +
    "review, modification, and stamping.";

const DOC_TYPES = [
    {
        key: "pdf",
        label: "PDF REPORT",
        sub: "Summary · hydraulics · plan view",
        icon: FileText,
    },
    {
        key: "dxf",
        label: "DXF DRAWING",
        sub: "2D CAD plan with watermark",
        icon: Boxes,
    },
    {
        key: "ifc",
        label: "IFC MODEL",
        sub: "BIM model with disclaimer",
        icon: Building2,
    },
];

const fmtUsd = (n) => (n == null ? "—" : `$${Number(n).toFixed(2)}`);
const fmtSru = (n) => (n == null ? "—" : Number(n).toFixed(2));

export default function ExportDialog({ open, onOpenChange, project, classification, diagnoseId }) {
    const [docType, setDocType] = useState("pdf");
    const [ack, setAck] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [license, setLicense] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // V1.7 — Pre-export estimator + Confirm & Process gate
    const [estimate, setEstimate] = useState(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [estimateError, setEstimateError] = useState(null);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (!open) {
            setAck(false);
            setSubmitting(false);
            setConfirmed(false);
            setEstimate(null);
            setEstimateError(null);
        }
    }, [open]);

    // Re-estimate whenever the doc type or project context changes
    useEffect(() => {
        if (!open || !project?.id) return;
        let cancelled = false;
        const sqft =
            classification?.design_area_sqft ||
            classification?.area_sqft ||
            project?.classification?.design_area_sqft ||
            1500;
        const hazard =
            classification?.hazard_key ||
            project?.classification?.hazard_key ||
            "ordinary_group_1";

        setEstimateLoading(true);
        setEstimateError(null);
        setConfirmed(false); // require fresh confirmation after any estimate change

        const form = new FormData();
        form.append("area_sqft", sqft);
        form.append("hazard", hazard);
        form.append("complexity", "standard");
        form.append("doc_type", docType);

        axios
            .post(`${API}/studio/usage/estimate`, form)
            .then((r) => {
                if (!cancelled) setEstimate(r.data);
            })
            .catch((e) => {
                if (!cancelled)
                    setEstimateError(
                        e?.response?.data?.detail || e.message || "Estimate failed",
                    );
            })
            .finally(() => {
                if (!cancelled) setEstimateLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, project?.id, classification, docType]);

    const canSubmit =
        ack && confirmed && name.trim() && email.trim() && !submitting && project?.id;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!confirmed) {
            toast.error("Review and confirm the SRU estimate before exporting.");
            return;
        }
        if (!ack) {
            toast.error("PE-stamp acknowledgment is required.");
            return;
        }
        if (!project?.id) {
            toast.error("Upload a project before exporting.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/studio/exports`, {
                project_id: project.id,
                project_name: project.name,
                doc_type: docType,
                acknowledged: true,
                acknowledgment_text: REQUIRED_ACK_TEXT,
                name: name.trim(),
                email: email.trim(),
                license: license.trim() || null,
                mode: project.simulated === false ? "real" : "simulated",
                // V1.8 refinement — link this export back to its mandatory diagnostic
                diagnose_id: diagnoseId || project?.diagnose_id || null,
            });
            const url = `${process.env.REACT_APP_BACKEND_URL}${res.data.download_url}`;
            const fileRes = await axios.get(url, { responseType: "blob" });
            const blob = new Blob([fileRes.data], {
                type:
                    docType === "pdf"
                        ? "application/pdf"
                        : docType === "dxf"
                          ? "application/dxf"
                          : "application/x-step",
            });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `FSRS_DEMO_${(project.name || "untitled").replace(/\s+/g, "_")}.${docType}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            const ml = res.data?.margin_lock;
            const sru = ml?.sru_deducted ?? estimate?.estimated_sru;
            const usd = ml?.marked_up_cost_usd ?? estimate?.estimated_cost_usd;
            toast.success(
                `${docType.toUpperCase()} ready · ${fmtSru(sru)} SRUs (${fmtUsd(usd)}) deducted · ack ${res.data.acknowledgment_id.slice(0, 8)}`,
            );
            onOpenChange(false);
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message;
            toast.error(`Export failed: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const estimatedSru = estimate?.estimated_sru;
    const estimatedUsd = estimate?.estimated_cost_usd;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="!rounded-none !p-0 !max-w-2xl !border-white/15 !bg-black"
                data-testid="export-dialog"
            >
                <div className="relative">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500" />

                    <div className="px-7 pt-7 pb-5 border-b border-white/10 bg-amber-500/5">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle
                                className="w-5 h-5 text-amber-400"
                                strokeWidth={2}
                            />
                            <DialogTitle asChild>
                                <h3 className="fsrs-heading text-white text-xl tracking-tight">
                                    DEMO EXPORT — ACKNOWLEDGMENT REQUIRED
                                </h3>
                            </DialogTitle>
                        </div>
                        <DialogDescription asChild>
                            <p className="fsrs-mono text-amber-200 text-base leading-relaxed">
                                Every export is watermarked&nbsp;
                                <span className="font-bold">
                                    &ldquo;DEMO — NOT FOR ENGINEERING USE&rdquo;
                                </span>
                                . The PE engineering disclaimer is embedded on
                                page 1 of every file.
                            </p>
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="px-7 py-6">
                        {/* Deliverable selector */}
                        <div className="fsrs-label text-slate-400 mb-3">
                            DELIVERABLE
                        </div>
                        <div
                            className="grid grid-cols-3 gap-2 mb-5"
                            data-testid="export-type-selector"
                        >
                            {DOC_TYPES.map((d) => {
                                const active = docType === d.key;
                                return (
                                    <button
                                        type="button"
                                        key={d.key}
                                        onClick={() => setDocType(d.key)}
                                        className={`text-left p-3 border transition-colors ${
                                            active
                                                ? "border-red-500 bg-red-500/10"
                                                : "border-white/15 hover:border-white/30"
                                        }`}
                                        data-testid={`export-type-${d.key}`}
                                    >
                                        <d.icon
                                            className={`w-4 h-4 mb-2 ${active ? "text-red-500" : "text-slate-400"}`}
                                            strokeWidth={1.5}
                                        />
                                        <div className="fsrs-mono text-white text-base font-bold">
                                            {d.label}
                                        </div>
                                        <div className="fsrs-label text-slate-500 mt-1 leading-snug">
                                            {d.sub}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* V1.7 — Pre-Export Estimator + Confirm & Process gate */}
                        <div
                            className="relative border-2 border-emerald-400/40 bg-emerald-400/[0.05] px-5 py-4 mb-5"
                            data-testid="pre-export-estimator"
                        >
                            <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-emerald-400" />
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-emerald-400" />
                            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-emerald-400" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-emerald-400" />

                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-9 h-9 border border-emerald-400/50 flex items-center justify-center shrink-0">
                                        <Calculator
                                            className="w-4 h-4 text-emerald-300"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="fsrs-overline text-emerald-300 mb-1.5">
                                            PRE-EXPORT&nbsp;ESTIMATE&nbsp;//&nbsp;MARGIN-LOCK
                                        </div>
                                        {estimateLoading ? (
                                            <div className="flex items-center gap-2 text-slate-300 text-lg">
                                                <Loader2
                                                    className="w-3.5 h-3.5 animate-spin"
                                                    strokeWidth={2}
                                                />
                                                Calculating consumption…
                                            </div>
                                        ) : estimateError ? (
                                            <div className="text-amber-300 text-base font-mono">
                                                Estimate unavailable — please retry.
                                            </div>
                                        ) : estimate ? (
                                            <div data-testid="estimate-line">
                                                <div className="text-white text-base font-semibold leading-tight">
                                                    Estimated Consumption:&nbsp;
                                                    <span
                                                        className="text-emerald-300 font-bold"
                                                        data-testid="estimate-sru"
                                                    >
                                                        {fmtSru(estimatedSru)}&nbsp;SRUs
                                                    </span>
                                                    &nbsp;
                                                    <span
                                                        className="text-slate-300"
                                                        data-testid="estimate-usd"
                                                    >
                                                        (~{fmtUsd(estimatedUsd)})
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 fsrs-mono text-lg text-slate-400 leading-relaxed">
                                                    Margin-Lock:&nbsp;
                                                    <span className="text-emerald-300">
                                                        ×{estimate.margin_lock_multiplier}
                                                    </span>
                                                    &nbsp;applied above raw Gemini cost
                                                    {" "}
                                                    (
                                                    <span data-testid="estimate-raw-usd">
                                                        {fmtUsd(estimate.raw_cost_usd)}
                                                    </span>
                                                    ). {estimate.tier_label}
                                                    {estimate.balance?.included_sru != null &&
                                                        !estimate.balance.unlimited && (
                                                            <>
                                                                {" · "}
                                                                <span className="text-emerald-300">
                                                                    {fmtSru(
                                                                        estimate.balance
                                                                            .sru_remaining,
                                                                    )}{" "}
                                                                    SRUs remaining
                                                                </span>
                                                            </>
                                                        )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <label
                                className="mt-4 flex items-start gap-3 cursor-pointer border-t border-emerald-400/20 pt-3"
                                data-testid="confirm-process-block"
                            >
                                <input
                                    type="checkbox"
                                    checked={confirmed}
                                    onChange={(e) => setConfirmed(e.target.checked)}
                                    disabled={!estimate || estimateLoading}
                                    className="mt-[3px] w-4 h-4 accent-emerald-400 cursor-pointer disabled:cursor-not-allowed"
                                    data-testid="confirm-process-checkbox"
                                />
                                <span className="fsrs-mono text-emerald-100 text-base font-bold leading-snug">
                                    Confirm &amp; Process —{" "}
                                    {fmtSru(estimatedSru)} SRUs ({fmtUsd(estimatedUsd)})
                                    will be deducted on success.
                                </span>
                            </label>
                        </div>

                        {/* Identity */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    NAME&nbsp;
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Jane Doe, P.E."
                                    className="fsrs-input"
                                    data-testid="export-name-input"
                                />
                            </label>
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    EMAIL&nbsp;
                                    <span className="text-red-500">*</span>
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="jane@firmname.com"
                                    className="fsrs-input"
                                    data-testid="export-email-input"
                                />
                            </label>
                        </div>
                        <label className="block mb-5">
                            <span className="fsrs-label text-slate-400 mb-2 block">
                                PE&nbsp;LICENSE&nbsp;# (OPTIONAL)
                            </span>
                            <input
                                type="text"
                                value={license}
                                onChange={(e) => setLicense(e.target.value)}
                                placeholder="State + Number"
                                className="fsrs-input"
                                data-testid="export-license-input"
                            />
                        </label>

                        {/* PE Acknowledgment */}
                        <div
                            className="border-2 border-amber-500 bg-amber-500/10 p-4 mb-5"
                            data-testid="ack-block"
                        >
                            <div className="fsrs-label text-amber-300 mb-2 font-bold">
                                REQUIRED&nbsp;PE&nbsp;ACKNOWLEDGMENT
                            </div>
                            <p className="fsrs-mono text-amber-100 text-base leading-relaxed mb-4">
                                {REQUIRED_ACK_TEXT}
                            </p>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ack}
                                    onChange={(e) => setAck(e.target.checked)}
                                    className="mt-[3px] w-4 h-4 accent-amber-500 cursor-pointer"
                                    data-testid="ack-checkbox"
                                />
                                <span className="fsrs-mono text-amber-200 text-base font-bold leading-snug">
                                    I acknowledge the above and confirm a
                                    licensed PE will review and stamp these
                                    deliverables before any use.
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <span className="fsrs-label text-slate-500 flex items-center gap-2">
                                {ack && confirmed ? (
                                    <span className="text-emerald-400 inline-flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                                        READY&nbsp;TO&nbsp;DEDUCT&nbsp;&amp;&nbsp;PROCESS
                                    </span>
                                ) : !confirmed ? (
                                    <span className="text-emerald-300">
                                        CONFIRM&nbsp;ESTIMATE&nbsp;TO&nbsp;CONTINUE
                                    </span>
                                ) : (
                                    <span className="text-amber-400">
                                        EXPORT&nbsp;LOCKED&nbsp;UNTIL&nbsp;PE&nbsp;ACK
                                    </span>
                                )}
                            </span>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="fsrs-cta disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                                data-testid="export-submit-button"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2
                                            className="w-4 h-4 animate-spin"
                                            strokeWidth={2}
                                        />
                                        Generating…
                                    </>
                                ) : (
                                    <>
                                        <Download
                                            className="w-4 h-4"
                                            strokeWidth={2}
                                        />
                                        Confirm&nbsp;&amp;&nbsp;Process —{" "}
                                        {estimate ? `${fmtSru(estimatedSru)} SRUs` : docType.toUpperCase()}
                                        <ArrowRight
                                            className="w-4 h-4"
                                            strokeWidth={2}
                                        />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
