import Hero from "./components/Hero";
import HowItWorks from "./components/sections/HowItWorks";
import Features from "./components/sections/Features";
import TodaysHand from "./components/sections/TodaysHand";
import Testimonial from "./components/sections/Testimonial";
import Pricing from "./components/sections/Pricing";
import Faq from "./components/sections/Faq";
import FinalCta from "./components/sections/FinalCta";
import Footer from "./components/sections/Footer";

export default function App() {
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
