// Plan C — Compact case-study strip on the landing page.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
    Building2, Warehouse, Hotel, ShoppingBag, Car, UtensilsCrossed, Hammer,
    ArrowUpRight, FlaskConical,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICONS = {
    "highrise-condo": Building2,
    "warehouse": Warehouse,
    "hotel": Hotel,
    "retail-mall": ShoppingBag,
    "parking-garage": Car,
    "restaurant": UtensilsCrossed,
    "woodshop": Hammer,
};

export default function ExampleStrip() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        axios.get(`${API}/studio/case-studies`)
            .then((r) => setItems(r.data.items))
            .catch(() => {});
    }, []);
    if (!items.length) return null;
    return (
        <section
            id="examples"
            className="relative border-b border-white/10 bg-black"
            data-testid="example-strip-section"
        >
            <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 lg:py-20">
                <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
                    <div>
                        <div className="fsrs-overline mb-4 flex items-center gap-3">
                            <FlaskConical className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
                            /&nbsp;EXAMPLE&nbsp;LIBRARY&nbsp;·&nbsp;SIMULATED
                        </div>
                        <h2 className="fsrs-heading text-white text-3xl sm:text-4xl lg:text-5xl leading-[0.95]">
                            NFPA&nbsp;13 ACROSS&nbsp;
                            <span className="text-red-500">{items.length}</span>
                            &nbsp;BUILDING TYPES.
                        </h2>
                    </div>
                    <Link
                        to="/examples"
                        className="fsrs-cta-ghost"
                        data-testid="strip-view-all"
                    >
                        View full library&nbsp;↗
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border border-white/10">
                    {items.map((it, i) => {
                        const Icon = ICONS[it.id] || Building2;
                        return (
                            <Link
                                key={it.id}
                                to={`/examples`}
                                onClick={(e) => {
                                    /* allow normal nav; selected state set on /examples */
                                }}
                                className={`group relative p-4 lg:p-5 hover:bg-red-500/[0.06] transition-colors ${i < items.length - 1 ? "lg:border-r" : ""} ${i % 2 === 1 ? "md:border-l-0" : ""} md:border-r ${i >= 2 ? "md:border-t lg:border-t-0" : ""} ${i >= 4 ? "lg:border-t" : ""} border-white/10 outline-none focus-visible:bg-red-500/[0.06]`}
                                data-testid={`strip-card-${it.id}`}
                            >
                                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-8 h-8 border border-white/15 flex items-center justify-center group-hover:border-red-500">
                                        <Icon className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                                    </div>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-red-500 transition-colors" strokeWidth={2} />
                                </div>
                                <div className="fsrs-mono text-white text-base font-bold mb-1 leading-tight">
                                    {it.building_type}
                                </div>
                                <div className="fsrs-label text-slate-500 mb-3">
                                    {it.sqft.toLocaleString()}&nbsp;SF&nbsp;·&nbsp;{it.stories}{it.stories === 1 ? "S" : "S"}
                                </div>
                                <div className="fsrs-label text-red-500 leading-snug">
                                    {it.occupancy_hazard.replace("Ordinary Hazard, ", "OH-").replace("Extra Hazard, ", "EH-").replace("Light Hazard", "LIGHT").replace("Group ", "")}
                                </div>
                            </Link>
                        );
                    })}
                </div>
                <p className="mt-4 fsrs-mono text-slate-600 text-lg">
                    Public access · all examples use SIMULATED data · click any card to view the full workflow.
                </p>
            </div>
        </section>
    );
}
