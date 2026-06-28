import { useRef, useState } from "react";
import {
    Upload,
    FileText,
    CheckCircle2,
    Loader2,
    FlaskConical,
    Gauge,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ShadowPreviewDialog from "@/components/studio/ShadowPreviewDialog";
import DiagnosticEstimatorModal from "@/components/studio/DiagnosticEstimatorModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// V1.8 — Narrowed file-type allowlist (per Diagnostic Estimator spec).
const ALLOWED_EXTS = [".pdf", ".dwg", ".dxf", ".png", ".jpg", ".jpeg"];
const ACCEPT = ALLOWED_EXTS.join(",");
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function validateFile(file) {
    if (!file) return "No file selected.";
    if (file.size > MAX_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(1);
        return `File is ${mb} MB — exceeds the 50 MB limit.`;
    }
    const name = (file.name || "").toLowerCase();
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    if (!ALLOWED_EXTS.includes(ext)) {
        return `Unsupported file type ${ext || "(unknown)"}. Allowed: PDF · DWG · DXF · PNG · JPG.`;
    }
    return null;
}

export default function UploadPanel({ project, classification, onProjectCreated }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingDiagnoseId, setPendingDiagnoseId] = useState(null);
    const [diagOpen, setDiagOpen] = useState(false);
    const [diagResult, setDiagResult] = useState(null);
    const [shadowOpen, setShadowOpen] = useState(false);

    const pick = () => inputRef.current?.click();

    const onFile = (e) => {
        const file = e.target.files?.[0];
        if (inputRef.current) inputRef.current.value = "";
        if (!file) return;
        const err = validateFile(file);
        if (err) {
            toast.error(err);
            return;
        }
        // V1.8 — open Diagnostic Estimator BEFORE any upload/run.
        setPendingFile(file);
        setDiagResult(null);
        setDiagOpen(true);
    };

    // Called by DiagnosticEstimatorModal once the user clicks Confirm & Process.
    const handleDiagnosticConfirmed = async (diag) => {
        setDiagResult(diag);
        setPendingDiagnoseId(diag?.diagnose_id || null);
        if (!pendingFile) return;
        // After confirmation → run the original upload / shadow flow.
        // Pass the diagnose_id so it threads through to the eventual export.
        await runFullAnalysis(pendingFile, diag?.diagnose_id || null);
    };

    const runFullAnalysis = async (file, diagnoseId) => {
        setUploading(true);
        setProgress(0);
        try {
            // First check user's tier — if free, go to shadow preview
            const me = await axios.get(`${API}/billing/me`).catch(() => null);
            const tierKey = me?.data?.tier_key || "free";
            if (tierKey === "free") {
                setShadowOpen(true);
                setUploading(false);
                return;
            }
            // Paid plan — real upload path
            const fd = new FormData();
            fd.append("file", file);
            const res = await axios.post(`${API}/studio/uploads`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (evt) => {
                    if (evt.total)
                        setProgress(Math.round((evt.loaded / evt.total) * 100));
                },
            });
            onProjectCreated({
                project: {
                    id: res.data.project_id,
                    name: file.name.replace(/\.[^.]+$/, ""),
                    source_filename: file.name,
                    simulated: false,
                    diagnose_id: diagnoseId,
                },
                classification: res.data,
                diagnose_id: diagnoseId,
            });
            toast.success(`Uploaded ${file.name} · classification ready [REAL MODE]`);
            setPendingFile(null);
        } catch (err) {
            const det = err?.response?.data?.detail;
            const errKey = typeof det === "object" ? det?.error : null;
            if (errKey === "profile_required" || errKey === "plan_required") {
                // Free / no profile → Shadow preview
                setShadowOpen(true);
            } else {
                toast.error(`Upload failed: ${typeof det === "string" ? det : err.message}`);
            }
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleShadowReady = (data) => {
        onProjectCreated({
            project: {
                id: data.id,
                name: data.name,
                source_filename: pendingFile?.name || `${data.id}.shadow`,
                simulated: true,
                shadow_preview: true,
                diagnose_id: pendingDiagnoseId,
            },
            classification: {
                project_id: data.id,
                occupancy_hazard: data.classification.occupancy_hazard,
                design_density_gpm_sqft: data.classification.design_density_gpm_sqft,
                design_area_sqft: data.classification.design_area_sqft,
                confidence: data.classification.confidence,
                rationale: data.classification.rationale,
                mocked: true,
                data_quality: "SIMULATED",
                shadow_preview: true,
            },
            shadow_layout: data.layout,
            shadow_hydraulics: data.hydraulics,
            diagnose_id: pendingDiagnoseId,
        });
        setPendingFile(null);
    };

    return (
        <div className="border border-white/10 bg-black" data-testid="upload-panel">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="fsrs-label text-slate-400">
                    /&nbsp;INPUT&nbsp;//&nbsp;UPLOAD
                </span>
                <span className="fsrs-label text-red-500">STEP&nbsp;01</span>
            </div>

            <div className="p-5">
                <button
                    onClick={pick}
                    disabled={uploading}
                    className="w-full border border-dashed border-white/20 hover:border-red-500 hover:bg-red-500/5 transition-colors p-6 flex flex-col items-center justify-center gap-3 disabled:opacity-50"
                    data-testid="upload-dropzone"
                >
                    {uploading ? (
                        <Loader2
                            className="w-7 h-7 text-red-500 animate-spin"
                            strokeWidth={1.5}
                        />
                    ) : (
                        <Upload
                            className="w-7 h-7 text-red-500"
                            strokeWidth={1.5}
                        />
                    )}
                    <div className="fsrs-mono text-white text-lg">
                        {uploading
                            ? `Uploading… ${progress}%`
                            : "Drop or click to upload"}
                    </div>
                    <div className="fsrs-label text-slate-500 text-center leading-relaxed">
                        PDF&nbsp;·&nbsp;DWG&nbsp;·&nbsp;DXF&nbsp;·&nbsp;PNG&nbsp;·&nbsp;JPG
                        <br />
                        max&nbsp;50&nbsp;MB&nbsp;[DEMO]
                    </div>
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={onFile}
                    className="hidden"
                    data-testid="upload-file-input"
                />
                {/* V1.8 — Diagnostic-first hint */}
                <p
                    className="fsrs-mono text-amber-300/85 text-lg leading-relaxed mt-3 flex items-start gap-1.5"
                    data-testid="upload-diagnostic-hint"
                >
                    <Gauge className="w-3 h-3 mt-[2px] shrink-0" strokeWidth={2} />
                    Every upload runs a cheap-pass <span className="text-amber-200 font-bold">Diagnostic Estimate</span> first.
                    Full analysis is gated until you Confirm & Process.
                </p>
                {/* Plan F — privacy reassurance */}
                <p
                    className="fsrs-mono text-emerald-300/80 text-lg leading-relaxed mt-3"
                    data-testid="upload-privacy-text"
                >
                    Your drawings are encrypted in transit and at rest. We never use your data for training. You own your data and can delete it anytime.
                </p>
                <p className="fsrs-mono text-amber-300/80 text-lg leading-relaxed mt-2 flex items-center gap-1.5" data-testid="upload-shadow-hint">
                    <FlaskConical className="w-3 h-3 inline" strokeWidth={2} />
                    Free tier: upload triggers a <span className="text-amber-200 font-bold">Shadow Preview</span> — metadata-only, no real AI.
                </p>
            </div>

            {/* Project info */}
            {project && (
                <div className="px-5 py-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText
                            className="w-4 h-4 text-red-500"
                            strokeWidth={1.5}
                        />
                        <span className="fsrs-mono text-white text-lg truncate">
                            {project.source_filename || project.name}
                        </span>
                    </div>
                    <Row k="PROJECT&nbsp;ID" v={project.id?.slice(0, 8) + "…"} />
                    {project.shadow_preview && (
                        <p className="mt-2 fsrs-label text-amber-300 font-bold">
                            SHADOW&nbsp;PREVIEW&nbsp;·&nbsp;METADATA-ONLY
                        </p>
                    )}
                    {diagResult && (
                        <div
                            className="mt-3 pt-3 border-t border-white/10"
                            data-testid="diagnostic-result-summary"
                        >
                            <Row
                                k="DIAGNOSTIC"
                                v={`${diagResult.complexity} · ${Number(diagResult.estimated_full_sru).toFixed(2)} SRUs`}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Classification result */}
            {classification && (
                <div className="px-5 py-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <span className="fsrs-label text-slate-400">
                            AI&nbsp;HAZARD&nbsp;CLASSIFICATION
                        </span>
                        <span className="fsrs-label text-red-500">
                            SAMPLE&nbsp;DATA
                        </span>
                    </div>
                    <div className="flex items-start gap-2 mb-3">
                        <CheckCircle2
                            className="w-4 h-4 text-red-500 mt-[2px]"
                            strokeWidth={2}
                        />
                        <div className="fsrs-mono text-white text-lg leading-snug">
                            {classification.occupancy_hazard}
                        </div>
                    </div>
                    <Row
                        k="DENSITY"
                        v={`${classification.design_density_gpm_sqft} gpm/sf`}
                    />
                    <Row
                        k="AREA"
                        v={`${classification.design_area_sqft} sq ft`}
                    />
                    <Row
                        k="CONFIDENCE"
                        v={`${Math.round(classification.confidence * 100)}%`}
                    />
                    <p className="mt-3 fsrs-label text-amber-300/80 leading-relaxed">
                        {classification.rationale}
                    </p>
                    {classification.shadow_preview && (
                        <p className="mt-3 fsrs-mono text-amber-200 text-lg font-bold leading-relaxed border-t border-amber-500/30 pt-3">
                            Simulated Preview — Real processing starts after paid trial.
                        </p>
                    )}
                </div>
            )}

            <DiagnosticEstimatorModal
                open={diagOpen}
                onOpenChange={setDiagOpen}
                file={pendingFile}
                onConfirmed={handleDiagnosticConfirmed}
            />

            <ShadowPreviewDialog
                open={shadowOpen}
                onOpenChange={setShadowOpen}
                file={pendingFile}
                onPreviewReady={handleShadowReady}
            />
        </div>
    );
}

function Row({ k, v }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span
                className="fsrs-label text-slate-500"
                dangerouslySetInnerHTML={{ __html: k }}
            />
            <span className="fsrs-mono text-slate-200 text-base">{v}</span>
        </div>
    );
}
