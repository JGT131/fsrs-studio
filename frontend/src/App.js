import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FoundingBeta from "@/pages/FoundingBeta";
import Studio from "@/pages/Studio";
import Gateway from "@/pages/Gateway";
import ExampleLibrary from "@/pages/ExampleLibrary";
import HowItWorksPage from "@/pages/HowItWorksPage";
import PricingPage from "./pages/PricingPage";
import TermsPage from "./pages/TermsPage";
import TestimonialsPage from "@/pages/TestimonialsPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ResourcesIndex from "@/pages/ResourcesIndex";
import FloridaChecklistArticle from "@/pages/FloridaChecklistArticle";
import SolutionsCity from "@/pages/SolutionsCity";
import SupportPage from "@/pages/SupportPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import FreeSamplePage from "@/pages/FreeSamplePage";
import FreeSampleSuccessPage from "@/pages/FreeSampleSuccessPage";
import { Toaster } from "@/components/ui/sonner";
import { installAxiosClientId } from "@/lib/clientId";

installAxiosClientId();

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<FoundingBeta />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/examples" element={<ExampleLibrary />} />
                    <Route path="/pricing" element={<PricingPage />} />
<Route path="/terms" element={<TermsPage />} />
                    <Route path="/testimonials" element={<TestimonialsPage />} />
                    <Route path="/studio" element={<Studio />} />
                    <Route path="/app" element={<Gateway />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/resources" element={<ResourcesIndex />} />
                    <Route
                        path="/resources/florida-high-rise-fire-code-retrofit-checklist-2026"
                        element={<FloridaChecklistArticle />}
                    />
                    <Route path="/solutions/:slug" element={<SolutionsCity />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/payments/success" element={<PaymentSuccessPage />} />
                    <Route path="/free-sample" element={<FreeSamplePage />} />
                    <Route
                        path="/free-sample/success"
                        element={<FreeSampleSuccessPage />}
                    />
                </Routes>
            </BrowserRouter>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#f8fafc",
                        fontFamily: "JetBrains Mono, monospace",
                        borderRadius: 0,
                    },
                }}
            />
        </div>
    );
}

export default App;
