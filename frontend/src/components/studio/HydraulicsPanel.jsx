import { Activity, FileDown } from "lucide-react";
import SruEstimator from "@/components/studio/SruEstimator";

export default function HydraulicsPanel({ layout, hydraulics, project, classification, onExportClick }) {
    return (
        <div className="border border-white/10 bg-black" data-testid="hydraulics-panel">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="fsrs-label text-slate-400">
                    /&nbsp;OUTPUT&nbsp;//&nbsp;HYDRAULICS
                </span>
                <span className="fsrs-label text-red-500">STEP&nbsp;03</span>
            </div>

            {/* Layout summary */}
            {layout && (
                <div className="px-5 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <span className="fsrs-label text-slate-400">
                            LAYOUT&nbsp;SUMMARY
                        </span>
                        <span className="fsrs-label text-red-500">
                            SAMPLE&nbsp;DATA
                        </span>
                    </div>
                    <Row k="BAY" v={`${layout.bay_dimensions_ft.join(" × ")} ft`} />
                    <Row k="HEADS" v={String(layout.head_count)} />
                    <Row k="PIPE SEGMENTS" v={String(layout.pipe_segment_count)} />
                    <Row k="MAIN Ø" v={`${layout.main_pipe_diameter_in}\u2033`} />
                    <Row k="BRANCH Ø" v={`${layout.branch_pipe_diameter_in}\u2033`} />
                    <Row
                        k="COVERAGE/HEAD"
                        v={`${layout.coverage_per_head_sqft} sf`}
                    />
                </div>
            )}

            {/* Hydraulics */}
            {hydraulics && (
                <>
                    <div className="px-5 py-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="fsrs-label text-slate-400 flex items-center gap-2">
                                <Activity
                                    className="w-3.5 h-3.5 text-red-500"
                                    strokeWidth={2}
                                />
                                HYDRAULIC&nbsp;DEMAND
                            </span>
                            <span className="fsrs-label text-red-500">
                                SAMPLE&nbsp;DATA
                            </span>
                        </div>
                        <Row
                            k="REQ. FLOW"
                            v={`${hydraulics.required_flow_gpm} gpm`}
                            big
                        />
                        <Row
                            k="REQ. RESIDUAL"
                            v={`${hydraulics.required_residual_psi} psi`}
                            big
                        />
                        <Row
                            k="METHOD"
                            v={`${hydraulics.friction_method} · C=${hydraulics.hazen_williams_c}`}
                        />
                        <Row k="MOST REMOTE" v={hydraulics.most_remote_node} />
                    </div>
                    <div className="px-5 py-4 border-b border-white/10 overflow-x-auto">
                        <div className="fsrs-label text-slate-400 mb-3">
                            NODE&nbsp;TABLE&nbsp;·&nbsp;SAMPLE&nbsp;DATA
                        </div>
                        <table className="w-full fsrs-mono text-lg">
                            <thead className="text-slate-500">
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-1 pr-2">ID</th>
                                    <th className="text-right py-1 pr-2">P</th>
                                    <th className="text-right py-1 pr-2">Q</th>
                                    <th className="text-right py-1 pr-2">Ø</th>
                                    <th className="text-right py-1">V</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-200">
                                {hydraulics.nodes.map((n) => (
                                    <tr
                                        key={n.id}
                                        className="border-b border-white/5"
                                    >
                                        <td className="py-1 pr-2 text-white">
                                            {n.id}
                                        </td>
                                        <td className="text-right py-1 pr-2">
                                            {n.p_psi.toFixed(1)}
                                        </td>
                                        <td className="text-right py-1 pr-2">
                                            {n.q_gpm.toFixed(0)}
                                        </td>
                                        <td className="text-right py-1 pr-2">
                                            {n.pipe_d_in ?? "—"}
                                        </td>
                                        <td className="text-right py-1">
                                            {n.v_fps ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="fsrs-label text-amber-300/80 mt-3 leading-relaxed">
                            STATUS:&nbsp;{hydraulics.status}
                        </p>
                    </div>
                </>
            )}

            {/* Export */}
            <div className="p-5">
                <button
                    onClick={onExportClick}
                    disabled={!hydraulics}
                    className="fsrs-cta w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="open-export-modal-button"
                >
                    <FileDown className="w-4 h-4" strokeWidth={2} />
                    Export Demo Deliverables
                </button>
                <p className="fsrs-label text-amber-300/80 mt-3 leading-relaxed">
                    PE&nbsp;ACKNOWLEDGMENT&nbsp;REQUIRED&nbsp;BEFORE&nbsp;ANY&nbsp;EXPORT
                </p>
            </div>
        </div>
    );
}

function Row({ k, v, big }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="fsrs-label text-slate-500">{k}</span>
            <span
                className={`fsrs-mono text-slate-100 ${big ? "text-base" : "text-base"}`}
            >
                {v}
            </span>
        </div>
    );
}
