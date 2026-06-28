// V1.9 — Centralized SEO copy + reusable JSON-LD schema blocks.
// All long-tail phrases live here so we can tune them in one place.

export const SITE_NAME = "FSRS — Fire Suppression Retrofit Studio";
export const SITE_URL = "https://fsr-studio.com";
export const SITE_LOGO = `${SITE_URL}/favicon.ico`;
export const SITE_TAGLINE =
    "AI fire suppression design assistant for NFPA 13 existing-building sprinkler retrofits — engineered for licensed PE review.";

export const PAGE_SEO = {
    home: {
        title:
            "FSRS | AI Fire Suppression Retrofit Studio for NFPA 13 Projects",
        description:
            "AI-powered tool that helps licensed engineers rapidly evaluate and generate fire suppression retrofit ideas for existing buildings. Florida high-rise specialists — from drawings to useful suggestions. Professional use only.",
        keywords:
            "florida high-rise fire suppression retrofit, nfpa 13 existing building retrofit, ai fire suppression design assistant, how to retrofit existing building with fire sprinklers, florida fire code retrofit deadline 2026, high-rise condo fire code compliance florida",
        canonical: "/",
    },
    pricing: {
        title:
            "FSRS Pricing | Founding Beta $249 | Professional & Firm Plans",
        description:
            "One-time pricing for AI fire suppression retrofit software. Founding Beta at $249 (10 SRUs), Professional at $399, or Firm Plan at $1,499. Transparent usage-based overages. 30-day money-back on higher tiers.",
        keywords:
            "ai fire suppression retrofit software pricing, nfpa 13 existing building retrofit cost, florida high-rise fire suppression retrofit, founding beta $249, professional $399, firm plan $1499",
        canonical: "/pricing",
    },
    howItWorks: {
        title:
            "How FSRS Works | From Existing Drawings to NFPA 13 Retrofit Ideas",
        description:
            "Upload your building drawings and get AI-generated hazard classification, 3D layout suggestions, and hydraulic summaries. Designed as a professional assistant for licensed fire protection engineers. Outputs require PE review.",
        keywords:
            "how to retrofit existing building with fire sprinklers, nfpa 13 existing building retrofit workflow, ai fire suppression design assistant, florida high-rise fire suppression retrofit, hazard classification ai",
        canonical: "/how-it-works",
    },
    examples: {
        title:
            "NFPA 13 Retrofit Examples | High-Rise, Condo & Commercial Projects",
        description:
            "Explore simulated FSRS workflows across 7 building types including Florida high-rises. See AI hazard classification, 3D layouts, and hydraulic results for different occupancies.",
        keywords:
            "nfpa 13 retrofit examples, florida high-rise fire suppression retrofit case studies, condo sprinkler retrofit, commercial fire suppression retrofit, nfpa 13 existing building retrofit",
        canonical: "/examples",
    },
    testimonials: {
        title:
            "Testimonials · Florida Fire Protection Engineers Using FSRS | FSRS",
        description:
            "Hear from licensed Florida fire protection engineers using the AI fire suppression design assistant for high-rise condo fire code compliance and NFPA 13 existing-building sprinkler retrofit projects.",
        canonical: "/testimonials",
    },
    resources: {
        title:
            "FSRS Resources | Florida Fire Code Retrofit Guides & Checklists",
        description:
            "Free resources for fire protection engineers: 2026 Florida high-rise retrofit checklists, NFPA 13 guides, and AI workflow best practices.",
        keywords:
            "florida fire code retrofit deadline 2026, florida high-rise retrofit checklist, nfpa 13 existing building retrofit guide, sb 4-d compliance, sb 154 sprinkler retrofit",
        canonical: "/resources",
    },
};

// ----- Reusable JSON-LD schema generators -----

export function softwareApplicationSchema() {
    return {
        id: "ld-softwareapplication",
        data: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "FSRS — Fire Suppression Retrofit Studio",
            applicationCategory: "BusinessApplication",
            applicationSubCategory:
                "AI fire suppression design assistant for NFPA 13 existing-building sprinkler retrofit",
            operatingSystem: "Web",
            url: SITE_URL,
            description: SITE_TAGLINE,
            offers: [
                {
                    "@type": "Offer",
                    name: "Starter",
                    price: "99.00",
                    priceCurrency: "USD",
                    category: "OneTime",
                },
                {
                    "@type": "Offer",
                    name: "Founding Beta",
                    price: "249.00",
                    priceCurrency: "USD",
                    category: "OneTime",
                },
                {
                    "@type": "Offer",
                    name: "Professional",
                    price: "399.00",
                    priceCurrency: "USD",
                    category: "OneTime",
                },
                {
                    "@type": "Offer",
                    name: "Firm Plan",
                    price: "1499.00",
                    priceCurrency: "USD",
                    category: "OneTime",
                },
            ],
            featureList: [
                "AI hazard classification (NFPA 13)",
                "3D sprinkler layout drafting",
                "Hydraulic summary previews",
                "Watermarked PDF / DXF / IFC exports",
                "Florida SB 4-D and SB 154 retrofit context",
            ],
            audience: {
                "@type": "Audience",
                audienceType:
                    "Licensed Fire Protection Engineers (FPE), NICET-certified designers, fire-protection firms",
            },
        },
    };
}

export function organizationSchema() {
    return {
        id: "ld-organization",
        data: {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "FSRS — Fire Suppression Retrofit Studio",
            url: SITE_URL,
            logo: SITE_LOGO,
            slogan: SITE_TAGLINE,
            sameAs: [],
            contactPoint: [
                {
                    "@type": "ContactPoint",
                    contactType: "engineering inquiries",
                    email: "founders@fsrs.systems",
                    availableLanguage: ["English"],
                },
            ],
        },
    };
}

export function faqSchema(entries) {
    return {
        id: "ld-faq",
        data: {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: entries.map((q) => ({
                "@type": "Question",
                name: q.q,
                acceptedAnswer: { "@type": "Answer", text: q.a },
            })),
        },
    };
}

export function localBusinessSchema({ city, region, slug, areaServed }) {
    return {
        id: `ld-localbusiness-${slug}`,
        data: {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: `FSRS · ${city} Fire Suppression Retrofit Assistant`,
            url: `${SITE_URL}/solutions/${slug}`,
            areaServed: areaServed || [
                { "@type": "City", name: city, containedInPlace: region },
            ],
            description: `AI fire suppression design assistant for ${city} fire protection engineers handling high-rise condo fire code compliance, SB 4-D retrofit, and NFPA 13 existing-building sprinkler retrofit projects.`,
            address: {
                "@type": "PostalAddress",
                addressLocality: city,
                addressRegion: region || "FL",
                addressCountry: "US",
            },
        },
    };
}
