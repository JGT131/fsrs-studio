import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import Logo from "@/components/founding/Logo";
import DemoBanner from "@/components/studio/DemoBanner";
import UploadPanel from "@/components/studio/UploadPanel";
import Viewer3D from "@/components/studio/Viewer3D";
import HydraulicsPanel from "@/components/studio/HydraulicsPanel";
import ExportDialog from "@/components/studio/ExportDialog";
import PostDemoCTA from "@/components/studio/PostDemoCTA";
import Footer from "@/components/founding/Footer";
import LegalDisclaimerModal from "@/components/founding/LegalDisclaimerModal";
import { Loader2, Cpu, Boxes, Activity, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { getClientId } from "@/lib/clientId";
import DemoFeedbackModal from "@/components/founding/DemoFeedbackModal";
import GuestCodeChip from "@/components/studio/GuestCodeChip";
import NeedHelpButton from "@/components/studio/NeedHelpButton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HASH_TO_PANEL = {
    "#scan": "studio-upload",
    "#model": "studio-viewer",
    "#report": "studio-hydraulics",
};

export default function Studio() {
    const [project, setProject] = useState(null);
    const [classification, setClassification] = useState(null);
    const [layout, setLayout] = useState(null);
    const [hydraulics, setHydraulics] = useState(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [genLayout, setGenLayout] = useState(false);
    const [genCalcs, setGenCalcs] = useState(false);
    const [focusPanel, setFocusPanel] = useState(null);
    const [postDemoOpen, setPostDemoOpen] = useState(false);
    const [demoFeedbackOpen, setDemoFeedbackOpen] = useState(false);
    const [shadowFeedbackPromptOpen, setShadowFeedbackPromptOpen] = useState(false);
    const uploadRef = useRef(null);
    const viewerRef = useRef(null);
    const hydraulicsRef = useRef(null);
    const location = useLocation();

    // Preload Garage Project on mount (simulated mode default)
    // Skip if a case study is being loaded via ?example=...
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("example")) return; // case-study effect handles loading
        let cancelled = false;
        const preload = async () => {
            try {
                const res = await axios.post(`${API}/studio/simulated/start`, null, {
                    headers: { "X-Client-Id": getClientId() },
                });
                if (cancelled) return;
                const d = res.data;
                setProject({
                    id: d.project_id,
                    name: d.project_name,
                    source_filename: "garage_floorplan.simulated.pdf",
                    simulated: true,
                });
                setClassification(d.preloaded_classification);
                setLayout(d.preloaded_layout);
                setHydraulics(d.preloaded_hydraulics);
            } catch (err) {
                console.warn("Simulated preload failed", err);
            }
        };
        preload();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cascade for real uploads (no-op when classification arrived via preload)
    useEffect(() => {
        const run = async () => {
            if (!project?.id || !classification) return;
            if (project.simulated) return; // already preloaded
            if (layout && hydraulics) return;
            try {
                setGenLayout(true);
                const fd = new FormData();
                fd.append("project_id", project.id);
                const lay = await axios.post(`${API}/studio/layouts`, fd);
                setLayout(lay.data);
                setGenLayout(false);

                setGenCalcs(true);
                const fd2 = new FormData();
                fd2.append("project_id", project.id);
                const calc = await axios.post(`${API}/studio/calcs`, fd2);
                setHydraulics(calc.data);
                setGenCalcs(false);
                toast.success("Layout & hydraulics generated [SAMPLE DATA]");
            } catch (err) {
                setGenLayout(false);
                setGenCalcs(false);
                toast.error(
                    `Generation failed: ${err?.response?.data?.detail || err.message}`,
                );
            }
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id, classification?.project_id]);

    const handleProjectCreated = ({ project: p, classification: c, shadow_layout, shadow_hydraulics }) => {
        setProject(p);
        setClassification(c);
        if (shadow_layout && shadow_hydraulics) {
            setLayout(shadow_layout);
            setHydraulics(shadow_hydraulics);
            // Trigger low-friction "Demo Experience" feedback banner once
            // the Simulated Shadow Preview finishes — but never auto-open
            // the modal; user explicitly clicks the banner CTA.
            if (p?.shadow_preview) {
                const seen = typeof window !== "undefined" &&
                    sessionStorage.getItem("fsrs_demo_feedback_dismissed") === "1";
                if (!seen) {
                    // Tiny delay so the user first sees the preview render
                    setTimeout(() => setShadowFeedbackPromptOpen(true), 600);
                }
            }
        } else {
            setLayout(null);
            setHydraulics(null);
        }
    };

    const dismissShadowFeedbackPrompt = () => {
        setShadowFeedbackPromptOpen(false);
        try {
            sessionStorage.setItem("fsrs_demo_feedback_dismissed", "1");
        } catch (e) {
            /* ignore quota */
        }
    };

    // Load case study by ?example=ID
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const exampleId = params.get("example");
        if (!exampleId) return;
        (async () => {
            try {
                const r = await axios.get(`${API}/studio/case-studies/${exampleId}`);
                const d = r.data;
                setProject({
                    id: d.project_id,
                    name: d.name,
                    source_filename: `${d.id}.case-study`,
                    simulated: true,
                    case_study: d.id,
                });
                setClassification({
                    project_id: d.project_id,
                    occupancy_hazard: d.classification.occupancy_hazard,
                    design_density_gpm_sqft: d.classification.design_density_gpm_sqft,
                    design_area_sqft: d.classification.design_area_sqft,
                    confidence: d.classification.confidence,
                    rationale: d.classification.rationale,
                    mocked: true,
                    data_quality: "SIMULATED",
                });
                setLayout(d.layout);
                setHydraulics(d.hydraulics);
                toast.success(`Loaded case study: ${d.name}`);
            } catch (e) {
                toast.error("Case study not found");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    useEffect(() => {
        const hash = location.hash;
        const target = HASH_TO_PANEL[hash];
        if (!target) return;
        const refMap = {
            "studio-upload": uploadRef,
            "studio-viewer": viewerRef,
            "studio-hydraulics": hydraulicsRef,
        };
        const ref = refMap[target];
        if (!ref?.current) return;
        const t = setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            setFocusPanel(target);
            const clear = setTimeout(() => setFocusPanel(null), 2400);
            return () => clearTimeout(clear);
        }, 120);
        return () => clearTimeout(t);
    }, [location.hash]);

    const focusClass = (id) =>
        focusPanel === id
            ? "ring-2 ring-red-500 ring-offset-0 shadow-[0_0_0_1px_rgba(239,68,68,0.4),0_30px_80px_-30px_rgba(239,68,68,0.4)]"
            : "";

    return (
        <main
            className="min-h-screen bg-black text-slate-100 flex flex-col"
            data-testid="studio-page"
        >
            <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur border-b border-white/10">
                <div className="mx-auto max-w-[1500px] px-6 lg:px-10 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            aria-label="FSRS — Home"
                            className="cursor-pointer transition-opacity duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            data-testid="back-to-landing"
                        >
                            <Logo size={30} showTagline variant="inline" className="hidden md:inline-flex" />
                            <Logo size={30} showTagline={false} className="md:hidden" />
                        </Link>
                        <span className="fsrs-label hidden lg:inline pl-3 border-l border-white/10 text-slate-500 flex items-center gap-2">
                            <FlaskConical className="w-3 h-3 text-amber-400" strokeWidth={2} />
                            STUDIO&nbsp;//&nbsp;SIMULATED&nbsp;DEMO
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <GuestCodeChip />
                        <div className="hidden md:flex items-center gap-2">
                            <span className="fsrs-dot" />
                            <span className="fsrs-label text-slate-400">
                                SYS.RDY&nbsp;//&nbsp;v0.9.0-BETA
                            </span>
                        </div>
                        <Link
                            to="/examples"
                            className="fsrs-cta-ghost text-lg py-2 px-3"
                            data-testid="nav-examples-link"
                        >
                            Examples ↗
                        </Link>
                        <Link
                            to="/app"
                            className="fsrs-cta-ghost text-lg py-2 px-3"
                            data-testid="open-gateway"
                        >
                            Real Mode ↗
                        </Link>
                        <Link
                            to="/"
                            className="fsrs-cta-ghost text-lg py-2 px-3"
                            data-testid="back-to-marketing"
                        >
                            ← Marketing
                        </Link>
                    </div>
                </div>
            </header>

            <DemoBanner />

            {/* Plan F — session-is-private banner */}
            <div
                className="border-b border-emerald-500/30 bg-emerald-500/[0.04]"
                data-testid="session-private-banner"
            >
                <div className="mx-auto max-w-[1500px] px-6 lg:px-10 py-2 flex items-center gap-3 flex-wrap">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="fsrs-mono text-emerald-300 text-lg font-bold tracking-wider">
                        THIS&nbsp;SESSION&nbsp;IS&nbsp;PRIVATE&nbsp;·&nbsp;NO&nbsp;HUMAN&nbsp;REVIEWS&nbsp;YOUR&nbsp;DRAWINGS&nbsp;·&nbsp;DATA&nbsp;ENCRYPTED&nbsp;IN&nbsp;TRANSIT&nbsp;&&nbsp;AT&nbsp;REST
                    </span>
                </div>
            </div>

            {/* Pipeline strip — clickable, scroll to panel */}
            <div className="border-b border-white/10 bg-black">
                <div className="mx-auto max-w-[1500px] px-6 lg:px-10 py-3 grid grid-cols-3 gap-3">
                    <PipelineStep
                        idx="01"
                        hash="#scan"
                        label="AI HAZARD CLASSIFICATION"
                        icon={Cpu}
                        active={!!classification}
                        loading={false}
                    />
                    <PipelineStep
                        idx="02"
                        hash="#model"
                        label="3D LAYOUT GENERATION"
                        icon={Boxes}
                        active={!!layout}
                        loading={genLayout}
                    />
                    <PipelineStep
                        idx="03"
                        hash="#report"
                        label="HYDRAULIC SUMMARY"
                        icon={Activity}
                        active={!!hydraulics}
                        loading={genCalcs}
                    />
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1500px] px-6 lg:px-10 py-6 flex-1">
                <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px]">
                    <div
                        id="studio-upload"
                        ref={uploadRef}
                        className={`lg:col-span-3 overflow-y-auto transition-shadow scroll-mt-32 ${focusClass("studio-upload")}`}
                    >
                        <UploadPanel
                            project={project}
                            classification={classification}
                            onProjectCreated={handleProjectCreated}
                        />
                    </div>

                    <div
                        id="studio-viewer"
                        ref={viewerRef}
                        className={`lg:col-span-6 border border-white/10 bg-[#050505] relative overflow-hidden transition-shadow scroll-mt-32 ${focusClass("studio-viewer")}`}
                    >
                        <Viewer3D />
                        {/* Persistent SIMULATED overlay badge */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 fsrs-mono text-amber-200 bg-amber-500/15 border border-amber-500/60 px-3 py-1.5 text-lg font-bold tracking-wider pointer-events-none">
                            <FlaskConical className="w-3 h-3" strokeWidth={2} />
                            THIS&nbsp;IS&nbsp;A&nbsp;SIMULATED&nbsp;DEMO&nbsp;·&nbsp;SAMPLE&nbsp;DATA&nbsp;ONLY&nbsp;·&nbsp;NO&nbsp;REAL&nbsp;AI&nbsp;PROCESSING
                        </div>
                    </div>

                    <div
                        id="studio-hydraulics"
                        ref={hydraulicsRef}
                        className={`lg:col-span-3 overflow-y-auto transition-shadow scroll-mt-32 ${focusClass("studio-hydraulics")}`}
                    >
                        <HydraulicsPanel
                            layout={layout}
                            hydraulics={hydraulics}
                            project={project}
                            classification={classification}
                            onExportClick={() => {
                                if (!project) {
                                    toast.error("Project not loaded yet.");
                                    return;
                                }
                                setExportOpen(true);
                            }}
                        />
                    </div>
                </div>
            </div>

            {shadowFeedbackPromptOpen && (
                <ShadowPreviewFeedbackBanner
                    onShare={() => {
                        dismissShadowFeedbackPrompt();
                        setDemoFeedbackOpen(true);
                    }}
                    onDismiss={dismissShadowFeedbackPrompt}
                />
            )}

            <Footer />

            <ExportDialog
                open={exportOpen}
                onOpenChange={setExportOpen}
                project={project}
                classification={classification}
                diagnoseId={project?.diagnose_id || null}
            />
            <PostDemoCTA open={postDemoOpen} onOpenChange={setPostDemoOpen} />
            <DemoFeedbackModal
                open={demoFeedbackOpen}
                onOpenChange={setDemoFeedbackOpen}
                source="studio_shadow_preview"
            />
            <LegalDisclaimerModal />
            <NeedHelpButton />
        </main>
    );
}

function ShadowPreviewFeedbackBanner({ onShare, onDismiss }) {
    return (
        <div
            className="fixed bottom-6 right-6 z-30 max-w-sm border border-amber-400/40 bg-black/95 backdrop-blur shadow-[0_30px_80px_-20px_rgba(245,158,11,0.35)] animate-in slide-in-from-bottom-3 duration-300"
            data-testid="shadow-preview-feedback-banner"
        >
            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-400" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-400" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-400" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-400" />

            <div className="p-5">
                <div className="fsrs-overline mb-2 text-amber-300">
                    /&nbsp;DEMO&nbsp;EXPERIENCE
                </div>
                <p className="text-slate-100 text-lg leading-snug mb-4">
                    Simulated preview rendered. How did it feel? A 10-second
                    note helps us improve FSRS.
                </p>
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onDismiss}
                        className="fsrs-cta-ghost text-lg py-2 px-3"
                        data-testid="shadow-feedback-dismiss"
                    >
                        Not now
                    </button>
                    <button
                        onClick={onShare}
                        className="fsrs-cta text-lg py-2 px-3 !bg-amber-400 hover:!bg-amber-300 !text-black"
                        data-testid="shadow-feedback-share-button"
                    >
                        Share Demo Experience
                    </button>
                </div>
                <p className="mt-3 text-lg font-mono text-slate-500 leading-relaxed">
                    No card, no email required. Stored separately from
                    verified engineer testimonials.
                </p>
            </div>
        </div>
    );
}

