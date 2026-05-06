import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { MarketingForm } from "@/components/marketing-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Calendar, Inbox, ShieldCheck } from "lucide-react";

export default function Home() {
  const formRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-aurora-cyan/30 selection:text-aurora-cyan">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 mix-blend-difference">
        <LiviaWordmark size="md" />
        <button 
          onClick={scrollToForm}
          className="text-sm font-medium text-white/70 hover:text-white transition-colors"
        >
          Join beta
        </button>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24 pb-12">
          {/* Aurora Orb Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              style={{ y: yBg }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aurora-violet/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
              <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-aurora-cyan/15 rounded-full blur-[140px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
              <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-aurora-mint/15 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
            </motion.div>
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium tracking-wide text-aurora-cyan uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-aurora-cyan animate-pulse" />
                Closed Beta Opening Soon
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight leading-[1.1] mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              For barbershops,<br className="hidden md:block" /> tattoo studios,<br className="hidden md:block" /> dental practices —
              <span className="block mt-2 text-white/50 italic text-4xl md:text-6xl lg:text-7xl">and every appointment in between.</span>
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Your studio runs on appointments. So does Livia. We answer the messages you can't, protect the slots you'd lose, and give you back the time to focus on your craft.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <button 
                onClick={scrollToForm}
                className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-aurora-cyan px-8 font-medium text-black transition-transform hover:scale-105 active:scale-95"
              >
                <span className="mr-2">Join the closed beta</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Abstract Product Surface Visual */}
        <section className="py-12 px-6">
          <motion.div 
            className="max-w-5xl mx-auto rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl shadow-aurora-violet/10 relative aurora-glass"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <div className="aspect-[16/9] md:aspect-[21/9] relative bg-[#09090b]">
               <img src={`${import.meta.env.BASE_URL}product-surface.png`} alt="Livia abstract product surface" className="w-full h-full object-cover opacity-80" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
            </div>
          </motion.div>
        </section>

        {/* Pillars Section */}
        <section className="py-32 px-6 bg-background relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-20 md:mb-32 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-serif mb-6 tracking-tight">A quietly brilliant operations partner.</h2>
              <p className="text-muted-foreground text-lg">Built for owners in the EU and Ireland who are tired of stitching together five different SaaS tools to run a small studio.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-aurora-cyan">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-medium mb-3">AI Inbox</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A Livia AI replies to customer messages instantly — across SMS today, with WhatsApp and Instagram joining at public launch — and books them into your calendar without you lifting a finger.
                </p>
              </motion.div>

              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-aurora-mint">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-medium mb-3">Revenue Protection</h3>
                <p className="text-muted-foreground leading-relaxed">
                  End the pain of empty chairs. Beautifully timed booking reminders and smart no-show recovery, with deposit-ready scheduling rolling out at public launch.
                </p>
              </motion.div>

              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-aurora-violet">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-medium mb-3">Owner Cockpit</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every shop's day, week, and money in one calm, precise view. Stop opening three apps just to see how the day is going.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-32 px-6 bg-[#0a0a0c] border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.05),transparent_50%)] pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-serif mb-6 tracking-tight">Simple, European pricing.</h2>
              <p className="text-muted-foreground text-lg">No hidden fees. VAT handled clearly.</p>
              <p className="text-muted-foreground/70 text-sm mt-3">Pricing locks at public launch — closed beta is on the house.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Solo */}
              <div className="p-8 rounded-3xl border border-white/10 bg-white/5 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-white/80 mb-2">Solo</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold">€49</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-muted-foreground"><span className="text-aurora-cyan mt-1">✦</span> 1 staff member</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><span className="text-aurora-cyan mt-1">✦</span> Calendar & Bookings</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><span className="text-aurora-cyan mt-1">✦</span> Standard Reminders</li>
                </ul>
              </div>

              {/* Studio (Recommended) */}
              <div className="p-8 rounded-3xl border border-aurora-cyan/30 bg-aurora-cyan/5 flex flex-col h-full relative transform md:scale-105 shadow-2xl shadow-aurora-cyan/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-aurora-cyan text-black px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Recommended
                </div>
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-white mb-2">Studio</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-semibold text-aurora-cyan">€99</span>
                    <span className="text-white/60">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-white/90"><span className="text-aurora-cyan mt-1">✦</span> Up to 5 staff members</li>
                  <li className="flex items-start gap-3 text-white/90"><span className="text-aurora-cyan mt-1">✦</span> Full AI Inbox & Auto-booking</li>
                  <li className="flex items-start gap-3 text-white/90"><span className="text-aurora-cyan mt-1">✦</span> Advanced Revenue Protection</li>
                  <li className="flex items-start gap-3 text-white/90"><span className="text-aurora-cyan mt-1">✦</span> Deposit-ready (rolls out at public launch)</li>
                </ul>
              </div>

              {/* Atelier */}
              <div className="p-8 rounded-3xl border border-white/10 bg-white/5 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-white/80 mb-2">Atelier</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold">€149</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-muted-foreground"><span className="text-aurora-cyan mt-1">✦</span> Unlimited staff</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><span className="text-aurora-cyan mt-1">✦</span> Multi-location support</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><span className="text-aurora-cyan mt-1">✦</span> Priority Support</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><span className="text-aurora-cyan mt-1">✦</span> Dedicated Onboarding</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 px-6 max-w-4xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">Questions & Answers</h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">What exactly is Livia?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Livia is an operating system built specifically for European service businesses. It pairs your calendar with an AI assistant that answers customer messages and books appointments, in one calm interface. Payments and no-show deposits roll out at public launch.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">Who is Livia for?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Barbershops, tattoo studios, dental practices, beauty clinics, physiotherapists — anyone whose calendar is their revenue. If you answer the door at 9am, Livia is built for you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">How is it different from Booksy, Fresha, or Square?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                We aren't a marketplace trying to own your customers, and we aren't a generic POS. Livia is an AI-native partner that actively works your inbox, books clients, and protects your time, designed with European craft businesses in mind.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">How does the AI handle bookings?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Today, when a client texts your shop's number, Livia replies conversationally, checks your real-time availability, and securely books them into your calendar — speaking your brand's tone and respecting your specific booking rules. WhatsApp and Instagram inbound join at public launch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">When does the closed beta open?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                We are currently onboarding a select group of studios in the EU and Ireland. Join the waitlist, and we'll invite batches of businesses in on a rolling basis to ensure a premium onboarding experience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">Are you GDPR and EU AI Act compliant?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Yes. Livia is built in Europe, for Europe. We adhere to GDPR for all customer data and align with EU AI Act Art. 50 — every Liv-authored message identifies itself as AI. EU data residency rolls out at general availability; closed beta runs on the same EU-region infrastructure we'll lock for launch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">How does pricing and VAT work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Pricing locks at public launch with a flat monthly fee per tier — closed beta is on the house. If you have a valid EU VAT number, the reverse-charge mechanism will apply at launch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-white/10 px-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-aurora-cyan transition-colors">How do I get in?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Drop your email in the form below. We review every application and will reach out when a spot opens up that fits your studio type.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Founder Note & CTA */}
        <section className="py-32 px-6 relative" ref={formRef}>
          <div className="absolute inset-0 bg-[#09090b] pointer-events-none">
            <img src={`${import.meta.env.BASE_URL}aurora-abstract.png`} alt="" className="w-full h-full object-cover opacity-20 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <div className="max-w-3xl mx-auto relative z-10 text-center">
            <div className="mb-20 text-left md:text-center max-w-2xl mx-auto aurora-glass p-8 md:p-12 rounded-[2rem]">
              <p className="text-lg md:text-xl leading-relaxed text-white/90 mb-8 font-serif italic">
                "We built this because the European craft economy deserves better software. You shouldn't need an IT degree to run a barbershop, and you shouldn't lose revenue because you were too busy working to check Instagram. Livia is our answer to that — a tool that works as hard as you do."
              </p>
              <p className="text-foreground/80 font-medium">— The Livia team</p>
            </div>

            <div className="mt-24">
              <h2 className="text-3xl md:text-5xl font-serif mb-8">Ready to step into the calm?</h2>
              <MarketingForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-12 px-6 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <LiviaWordmark size="sm" className="opacity-80 hover:opacity-100 transition-opacity" />
            <span className="text-muted-foreground">© 2026 Livia</span>
          </div>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">DPA</a>
            <a href="#" className="hover:text-white transition-colors">Imprint</a>
          </div>

          <div className="flex items-center gap-5 text-muted-foreground">
            <a
              href="#"
              aria-label="Livia on X"
              className="hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-5 h-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Livia on LinkedIn"
              className="hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-5 h-5 fill-current">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.778 13.019H3.555V9h3.56v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Livia on Instagram"
              className="hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-5 h-5 fill-current">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>

          <div className="text-muted-foreground/60 text-xs">
            Made with care in Dublin
          </div>
        </div>
      </footer>
    </div>
  );
}
