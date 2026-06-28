// Plan C — Shadow Preview metadata form.
// Triggered when a free-tier user uploads a drawing without a paid plan.
// We DON'T process the file; we ask for metadata and compute a SIMULATED
// preview deterministically.

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import { FlaskConical, ArrowRight, Loader2 } from "lucide-react";
import { getClientId } from "@/lib/clientId";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OCCUPANCY_OPTIONS = [
    { key: "light", label: "Light Hazard", hint: "Offices · Hotels · Hospitals" },
    { key: "oh1", label: "Ordinary Hazard, Group 1", hint: "Garages · Restaurants" },
    { key: "oh2", label: "Ordinary Hazard, Group 2", hint: "Retail · Warehouse" },
    { key: "eh1", label: "Extra Hazard, Group 1", hint: "Woodworking · Printing" },
    { key: "eh2", label: "Extra Hazard, Group 2", hint: "Paint spraying · Flammables" },
];

export default function ShadowPreviewDialog({ open, onOpenChange, file, onPreviewReady }) {
    const [sqft, setSqft] = useState(25000);
    const [occupancy, setOccupancy] = useState("oh1");
    const [buildingType, setBuildingType] = useState("");
    const [stories, setStories] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("sqft", String(sqft));
            fd.append("occupancy", occupancy);
            if (buildingType) fd.append("building_type", buildingType);
            fd.append("stories", String(stories));
            if (file) fd.append("file", file);
            const res = await axios.post(`${API}/studio/shadow-preview`, fd, {
                headers: { "X-Client-Id": getClientId(), "Content-Type": "multipart/form-data" },
            });
            toast.success("Shadow preview generated [SIMULATED]");
            onPreviewReady(res.data);
            onOpenChange(false);
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message;
            toast.error(`Shadow preview failed: ${typeof msg === "string" ? msg : "see console"}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="!rounded-none !p-0 !max-w-lg !border-white/15 !bg-black"
                data-testid="shadow-preview-dialog"
            >
                <div className="relative">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500" />

                    <div className="px-7 pt-7 pb-5 border-b border-white/10 bg-amber-500/[0.06]">
                        <div className="flex items-center gap-2 mb-2">
                            <FlaskConical className="w-5 h-5 text-amber-400" strokeWidth={2} />
                            <span className="fsrs-overline text-amber-300">
                                /&nbsp;SHADOW&nbsp;PREVIEW
                            </span>
                        </div>
                        <DialogTitle asChild>
                            <h3 className="fsrs-heading text-white text-xl tracking-tight">
                                See how FSRS handles YOUR project — no real AI yet.
                            </h3>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <p className="mt-2 fsrs-mono text-amber-200 text-base leading-relaxed font-bold">
                                We won&apos;t process your file. Tell us about
                                the project and we&apos;ll show a SIMULATED
                                result based on NFPA 13 reference values.
                            </p>
                        </DialogDescription>
                    </div>

                    <form onSubmit={submit} className="px-7 py-6 space-y-4">
                        <label className="block">
                            <span className="fsrs-label text-slate-400 mb-2 block">
                                APPROX. FLOOR AREA (SQ FT)&nbsp;
                                <span className="text-red-500">*</span>
                            </span>
                            <input
                                type="number"
                                min="100"
                                max="5000000"
                                step="100"
                                required
                                value={sqft}
                                onChange={(e) => setSqft(parseInt(e.target.value || "0", 10))}
                                className="fsrs-input"
                                data-testid="shadow-sqft-input"
                            />
                        </label>

                        <div>
                            <span className="fsrs-label text-slate-400 mb-2 block">
                                OCCUPANCY HAZARD CLASS&nbsp;<span className="text-red-500">*</span>
                            </span>
                            <div className="grid grid-cols-1 gap-2" data-testid="shadow-occ-grid">
                                {OCCUPANCY_OPTIONS.map((o) => (
                                    <button
                                        type="button"
                                        key={o.key}
                                        onClick={() => setOccupancy(o.key)}
                                        className={`text-left p-3 border transition-colors ${
                                            occupancy === o.key
                                                ? "border-red-500 bg-red-500/10"
                                                : "border-white/15 hover:border-white/30"
                                        }`}
                                        data-testid={`shadow-occ-${o.key}`}
                                    >
                                        <div className="fsrs-mono text-white text-base font-bold">{o.label}</div>
                                        <div className="fsrs-label text-slate-500 mt-1">{o.hint}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    BUILDING TYPE
                                </span>
                                <input
                                    type="text"
                                    value={buildingType}
                                    onChange={(e) => setBuildingType(e.target.value)}
                                    placeholder="e.g. Retail Showroom"
                                    className="fsrs-input"
                                    data-testid="shadow-btype-input"
                                />
                            </label>
                            <label className="block">
                                <span className="fsrs-label text-slate-400 mb-2 block">
                                    STORIES
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    max="80"
                                    value={stories}
                                    onChange={(e) => setStories(parseInt(e.target.value || "1", 10))}
                                    className="fsrs-input"
                                    data-testid="shadow-stories-input"
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                            <p className="fsrs-label text-amber-300 max-w-xs leading-relaxed">
                                Simulated Preview — Real processing starts after paid trial.
                            </p>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="fsrs-cta disabled:opacity-50"
                                data-testid="shadow-submit"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-4 h-4" />
                                )}
                                Generate Shadow Preview
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
