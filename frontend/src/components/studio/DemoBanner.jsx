import { AlertOctagon, FlaskConical } from "lucide-react";

export default function DemoBanner() {
    return (
        <div
            className="w-full bg-amber-500/10 border-y-2 border-amber-500"
            data-testid="studio-demo-banner"
            role="alert"
        >
            <div className="mx-auto max-w-[1500px] px-6 lg:px-10 py-3 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <FlaskConical
                        className="w-5 h-5 text-amber-400"
                        strokeWidth={2}
                    />
                    <span className="fsrs-mono text-amber-200 font-bold text-base sm:text-lg tracking-wider">
                        SIMULATED&nbsp;STUDIO&nbsp;—&nbsp;DEMO&nbsp;BUILD&nbsp;·&nbsp;NOT&nbsp;FOR&nbsp;ENGINEERING&nbsp;USE
                    </span>
                </div>
                <span className="hidden lg:inline fsrs-label text-amber-300/80">
                    PRELIMINARY&nbsp;RFP&nbsp;ANALYSIS&nbsp;ONLY&nbsp;·&nbsp;NOT&nbsp;FOR&nbsp;CONSTRUCTION&nbsp;OR&nbsp;CLIENT&nbsp;DELIVERABLES&nbsp;·&nbsp;PE&nbsp;REVIEW&nbsp;REQUIRED
                </span>
                <div className="ml-auto flex items-center gap-3">
                    <AlertOctagon
                        className="w-3.5 h-3.5 text-amber-400"
                        strokeWidth={2}
                    />
                    <span className="fsrs-label text-amber-300/80">
                        v0.9.0-BETA
                    </span>
                </div>
            </div>
        </div>
    );
}
