// V2.3 — Floating "Need Help?" button for the Studio workbench.
// Bottom-right anchored, mailto: handler with subject prefilled.
import { LifeBuoy } from "lucide-react";

const SUPPORT_EMAIL = "support@fsr-studio.com";

export default function NeedHelpButton({ subject = "FSRS Studio — Need Help" }) {
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    return (
        <a
            href={href}
            className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 border border-emerald-400/50 bg-black/85 backdrop-blur px-4 py-2.5 text-emerald-200 hover:text-white hover:border-emerald-300 hover:bg-emerald-400/[0.12] shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_0_24px_-8px_rgba(16,185,129,0.55)] transition-colors fsrs-mono text-lg tracking-wider font-bold uppercase"
            data-testid="studio-need-help-button"
            aria-label="Need help — email support"
        >
            <LifeBuoy className="w-3.5 h-3.5" strokeWidth={2} />
            Need&nbsp;Help?
        </a>
    );
}
