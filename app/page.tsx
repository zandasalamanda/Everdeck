import type { Metadata } from "next";

import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/sections/HowItWorks";
import Features from "@/components/marketing/sections/Features";
import TodaysHand from "@/components/marketing/sections/TodaysHand";
import Testimonial from "@/components/marketing/sections/Testimonial";
import Pricing from "@/components/marketing/sections/Pricing";
import Faq from "@/components/marketing/sections/Faq";
import FinalCta from "@/components/marketing/sections/FinalCta";
import Footer from "@/components/marketing/sections/Footer";

export const metadata: Metadata = {
  title: "Everdeck — Show up with the website already built.",
  description:
    "Everdeck finds local businesses with weak or missing websites, designs a better one, and drafts the outreach — so you pitch with the work already done.",
};

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
