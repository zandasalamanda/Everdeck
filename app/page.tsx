import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/sections/HowItWorks";
import Features from "@/components/marketing/sections/Features";
import TodaysHand from "@/components/marketing/sections/TodaysHand";
import Testimonial from "@/components/marketing/sections/Testimonial";
import Pricing from "@/components/marketing/sections/Pricing";
import Faq from "@/components/marketing/sections/Faq";
import FinalCta from "@/components/marketing/sections/FinalCta";
import Footer from "@/components/marketing/sections/Footer";

export default function MarketingPage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Features />
      <TodaysHand />
      <Testimonial />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