function PipelineStep({ idx, hash, label, icon: Icon, active, loading }) {
    return (
        <Link
            to={`/studio${hash}`}
            className={`flex items-center gap-3 px-3 py-2 border group transition-all duration-300 outline-none ${
                active
                    ? "border-red-500/60 bg-red-500/5"
                    : "border-white/10 bg-black"
            } hover:border-red-500 hover:bg-red-500/10 hover:shadow-[inset_0_0_60px_-10px_rgba(239,68,68,0.25),0_0_30px_-10px_rgba(239,68,68,0.45)] focus-visible:border-red-500 cursor-pointer`}
            data-testid={`pipeline-step-${idx}`}
            aria-label={`Step ${idx}: ${label} — scroll to panel`}
        >
            <div
                className={`w-8 h-8 border flex items-center justify-center shrink-0 transition-all ${active ? "border-red-500" : "border-white/15"} group-hover:border-red-500 group-hover:bg-red-500/15 group-hover:shadow-[0_0_18px_-3px_rgba(239,68,68,0.7)]`}
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" strokeWidth={2} />
                ) : (
                    <Icon
                        className={`w-3.5 h-3.5 transition-all ${active ? "text-red-500" : "text-slate-500"} group-hover:text-red-500 group-hover:scale-110`}
                        strokeWidth={1.5}
                    />
                )}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="fsrs-label text-slate-500 group-hover:text-red-500 transition-colors">
                    STEP&nbsp;{idx}
                </span>
                <span
                    className={`fsrs-mono text-base truncate transition-colors ${active ? "text-white" : "text-slate-400"} group-hover:text-white`}
                >
                    {label}
                </span>
            </div>
            <span
                className={`ml-auto fsrs-label transition-colors ${active ? "text-red-500 group-hover:text-red-300" : "text-slate-600 group-hover:text-red-500"}`}
            >
                {loading ? "…" : active ? "OK" : "—"}
            </span>
        </Link>
    );
}
