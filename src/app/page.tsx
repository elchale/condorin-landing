import { SiteFooter } from "@/components/brand/SiteFooter";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { DetectsSection } from "@/components/landing/DetectsSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MercurySection } from "@/components/landing/MercurySection";
import { SignInSection } from "@/components/landing/SignInSection";

export default function Home() {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4 text-marca underline">
        Saltar a contenido principal
      </a>
      <Hero />
      <main id="contenido">
        <SignInSection />
        <DetectsSection />
        <HowItWorks />
        <MercurySection />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
