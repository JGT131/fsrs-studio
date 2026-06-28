// Plan I — Free Preliminary Hazard Scan landing page.
// Acquisition lead magnet, restricted to the first 25 Iowa professionals.
// Reuses the V1.8 Diagnostic Estimator to score complexity, then applies a
// smart-guard: small enough → Process Free, otherwise → Upgrade to Paid.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PageShell from "@/components/founding/PageShell";
import SeoHead from "@/components/seo/SeoHead";
import {
    Upload,
    Loader2,
    Gauge,
    AlertTriangle,
    CheckCircle2,
    Mail,
    Building2,
    User as UserIcon,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    FlaskConical,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ALLOWED_EXTS = [".pdf", ".dwg", ".dxf", ".png", ".jpg", ".jpeg"];
const ACCEPT = ALLOWED_EXTS.join(",");
const MAX_BYTES = 15 * 1024 * 1024; // Plan I — tighter than V1.8 (50 MB)
const MAX_SRU = 1.5;

function validateFreeSampleFile(file) {
    if (!file) return "No file selected.";
    if (file.size > MAX_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(1);
        return `File is ${mb} MB — Free Sample limit is 15 MB.`;
    }
    const name = (file.name || "").toLowerCase();
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    if (!ALLOWED_EXTS.includes(ext)) {
        return `Unsupported file type ${ext || "(unknown)"}. Allowed: PDF · DWG · DXF · PNG · JPG.`;
    }
    return null;
}

export default function FreeSamplePage() {
    const [availability, setAvailability] = useState(null);
    const [file, setFile] = useState(null);
    const [diag, setDiag] = useState(null);
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagError, setDiagError] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", firm: "", notes: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        axios
            .get(`${API}/studio/free-sample/availability`)
            .then((r) => {
                if (!cancelled) setAvailability(r.data);
            })
            .catch(() => {
                if (!cancelled) setAvailability({ cap: 25, claimed: 0, remaining: 25 });
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handlePick = () => inputRef.current?.click();

    const handleFileChange = async (e) => {
        const f = e.target.files?.[0];
        if (inputRef.current) inputRef.current.value = "";
        if (!f) return;
        const err = validateFreeSampleFile(f);
        if (err) {
            toast.error(err);
            return;
        }
        setFile(f);
        setDiag(null);
        setDiagError(null);
        setDiagLoading(true);
        try {
            const fd = new FormData();
            fd.append("file", f);
            fd.append("occupancy", "oh1");
            fd.append("stories", "1");
            fd.append("doc_type", "pdf");
            const r = await axios.post(`${API}/studio/diagnose`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setDiag(r.data);
        } catch (ex) {
            const det = ex?.response?.data?.detail;
            setDiagError(typeof det === "string" ? det : ex.message || "Diagnostic failed");
        } finally {
            setDiagLoading(false);
        }
    };

    const qualifies =
        diag && diag.estimated_full_sru <= MAX_SRU && diag.file_bytes <= MAX_BYTES;

    const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

    const canSubmit =
        qualifies &&
        form.name.trim().length >= 2 &&
        form.firm.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
        !submitting &&
        (availability?.remaining ?? 0) > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await axios.post(`${API}/studio/free-sample/claim`, {
                name: form.name.trim(),
                email: form.email.trim(),
                firm: form.firm.trim(),
                notes: form.notes.trim() || null,
                diagnose_id: diag.diagnose_id,
            });
            navigate("/free-sample/success", {
                state: {
                    claim_id: res.data.claim_id,
                    scheduled_email_at: res.data.scheduled_email_at,
                    remaining_after_claim: res.data.remaining_after_claim,
                    estimated_full_sru: res.data.estimated_full_sru,
                    email: form.email.trim(),
                },
            });
        } catch (ex) {
            const det = ex?.response?.data?.detail;
            setSubmitError(
                (det && typeof det === "object" ? det.message : det) ||
                    ex.message ||
                    "Claim failed",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageShell>
            <SeoHead
                title="Free Preliminary Hazard Scan · FSRS — Iowa Engineers"
                description="Iowa fire-protection engineers: claim a complimentary 2–3 page watermarked NFPA 13 hazard-classification + preliminary layout sample. Limited to the first 25 professionals."
                canonical="/free-sample"
            />
            <section
                className="relative bg-black border-b border-white/10"
                data-testid="free-sample-page"
            >
                <div className="mx-auto max-w-[1200px] px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-10">
                    {/* LEFT — Hero copy */}
                    <div className="lg:col-span-7">
                        <div className="fsrs-overline text-amber-300 mb-4 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" strokeWidth={2} />
                            /&nbsp;ACQUISITION&nbsp;//&nbsp;FREE&nbsp;SAMPLE
                        </div>
                        <h1
                            className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[0.95]"
                            data-testid="free-sample-headline"
                        >
                            Free Preliminary
                            <br />
                            <span className="text-red-500">Hazard Scan</span>.
                        </h1>
                        <p
                            className="mt-6 fsrs-mono text-amber-300 text-lg tracking-wider"
                            data-testid="free-sample-subheadline"
                        >
                            Limited to the first&nbsp;
                            <span className="font-bold tabular-nums">{availability?.cap ?? 25}</span>
                            &nbsp;{availability?.location || "Iowa"}&nbsp;professionals.
                        </p>

                        <p
                            className="mt-8 text-slate-300 text-base lg:text-lg leading-relaxed max-w-2xl"
                            data-testid="free-sample-body-copy"
                        >
                            Upload one smaller project drawing and receive a
                            complimentary 2&ndash;3 page watermarked report
                            including:&nbsp;
                            <span className="text-white font-bold">AI Hazard Classification</span>,
                            &nbsp;
                            <span className="text-white font-bold">Basic Layout Suggestions</span>, and&nbsp;
                            <span className="text-white font-bold">Preliminary Hydraulic Notes</span>.
                        </p>

                        {/* Limits strip */}
                        <div
                            className="mt-8 grid grid-cols-3 gap-0 border border-white/10 max-w-2xl"
                            data-testid="free-sample-limits"
                        >
                            <LimitCell label="MAX SIZE" value="15 MB" />
                            <LimitCell
                                label="MAX COMPLEXITY"
                                value="1.5 SRUs"
                                divider
                            />
                            <LimitCell
                                label="QUOTA"
                                value="1 / firm"
                                divider
                            />
                        </div>

                        {/* Availability counter */}
                        {availability && (
                            <div
                                className="mt-6 flex items-center gap-3 fsrs-mono text-base tracking-wider max-w-2xl"
                                data-testid="free-sample-availability"
                            >
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                <span className="text-emerald-300 font-bold">
                                    {availability.remaining}
                                </span>
                                <span className="text-slate-500">
                                    / {availability.cap} SLOTS REMAINING
                                </span>
                            </div>
                        )}

                        {/* Professional notice */}
                        <div
                            className="mt-8 border border-amber-500/40 bg-amber-500/[0.05] p-5 max-w-2xl"
                            data-testid="free-sample-professional-notice"
                            role="alert"
                        >
                            <div className="fsrs-overline text-amber-300 mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" strokeWidth={2} />
                                /&nbsp;PROFESSIONAL&nbsp;NOTICE
                            </div>
                            <p className="text-amber-100 text-lg leading-relaxed">
                                This is a preliminary sample only. All outputs
                                are watermarked and require full review,
                                modification, and stamping by a licensed
                                Professional Engineer.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT — Upload + smart-guard form */}
                    <div className="lg:col-span-5">
                        <div
                            className="border border-white/10 bg-[#080808] relative"
                            data-testid="free-sample-form-card"
                        >
                            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <span className="fsrs-label text-slate-400">
                                    /&nbsp;CLAIM&nbsp;FORM
                                </span>
                                <span className="fsrs-label text-red-500">STEP 01</span>
                            </div>

                            <form className="p-6 space-y-5" onSubmit={handleSubmit}>
                                <Field
                                    label="Your name"
                                    icon={UserIcon}
                                    value={form.name}
                                    onChange={onChange("name")}
                                    placeholder="Jane Engineer, PE"
                                    testid="free-sample-name-input"
                                    autoComplete="name"
                                />
                                <Field
                                    label="Email"
                                    icon={Mail}
                                    type="email"
                                    value={form.email}
                                    onChange={onChange("email")}
                                    placeholder="jane@firm-iowa.com"
                                    testid="free-sample-email-input"
                                    autoComplete="email"
                                />
                                <Field
                                    label="Firm / company"
                                    icon={Building2}
                                    value={form.firm}
                                    onChange={onChange("firm")}
                                    placeholder="Cedar Falls Fire Protection"
                                    testid="free-sample-firm-input"
                                    autoComplete="organization"
                                />

                                {/* File picker */}
                                <div>
                                    <div className="fsrs-label text-slate-500 mb-2">
                                        PROJECT&nbsp;DRAWING
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePick}
                                        disabled={diagLoading}
                                        className="w-full border border-dashed border-white/20 hover:border-red-500 hover:bg-red-500/5 transition-colors p-5 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                                        data-testid="free-sample-upload-button"
                                    >
                                        {diagLoading ? (
                                            <Loader2
                                                className="w-6 h-6 text-amber-300 animate-spin"
                                                strokeWidth={1.5}
                                            />
                                        ) : (
                                            <Upload
                                                className="w-6 h-6 text-red-500"
                                                strokeWidth={1.5}
                                            />
                                        )}
                                        <span className="fsrs-mono text-white text-lg">
                                            {file ? file.name : "Drop or click to upload"}
                                        </span>
                                        <span className="fsrs-label text-slate-500">
                                            PDF · DWG · DXF · PNG · JPG · max 15 MB
                                        </span>
                                    </button>
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept={ACCEPT}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        data-testid="free-sample-file-input"
                                    />
                                </div>

                                {/* Smart-guard result */}
                                {diagError && (
                                    <div
                                        className="border border-red-500/60 bg-red-500/[0.06] p-4 flex items-start gap-3"
                                        data-testid="free-sample-diag-error"
                                    >
                                        <AlertTriangle
                                            className="w-4 h-4 text-red-400 mt-[2px]"
                                            strokeWidth={2}
                                        />
                                        <p className="fsrs-mono text-red-200 text-base leading-relaxed">
                                            {diagError}
                                        </p>
                                    </div>
                                )}

                                {diag && qualifies && (
                                    <div
                                        className="border border-emerald-400/50 bg-emerald-500/[0.06] p-4"
                                        data-testid="free-sample-qualifies"
                                    >
                                        <div className="fsrs-overline text-emerald-300 mb-2 flex items-center gap-2">
                                            <CheckCircle2
                                                className="w-3 h-3"
                                                strokeWidth={2}
                                            />
                                            /&nbsp;QUALIFIES
                                        </div>
                                        <p
                                            className="fsrs-mono text-emerald-100 text-lg leading-relaxed"
                                            data-testid="free-sample-qualify-sentence"
                                        >
                                            This project qualifies for a Free
                                            Sample (Est.{" "}
                                            <span className="text-white font-bold tabular-nums">
                                                {Number(diag.estimated_full_sru).toFixed(2)}{" "}
                                                SRUs
                                            </span>
                                            ). Process Free?
                                        </p>
                                    </div>
                                )}

                                {diag && !qualifies && (
                                    <div
                                        className="border border-amber-500/50 bg-amber-500/[0.06] p-4"
                                        data-testid="free-sample-exceeds"
                                    >
                                        <div className="fsrs-overline text-amber-300 mb-2 flex items-center gap-2">
                                            <AlertTriangle
                                                className="w-3 h-3"
                                                strokeWidth={2}
                                            />
                                            /&nbsp;EXCEEDS&nbsp;FREE&nbsp;LIMITS
                                        </div>
                                        <p
                                            className="fsrs-mono text-amber-100 text-lg leading-relaxed mb-3"
                                            data-testid="free-sample-exceeds-sentence"
                                        >
                                            This project exceeds Free Sample
                                            limits (Est.{" "}
                                            <span className="text-white font-bold tabular-nums">
                                                {Number(diag.estimated_full_sru).toFixed(2)}{" "}
                                                SRUs
                                            </span>
                                            ). Would you like to upgrade to a
                                            full paid analysis?
                                        </p>
                                        <Link
                                            to="/pricing"
                                            className="inline-flex items-center gap-2 fsrs-cta text-lg tracking-wider py-2.5 px-4 !bg-amber-400 hover:!bg-amber-300 !text-black"
                                            data-testid="free-sample-upgrade-cta"
                                        >
                                            UPGRADE&nbsp;TO&nbsp;PAID
                                            <ArrowRight
                                                className="w-3.5 h-3.5"
                                                strokeWidth={2}
                                            />
                                        </Link>
                                    </div>
                                )}

                                {submitError && (
                                    <div
                                        className="border border-red-500/60 bg-red-500/[0.06] p-3 fsrs-mono text-red-200 text-base"
                                        data-testid="free-sample-submit-error"
                                    >
                                        {submitError}
                                    </div>
                                )}

                                {/* Primary CTA */}
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="w-full fsrs-cta text-lg tracking-wider py-3 px-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 !bg-red-500 hover:!bg-red-400 !text-white shadow-[0_0_24px_-6px_rgba(239,68,68,0.7)]"
                                    data-testid="free-sample-submit-button"
                                >
                                    {submitting ? (
                                        <Loader2
                                            className="w-3.5 h-3.5 animate-spin"
                                            strokeWidth={2}
                                        />
                                    ) : (
                                        <CheckCircle2
                                            className="w-3.5 h-3.5"
                                            strokeWidth={2}
                                        />
                                    )}
                                    {submitting ? "SCHEDULING…" : "CLAIM MY FREE SAMPLE"}
                                </button>

                                <p className="fsrs-mono text-lg text-slate-500 leading-relaxed flex items-start gap-1.5">
                                    <FlaskConical
                                        className="w-3 h-3 mt-[2px] shrink-0"
                                        strokeWidth={2}
                                    />
                                    SIMULATED preview. PE review, modification,
                                    and stamping required before any submission.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}

function LimitCell({ label, value, divider }) {
    return (
        <div
            className={`p-4 ${divider ? "border-l border-white/10" : ""}`}
            data-testid={`free-sample-limit-${label.toLowerCase().replace(/\s+/g, "-")}`}
        >
            <div className="fsrs-label text-slate-500 mb-1">{label}</div>
            <div className="fsrs-mono text-white text-lg font-bold tabular-nums">
                {value}
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, value, onChange, type, placeholder, testid, autoComplete }) {
    return (
        <label className="block">
            <span className="fsrs-label text-slate-500 mb-2 flex items-center gap-1.5">
                <Icon className="w-3 h-3" strokeWidth={2} />
                {label.toUpperCase()}
            </span>
            <input
                type={type || "text"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="w-full bg-black border border-white/15 focus:border-red-500 focus:outline-none focus:ring-0 focus:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.45)] px-3 py-2.5 fsrs-mono text-white text-lg placeholder:text-slate-600"
                data-testid={testid}
            />
        </label>
    );
}
