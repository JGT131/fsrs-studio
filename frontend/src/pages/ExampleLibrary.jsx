import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNav from "@/components/founding/TopNav";
import Footer from "@/components/founding/Footer";
import LegalDisclaimerModal from "@/components/founding/LegalDisclaimerModal";
import SignupModal from "@/components/founding/SignupModal";
import SeoHead from "@/components/seo/SeoHead";
import CategoryFilter, { CATEGORIES } from "@/components/founding/CategoryFilter";
import { CASE_STUDIES } from "@/lib/caseStudies";
import {
    PAGE_SEO,
    softwareApplicationSchema,
    organizationSchema,
} from "@/lib/seo";
import {
    Building2, Warehouse, Hotel, ShoppingBag, Car, UtensilsCrossed,
    Hammer, ArrowRight, FlaskConical, Cpu, Boxes, Activity, Loader2,
} from "lucide-react";

const ICONS = {
    "highrise-residential": Building2,
    "parking-garage-mechanical": Car,
    "hotel-hospitality": Hotel,
};

export default function ExampleLibrary() {
    const [selected, setSelected] = useState(CASE_STUDIES[0].id);
    const [modalOpen, setModalOpen] = useState(false);
    const [filter, setFilter] = useState("ALL");
    const navigate = useNavigate();

    const detail = useMemo(() => CASE_STUDIES.find(i => i.id === selected), [selected]);

    const itemCategories = (it) => {
        const cats = new Set();
        const bt = (it.building_type || "").toLowerCase();
        const stories = it.stories || 1;
        if (stories >= 4 || /high.?rise/.test(bt)) cats.add("HIGH-RISE");
        if (/residen|condo|apartment/.test(bt)) cats.add("RESIDENTIAL");
        if (/garage|mechanical/.test(bt)) cats.add("WAREHOUSE");
        cats.add("ALL");
        return cats;
    };

    const filtered = useMemo(() => 
        CASE_STUDIES.filter(it => filter === "ALL" || itemCategories(it).has(filter)),
    [filter]);

    const counts = useMemo(() => {
        const c = {};
        for (const cat of CATEGORIES) {
            c[cat.key] = cat.key === "ALL" ? CASE_STUDIES.length : CASE_STUDIES.filter(it => itemCategories(it).has(cat.key)).length;
        }
        return c;
    }, []);

    return (
        <main className="min-h-screen bg-black text-slate-100 flex flex-col">
            <SeoHead {...PAGE_SEO.examples} jsonLd={[softwareApplicationSchema(), organizationSchema()]} />
            <TopNav onCtaClick={() => setModalOpen(true)} />
            <div className="border-b-2 border-amber-500 bg-amber-500/10">
                <div className="mx-auto max-w-[1500px] px-6 py-3 flex items-center gap-3">
                    <FlaskConical className="w-4 h-4 text-amber-400" />
                    <span className="fsrs-mono text-amber-200 font-bold text-base sm:text-lg">SIMULATED EXAMPLE LIBRARY — SAMPLE DATA ONLY</span>
                </div>
            </div>
            <div className="mx-auto w-full max-w-[1500px] px-6 lg:px-10 py-10 flex-1">
                <div className="mb-10">
                    <h1 className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl">SEE NFPA 13 ACROSS <span className="text-red-500">BUILDING TYPES</span>.</h1>
                </div>
                <CategoryFilter active={filter} onChange={setFilter} counts={counts} />
                <div className="grid lg:grid-cols-12 gap-6 mt-8">
                    <div className="lg:col-span-5 grid sm:grid-cols-1 gap-3 self-start">
                        {filtered.map((it) => {
                            const Icon = ICONS[it.id] || Building2;
                            const active = selected === it.id;
                            return (
                                <button key={it.id} onClick={() => setSelected(it.id)} className={`text-left p-4 border transition-all ${active ? "border-red-500 bg-red-500/5" : "border-white/10 hover:border-white/30"}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <Icon className={`w-5 h-5 ${active ? "text-red-500" : "text-slate-400"}`} />
                                        <span className="fsrs-label text-slate-500">{it.sqft.toLocaleString()} SF</span>
                                    </div>
                                    <div className="fsrs-heading text-white text-lg">{it.name}</div>
                                    <div className="fsrs-label text-red-500 mt-2">{it.occupancy_hazard}</div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="lg:col-span-7 border border-white/10 bg-black p-6 min-h-[600px]">
                        {detail && (
                            <>
                                <h2 className="fsrs-heading text-white text-3xl mb-4">{detail.name}</h2>
                                <Section title="01 · AI HAZARD CLASSIFICATION" icon={Cpu}>
                                    <DRow k="Occupancy" v={detail.classification.occupancy_hazard} />
                                    <DRow k="Rationale" v={detail.classification.rationale} />
                                </Section>
                                <Section title="02 · 3D LAYOUT SUMMARY" icon={Boxes}>
                                    <DRow k="Main Ø" v={`${detail.layout.main_pipe_diameter_in}″`} />
                                    <DRow k="Heads" v={String(detail.layout.head_count)} />
                                </Section>
                                <Section title="03 · HYDRAULIC SUMMARY" icon={Activity}>
                                    <DRow k="Req. flow" v={`${detail.hydraulics.required_flow_gpm} gpm`} big />
                                    <DRow k="Status" v={detail.hydraulics.status} />
                                </Section>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer onCtaClick={() => setModalOpen(true)} />
            <SignupModal open={modalOpen} onOpenChange={setModalOpen} />
            <LegalDisclaimerModal />
        </main>
    );
}

function Section({ title, icon: Icon, children }) {
    return (
        <div className="mb-6 pb-6 border-b border-white/10 last:border-b-0">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-red-500" />
                <span className="fsrs-label text-slate-400 font-bold">{title}</span>
            </div>
            <div className="space-y-1">{children}</div>
        </div>
    );
}

function DRow({ k, v, big }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="fsrs-label text-slate-500">{k}</span>
            <span className={`fsrs-mono text-slate-100 ${big ? "text-base font-bold" : "text-base text-right"}`}>{v}</span>
        </div>
    );
}
