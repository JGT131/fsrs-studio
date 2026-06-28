import PageShell from "@/components/founding/PageShell";
import Pricing from "@/components/founding/Pricing";
import SeoHead from "@/components/seo/SeoHead";
import {
    PAGE_SEO,
    softwareApplicationSchema,
    organizationSchema,
    faqSchema,
} from "@/lib/seo";

const PRICING_FAQS = [
    {
        q: "What is a Standard Retrofit Unit (SRU)?",
        a: "An SRU is the metered unit consumed when you export a finalized watermarked report from FSRS. One SRU roughly maps to an ordinary-hazard zone of 5,000 sf. Larger or more complex projects scale to multiple SRUs.",
    },
    {
        q: "How does the tiered overage pricing work?",
        a: "After your plan's included SRUs are used, additional consumption is billed at $25/SRU for the first 10 extras, $22/SRU for the 11th through 50th, and $18/SRU thereafter. The blended rate is shown pre-export so you always confirm before any deduction.",
    },
    {
        q: "What does the 30-Day Money-Back Guarantee cover?",
        a: "Professional ($399) and Firm ($1,499) tiers include a 30-Day Money-Back Guarantee. As long as no exports have been generated against the account, the one-time purchase is fully refundable within 30 days.",
    },
    {
        q: "Is there a subscription fee?",
        a: "No. All four tiers (Starter, Founding Beta, Professional, Firm) are one-time purchases. Optional annual Support & Updates are available on Professional ($149/year) and Firm ($349/year).",
    },
    {
        q: "Are FSRS outputs ready for permit submission?",
        a: "No. FSRS is an AI fire suppression design assistant. Every export is preliminary, watermarked, and requires licensed Professional Engineer review, modification, and stamping before any permit submission, fabrication, or installation.",
    },
];

export default function PricingPage() {
    return (
        <PageShell>
            <SeoHead
                {...PAGE_SEO.pricing}
                jsonLd={[
                    softwareApplicationSchema(),
                    organizationSchema(),
                    faqSchema(PRICING_FAQS),
                ]}
            />
            <Pricing />
        </PageShell>
    );
}
