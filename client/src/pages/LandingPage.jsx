import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import ExecutionMonitoring from "../components/landing/ExecutionMonitoring";
import Integrations from "../components/landing/Integrations";
import DeveloperFeatures from "../components/landing/DeveloperFeatures";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />

      <main>
        <Hero />
        <HowItWorks />
        <ExecutionMonitoring />
        <Integrations />
        <DeveloperFeatures />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;