// Compact warning pill used inline in the Hero CTA group.
// Permanent Authenticity rule: must remain sharp + legible but visually
// tight enough to never compete with the primary CTA.
import { AlertTriangle } from "lucide-react";

export default function MiniDisclaimer({
    className = "",
    testId = "mini-disclaimer",
    variant = "pill", // "pill" (default, tight) | "bar" (full-width thin bar)
}) {
    if (variant === "bar") {
        return (
            <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 border-l-2 border-amber-400 bg-amber-400/[0.06] ${className}`}
                data-testid={testId}
                role="note"
            >
                <AlertTriangle
                    className="w-3 h-3 text-amber-400 shrink-0"
                    strokeWidth={2.25}
                />
                <p className="fsrs-mono text-[10.5px] text-amber-200/95 leading-snug tracking-wide whitespace-nowrap">
                    <span className="text-amber-300 font-semibold">
                        INTENDED USE:
                    </span>{" "}
                    preliminary analysis · PE review required
                </p>
            </div>
        );
    }
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none border border-amber-400/50 bg-amber-400/[0.06] text-lg font-mono tracking-wide text-amber-200/95 ${className}`}
            data-testid={testId}
            role="note"
        >
            <AlertTriangle
                className="w-3 h-3 text-amber-400 shrink-0"
                strokeWidth={2.25}
            />
            <span className="text-amber-300 font-semibold">INTENDED USE:</span>
            <span className="hidden sm:inline">
                preliminary analysis · PE review required
            </span>
            <span className="sm:hidden">PE review req.</span>
        </span>
    );
}
