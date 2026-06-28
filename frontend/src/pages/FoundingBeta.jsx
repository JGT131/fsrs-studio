import { useState } from "react";
import TopNav from "@/components/founding/TopNav";
import Hero from "@/components/founding/Hero";
import Footer from "@/components/founding/Footer";
import SignupModal from "@/components/founding/SignupModal";
import LegalDisclaimerModal from "@/components/founding/LegalDisclaimerModal";
import SeoHead from "@/components/seo/SeoHead";
import {
    PAGE_SEO,
    softwareApplicationSchema,
    organizationSchema,
} from "@/lib/seo";

// Multi-page architecture: the home page is a clean Hero entrypoint.
// Process Flow (/how-it-works), Examples (/examples), Pricing (/pricing),
// and Testimonials (/testimonials) all live on their own dedicated
// routes — see App.js.
export default function FoundingBeta() {
    const [modalOpen, setModalOpen] = useState(false);
    const openModal = () => setModalOpen(true);

    return (
        <main
            className="relative min-h-screen bg-black text-slate-100"
            data-testid="founding-beta-page"
        >
            <SeoHead
                {...PAGE_SEO.home}
                jsonLd={[softwareApplicationSchema(), organizationSchema()]}
            />
            <TopNav onCtaClick={openModal} />
            <Hero onCtaClick={openModal} />
            <Footer onCtaClick={openModal} />
            <SignupModal open={modalOpen} onOpenChange={setModalOpen} />
            <LegalDisclaimerModal />
        </main>
    );
}
