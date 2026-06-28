import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function PostDemoCTA({ open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="!rounded-none !p-0 !max-w-xl !border-white/15 !bg-black"
                data-testid="post-demo-cta"
            >
                <div className="relative">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

                    <div className="px-7 pt-7 pb-5 border-b border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2} />
                            <span className="fsrs-overline text-emerald-400">
                                DEMO&nbsp;EXPORT&nbsp;DOWNLOADED
                            </span>
                        </div>
                        <DialogTitle asChild>
                            <h3 className="fsrs-heading text-white text-2xl tracking-tight leading-tight">
                                Impressed? Start your{" "}
                                <span className="text-red-500">Founding Beta Trial</span>{" "}
                                — Real AI processing enabled.
                            </h3>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <p className="mt-3 fsrs-mono text-slate-400 text-base leading-relaxed">
                                What you just experienced was a{" "}
                                <span className="text-white">realistic simulation</span>.
                                Real results on your own drawings use the same
                                workflow — only faster and more powerful.
                            </p>
                        </DialogDescription>
                    </div>

                    <div className="px-7 py-5 space-y-3">
                        <Row k="What you tried" v="Pre-loaded Garage Project · simulated outputs" demo />
                        <Row k="What you get on Founding Beta" v="Real uploads · 10 SRUs included · $25/extra SRU · no hard caps" real />
                        <Row k="Price" v="$249 one-time · founder access" real />
                    </div>

                    <div className="px-7 pb-7 flex items-center justify-between gap-4 flex-wrap">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="fsrs-cta-ghost text-lg"
                            data-testid="post-demo-keep-exploring"
                        >
                            Keep exploring demo
                        </button>
                        <Link
                            to="/app"
                            className="fsrs-cta-claim"
                            data-testid="post-demo-upgrade"
                            onClick={() => onOpenChange(false)}
                        >
                            <Sparkles className="w-4 h-4" strokeWidth={2} />
                            Start Founding Beta — $249 one-time
                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Row({ k, v, demo, real }) {
    return (
        <div className="flex items-start justify-between gap-3 py-1">
            <span className="fsrs-label text-slate-500 mt-1">{k}</span>
            <span
                className={`fsrs-mono text-base text-right max-w-[60%] ${demo ? "text-amber-300" : real ? "text-emerald-300" : "text-slate-200"}`}
            >
                {v}
            </span>
        </div>
    );
}
