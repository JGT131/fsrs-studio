// Shared shell for marketing sub-pages.
// Provides persistent TopNav + Footer + SignupModal CTA wiring so every
// page (/how-it-works, /pricing, /examples, /testimonials) feels identical.
import { useState } from "react";
import TopNav from "@/components/founding/TopNav";
import Footer from "@/components/founding/Footer";
import SignupModal from "@/components/founding/SignupModal";
import LegalDisclaimerModal from "@/components/founding/LegalDisclaimerModal";

export default function PageShell({ children, footerClaim }) {
    const [modalOpen, setModalOpen] = useState(false);
    return (
        <main className="min-h-screen bg-black text-white selection:bg-red-500/30 selection:text-white">
            <TopNav onCtaClick={() => setModalOpen(true)} />
            {children}
            <Footer onCtaClick={() => setModalOpen(true)} />
            <SignupModal open={modalOpen} onOpenChange={setModalOpen} />
            <LegalDisclaimerModal />
        </main>
    );
}
