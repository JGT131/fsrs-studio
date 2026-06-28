const ITEMS = [
    "NFPA 13",
    "NFPA 13R",
    "NFPA 13D",
    "HYDRAULIC CALCS",
    "BIM EXPORT",
    "IFC / DWG",
    "AS-BUILT SCAN",
    "PE-REVIEW READY",
    "RETROFIT OPTIMIZED",
    "OCCUPANCY HAZARD CLASS",
    "SEISMIC BRACING",
];

export default function Marquee() {
    const doubled = [...ITEMS, ...ITEMS];
    return (
        <div
            className="border-y border-white/10 bg-black overflow-hidden"
            data-testid="capability-marquee"
        >
            <div className="flex fsrs-marquee whitespace-nowrap py-4">
                {doubled.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-6 px-6 fsrs-label text-slate-500"
                    >
                        <span className="text-red-500">+</span>
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
