import { ArrowRight } from "lucide-react";
import MiniDisclaimer from "@/components/founding/MiniDisclaimer";

export default function FinalCTA({ onCtaClick }) {
    return (
        <section
            className="relative border-b border-white/10 bg-black overflow-hidden"
            data-testid="final-cta-section"
        >
            <div className="absolute inset-0 fsrs-grid-bg opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/[0.04] to-transparent" />

            <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
                <div className="border border-white/10 p-8 lg:p-16 bg-black/60 backdrop-blur relative">
                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

                    <div className="grid lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-8">
                            <div className="fsrs-overline mb-4">
                                /&nbsp;READY&nbsp;TO&nbsp;COMMIT?
                            </div>
                            <h2 className="fsrs-heading text-white text-3xl sm:text-4xl lg:text-5xl leading-[1.05]">
                                JOIN THE&nbsp;
                                <span className="text-red-500">FOUNDING&nbsp;BETA</span>
                                <span className="text-slate-500">&nbsp;—&nbsp;</span>
                                <br className="hidden lg:block" />
                                FIRST 100 ENGINEERS LOCK IN&nbsp;
                                <span className="text-white whitespace-nowrap">
                                    $249&nbsp;ONE-TIME
                                </span>
                                &nbsp;FOUNDING RATE.
                            </h2>
                            <p className="mt-6 text-slate-400 text-lg max-w-xl leading-relaxed">
                                The window closes in 30 days or at 100 seats —
                                whichever comes first. Lock in $249 one-time access with
                                10 SRUs included, save 20+ hours per retrofit, and
                                keep your lifetime founder benefits forever.
                            </p>
                        </div>
                        <div className="lg:col-span-4 flex flex-col lg:items-end">
                            <MiniDisclaimer testId="final-cta-mini-disclaimer" className="lg:max-w-sm" />
                            <button
                                onClick={onCtaClick}
                                className="fsrs-cta-claim w-full lg:w-auto justify-center"
                                data-testid="final-cta-button"
                            >
                                Claim My Founding Spot
                                <ArrowRight
                                    className="w-4 h-4"
                                    strokeWidth={2}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
