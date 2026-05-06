import React from 'react';
import './Atelier.css';

export function Atelier() {
  return (
    <div className="atelier-brand flex flex-col w-full text-base selection:bg-[#782D24] selection:text-white">
      {/* 1. Hero Band */}
      <section className="min-h-[80vh] flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto w-full">
          <p className="text-[var(--at-accent)] text-sm tracking-[0.2em] uppercase mb-8 font-medium">Livia Brand Identity</p>
          <h1 className="display-font text-8xl md:text-9xl font-medium tracking-tight mb-8">Livia.</h1>
          <div className="max-w-2xl">
            <h2 className="display-font text-4xl md:text-5xl text-[var(--at-ink-muted)] italic mb-6">Care, made effortless.</h2>
            <p className="text-xl text-[var(--at-ink)] font-light leading-relaxed">
              An editorial, considered operating system for premium service businesses. 
              Designed to feel like a high-end atelier—warm, precise, and deeply crafted.
            </p>
          </div>
        </div>
      </section>

      {/* Grid container for content */}
      <div className="max-w-6xl mx-auto w-full px-8 md:px-16 lg:px-24 pb-32 flex flex-col gap-32">
        
        {/* 2. Logo System */}
        <section>
          <div className="thin-rule pb-4 mb-12 flex justify-between items-end">
            <h3 className="ui-font text-xs uppercase tracking-widest text-[var(--at-ink-muted)]">01 / Logo System</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="aspect-[4/3] bg-[var(--at-surface)] thin-border flex items-center justify-center p-8">
              <span className="display-font text-6xl font-medium">Livia.</span>
            </div>
            <div className="aspect-[4/3] bg-[var(--at-ink)] text-[var(--at-surface)] flex items-center justify-center p-8">
              <span className="display-font text-6xl font-medium">Livia.</span>
            </div>
            <div className="aspect-[4/3] bg-[var(--at-accent)] text-[var(--at-bg)] flex items-center justify-center p-8">
              <span className="display-font text-7xl font-medium italic">bq</span>
            </div>
          </div>
        </section>

        {/* 3. Color Palette */}
        <section>
          <div className="thin-rule pb-4 mb-12 flex justify-between items-end">
            <h3 className="ui-font text-xs uppercase tracking-widest text-[var(--at-ink-muted)]">02 / Color Palette</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <ColorSwatch name="Bone" hex="#F9F8F6" role="Background" bg="var(--at-bg)" border="var(--at-border)" />
            <ColorSwatch name="Surface" hex="#FFFFFF" role="Cards & Panels" bg="var(--at-surface)" border="var(--at-border)" />
            <ColorSwatch name="Deep Ink" hex="#2A2826" role="Primary Text" bg="var(--at-ink)" text="white" />
            <ColorSwatch name="Oxblood" hex="#782D24" role="Accent / Brand" bg="var(--at-accent)" text="white" />
            <ColorSwatch name="Forest" hex="#3D5A45" role="Success" bg="var(--at-success)" text="white" />
          </div>
        </section>

        {/* 4. Typography */}
        <section>
          <div className="thin-rule pb-4 mb-12 flex justify-between items-end">
            <h3 className="ui-font text-xs uppercase tracking-widest text-[var(--at-ink-muted)]">03 / Typography</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--at-ink-muted)] mb-8">Display — Cormorant Garamond</p>
              <div className="space-y-8 text-[var(--at-ink)]">
                <div className="display-font text-6xl font-medium">Aa Ee Rr Ss</div>
                <div className="display-font text-4xl italic">Care, made effortless.</div>
                <div className="display-font text-2xl font-light">The quick brown fox jumps over the lazy dog.</div>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--at-ink-muted)] mb-8">UI & Body — DM Sans</p>
              <div className="space-y-8 text-[var(--at-ink)]">
                <div className="ui-font text-4xl font-medium tracking-tight">Aa Ee Rr Ss</div>
                <div className="ui-font text-xl">Precise, readable, contemporary.</div>
                <div className="ui-font text-sm leading-relaxed text-[var(--at-ink-muted)]">
                  Used for all functional interface elements, numbers, and dense data. It provides a clean, 
                  modern counterpoint to the editorial serif, ensuring the application remains highly usable.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. UI Primitives */}
        <section>
          <div className="thin-rule pb-4 mb-12 flex justify-between items-end">
            <h3 className="ui-font text-xs uppercase tracking-widest text-[var(--at-ink-muted)]">04 / Interface Primitives</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5 space-y-12">
              {/* Buttons */}
              <div className="space-y-6">
                <h4 className="text-sm font-medium">Buttons</h4>
                <div className="flex flex-wrap gap-4 items-center">
                  <button className="bg-[var(--at-ink)] text-white px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black">
                    Book Appointment
                  </button>
                  <button className="bg-[var(--at-surface)] text-[var(--at-ink)] px-6 py-2.5 text-sm font-medium thin-border transition-colors hover:bg-[var(--at-bg)]">
                    Manage Schedule
                  </button>
                  <button className="text-[var(--at-ink-muted)] px-4 py-2.5 text-sm font-medium transition-colors hover:text-[var(--at-ink)]">
                    Cancel
                  </button>
                </div>
              </div>
              {/* Inputs */}
              <div className="space-y-6">
                <h4 className="text-sm font-medium">Inputs & Controls</h4>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--at-ink-muted)]">Client Name</label>
                    <input 
                      type="text" 
                      placeholder="Jane Doe" 
                      className="bg-transparent border-b border-[var(--at-border-dark)] py-2 text-base focus:outline-none focus:border-[var(--at-ink)] transition-colors placeholder:text-[var(--at-ink-muted)]/50" 
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-4 h-4 border border-[var(--at-ink)] flex items-center justify-center">
                      <div className="w-2 h-2 bg-[var(--at-ink)]"></div>
                    </div>
                    <span className="text-sm">Send confirmation email</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-7 space-y-8">
              <h4 className="text-sm font-medium">Cards & Surfaces</h4>
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Standard Card */}
                <div className="bg-[var(--at-surface)] p-8 thin-border shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[var(--at-bg)] flex items-center justify-center mb-6">
                    <span className="text-xs">01</span>
                  </div>
                  <h5 className="display-font text-2xl font-medium mb-2">Consultation</h5>
                  <p className="text-sm text-[var(--at-ink-muted)] leading-relaxed mb-6">Initial review of goals and style preferences before the service.</p>
                  <div className="text-xs uppercase tracking-wider font-medium">45 Min • $50</div>
                </div>
                
                {/* Elevated Card */}
                <div className="bg-[var(--at-ink)] text-white p-8 shadow-xl">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <span className="text-xs">✦</span>
                  </div>
                  <h5 className="display-font text-2xl font-medium mb-2">Livia Premium</h5>
                  <p className="text-sm text-white/70 leading-relaxed mb-6">Elevate your practice with AI-driven insights and clienteling.</p>
                  <div className="text-xs uppercase tracking-wider font-medium text-[var(--at-bg)]">Upgrade</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Sample App Surface */}
        <section>
          <div className="thin-rule pb-4 mb-12 flex justify-between items-end">
            <h3 className="ui-font text-xs uppercase tracking-widest text-[var(--at-ink-muted)]">05 / Application Surface</h3>
          </div>
          <div className="bg-[var(--at-surface)] thin-border p-8 md:p-12 shadow-sm max-w-4xl mx-auto">
            
            <header className="flex justify-between items-end mb-12">
              <div>
                <p className="text-sm text-[var(--at-ink-muted)] mb-2">Tuesday, Oct 24</p>
                <h4 className="display-font text-4xl">Good morning, Sarah.</h4>
              </div>
              <div className="text-right">
                <div className="text-2xl font-medium">$420.00</div>
                <div className="text-xs uppercase tracking-wider text-[var(--at-ink-muted)] mt-1">Expected Today</div>
              </div>
            </header>

            <div className="bg-[var(--at-bg)] p-4 thin-border flex gap-4 items-start mb-12">
              <div className="text-[var(--at-accent)] mt-0.5">✦</div>
              <div>
                <p className="text-sm font-medium mb-1">Emma hasn't been in for 6 weeks.</p>
                <p className="text-sm text-[var(--at-ink-muted)]">She usually books a balayage touch-up around this time. Would you like to send a subtle reminder?</p>
                <div className="mt-3 flex gap-4">
                  <button className="text-xs uppercase tracking-wider font-medium text-[var(--at-ink)] hover:text-[var(--at-accent)] transition-colors">Draft Email</button>
                  <button className="text-xs uppercase tracking-wider font-medium text-[var(--at-ink-muted)] transition-colors hover:text-[var(--at-ink)]">Dismiss</button>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs uppercase tracking-widest text-[var(--at-ink-muted)] mb-6">Upcoming Appointments</h5>
              
              <div className="space-y-0">
                {/* Row 1 */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between py-4 thin-rule hover:bg-[var(--at-bg)] -mx-4 px-4 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 text-sm font-medium">09:00</div>
                    <div>
                      <div className="font-medium text-base mb-0.5">Emma Chamberlain</div>
                      <div className="text-sm text-[var(--at-ink-muted)]">Balayage & Cut • 2.5h</div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    <span className="inline-block px-3 py-1 text-xs border border-[var(--at-success)] text-[var(--at-success)]">Confirmed</span>
                    <button className="text-sm text-[var(--at-ink-muted)] hover:text-[var(--at-ink)] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Details</button>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between py-4 thin-rule hover:bg-[var(--at-bg)] -mx-4 px-4 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 text-sm font-medium text-[var(--at-ink-muted)]">11:30</div>
                    <div>
                      <div className="font-medium text-base mb-0.5">Sophia Nguyen</div>
                      <div className="text-sm text-[var(--at-ink-muted)]">Consultation • 30m</div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    <span className="inline-block px-3 py-1 text-xs border border-[var(--at-warning)] text-[var(--at-warning)]">Pending</span>
                    <button className="text-sm text-[var(--at-ink-muted)] hover:text-[var(--at-ink)] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Details</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 7. Voice & Tone */}
        <section>
          <div className="thin-rule pb-4 mb-12 flex justify-between items-end">
            <h3 className="ui-font text-xs uppercase tracking-widest text-[var(--at-ink-muted)]">06 / Voice & Tone</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[var(--at-surface)] thin-border p-8">
              <p className="text-xs uppercase tracking-widest text-[var(--at-ink-muted)] mb-6">Empty State</p>
              <p className="display-font text-2xl mb-4">A quiet day.</p>
              <p className="text-sm text-[var(--at-ink-muted)]">No appointments remaining today. Take a breath, or open your schedule for walk-ins.</p>
            </div>
            <div className="bg-[var(--at-surface)] thin-border p-8">
              <p className="text-xs uppercase tracking-widest text-[var(--at-ink-muted)] mb-6">Success Toast</p>
              <p className="display-font text-2xl mb-4">Nicely done.</p>
              <p className="text-sm text-[var(--at-ink-muted)]">The consultation has been booked and a confirmation was sent to Sophia.</p>
            </div>
            <div className="bg-[var(--at-bg)] thin-border border-[var(--at-accent)] p-8">
              <p className="text-xs uppercase tracking-widest text-[var(--at-accent)] mb-6">AI Suggestion</p>
              <p className="display-font text-2xl text-[var(--at-accent)] mb-4">A gentle nudge.</p>
              <p className="text-sm text-[var(--at-ink-muted)]">You're running about 15 minutes behind schedule. Shall we text your 2:00 PM to let them know?</p>
            </div>
          </div>
        </section>

      </div>

      {/* 8. Footer */}
      <footer className="py-12 text-center border-t border-[var(--at-border)] mt-16">
        <p className="ui-font text-xs uppercase tracking-widest text-[var(--at-ink-muted)]">
          Livia • Atelier Direction • v0.1
        </p>
      </footer>
    </div>
  );
}

function ColorSwatch({ name, hex, role, bg, text = 'inherit', border }: { name: string, hex: string, role: string, bg: string, text?: string, border?: string }) {
  return (
    <div className="flex flex-col">
      <div 
        className="aspect-square mb-4 rounded-sm" 
        style={{ backgroundColor: bg, border: border ? `1px solid ${border}` : 'none' }}
      ></div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-medium text-sm">{name}</span>
        <span className="text-xs text-[var(--at-ink-muted)] uppercase tracking-wider">{hex}</span>
      </div>
      <div className="text-xs text-[var(--at-ink-muted)]">{role}</div>
    </div>
  );
}
