import { ShieldCheck, Terminal, Headset, GitBranch } from "lucide-react";

const PERKS = [
    {
        icon: ShieldCheck,
        title: "LIFETIME FOUNDING MEMBER BADGE",
        body: "Permanent identifier on your profile and within shared submittals. A signal to clients and AHJs that you helped shape the platform.",
        tag: "STATUS",
    },
    {
        icon: Terminal,
        title: "PRIORITY FEATURE REQUESTS",
        body: "Your tickets jump the queue. Direct line to engineering — propose, vote, and see your requests merged ahead of general release.",
        tag: "ROADMAP",
    },
    {
        icon: Headset,
        title: "DIRECT FOUNDER ACCESS",
        body: "Monthly office hours with the FSRS engineering team. Ask anything — from routing edge-cases to NFPA interpretations.",
        tag: "SUPPORT",
    },
    {
        icon: GitBranch,
        title: "EARLY BUILDS & API ACCESS",
        body: "First in line for the FSRS API, BIM plugin previews, and pre-release builds. Help us decide what ships, and when.",
        tag: "ACCESS",
    },
];

export default function Perks() {
    return (
        <section
            id="perks"
            className="relative border-b border-white/10 bg-black"
            data-testid="perks-section"
        >
            <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
                <div className="grid lg:grid-cols-12 gap-10 mb-14">
                    <div className="lg:col-span-5">
                        <div className="fsrs-overline mb-4">
                            /&nbsp;EXCLUSIVE&nbsp;PERKS
                        </div>
                        <h2 className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
                            BENEFITS THAT
                            <br />
                            DON&apos;T EXPIRE.
                        </h2>
                    </div>
                    <p className="lg:col-span-6 lg:col-start-7 text-slate-400 text-lg leading-relaxed self-end">
                        Beyond pricing — being among the first 100 unlocks a
                        permanent set of advantages, available only to founding
                        members.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 border border-white/10">
                    {PERKS.map((p, i) => (
                        <div
                            key={i}
                            className={`p-8 lg:p-10 relative group hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "md:border-r" : ""} ${i < 2 ? "md:border-b" : ""} ${i === 1 ? "border-t md:border-t-0" : ""} ${i === 2 ? "border-t md:border-t-0" : ""} ${i === 3 ? "border-t md:border-t-0" : ""} border-white/10`}
                            data-testid={`perk-${i}`}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-12 h-12 border border-white/15 flex items-center justify-center group-hover:border-red-500 transition-colors">
                                    <p.icon
                                        className="w-5 h-5 text-red-500"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <span className="fsrs-label text-slate-600">
                                    {p.tag}&nbsp;/&nbsp;{String(i + 1).padStart(2, "0")}
                                </span>
                            </div>
                            <h3 className="fsrs-heading text-white text-xl lg:text-2xl mb-3 tracking-tight">
                                {p.title}
                            </h3>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                {p.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
