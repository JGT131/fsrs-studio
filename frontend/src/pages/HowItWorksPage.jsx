import PageShell from "@/components/founding/PageShell";
import HowItWorks from "@/components/founding/HowItWorks";
import SeoHead from "@/components/seo/SeoHead";
import {
    PAGE_SEO,
    softwareApplicationSchema,
    organizationSchema,
    faqSchema,
} from "@/lib/seo";

const HOW_FAQS = [
    {
        q: "What does FSRS actually do?",
        a: "FSRS is an AI fire suppression design assistant. It ingests existing-building drawings, proposes NFPA 13 hazard classifications, drafts a 3D sprinkler layout, generates a preliminary hydraulic summary, and outputs watermarked PDF / DXF / IFC packages for PE review.",
    },
    {
        q: "Does FSRS replace a licensed Fire Protection Engineer?",
        a: "No. FSRS only accelerates the preliminary drafting phase. Every output is watermarked SIMULATED / PRELIMINARY / NOT FOR ENGINEERING USE and requires licensed PE review, modification, and stamping before any submittal.",
    },
    {
        q: "Which Florida regulations does FSRS support?",
        a: "FSRS provides workflow context for Florida high-rise fire suppression retrofit under SB 4-D (structural integrity inspections, 2022) and SB 154 (sprinkler retrofit). NFPA 13 / 13R / 13D references appear throughout the Studio.",
    },
    {
        q: "How long does a typical FSRS draft take?",
        a: "A typical small high-rise retrofit zone (≤5,000 sf, ordinary hazard) takes a few minutes to draft inside the Studio, plus a Confirm & Process step before any watermarked export. Larger projects scale to multiple Standard Retrofit Units (SRUs).",
    },
];

export default function HowItWorksPage() {
    return (
        <PageShell>
            <SeoHead
                {...PAGE_SEO.howItWorks}
                jsonLd={[
                    softwareApplicationSchema(),
                    organizationSchema(),
                    faqSchema(HOW_FAQS),
                ]}
            />
            <HowItWorks />
        </PageShell>
    );
}
