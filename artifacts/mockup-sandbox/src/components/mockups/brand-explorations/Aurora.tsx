import React from 'react';
import './Aurora.css';

export function Aurora() {
  return (
    <div className="aurora-theme w-full overflow-x-hidden selection:bg-[#06b6d4]/30 selection:text-white">
      {/* 1. Hero Band */}
      <section className="min-h-[80vh] flex flex-col justify-center items-center relative overflow-hidden px-6 text-center">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#8b5cf6] blur-[120px] mix-blend-screen" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#06b6d4] blur-[120px] mix-blend-screen" />
        </div>
        
        <div className="z-10 flex flex-col items-center max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <LogoMark className="w-10 h-10" />
            <span className="font-display text-4xl font-semibold tracking-tight">Bliq</span>
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1]">
            Your day, <br className="hidden md:block" />
            <span className="aurora-gradient-text">already handled.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[var(--aurora-text-muted)] font-light max-w-2xl mt-6">
            The AI-native operating system for ambitious service businesses.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-32 space-y-32">
        {/* 2. Logo System */}
        <section className="space-y-12">
          <SectionHeader title="Logo System" description="Abstract, cinematic, precision-engineered." />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aurora-glass aspect-square flex flex-col items-center justify-center p-8 relative group">
              <span className="absolute top-6 left-6 text-xs text-[var(--aurora-text-faint)] uppercase tracking-wider font-mono">Primary Mark</span>
              <LogoMark className="w-24 h-24" />
            </div>
            
            <div className="aurora-glass aspect-square flex flex-col items-center justify-center p-8 relative">
              <span className="absolute top-6 left-6 text-xs text-[var(--aurora-text-faint)] uppercase tracking-wider font-mono">Mono Mark</span>
              <LogoMark className="w-24 h-24 text-white opacity-80" fill="currentColor" gradient={false} />
            </div>

            <div className="aurora-glass aspect-square flex items-center justify-center p-8 relative">
               <span className="absolute top-6 left-6 text-xs text-[var(--aurora-text-faint)] uppercase tracking-wider font-mono">App Icon</span>
               <div className="w-32 h-32 rounded-3xl bg-[var(--aurora-bg)] border border-[var(--aurora-border-light)] flex items-center justify-center shadow-2xl overflow-hidden relative">
                 <div className="absolute inset-0 opacity-20 aurora-gradient-bg blur-xl"></div>
                 <LogoMark className="w-16 h-16 relative z-10" />
               </div>
            </div>
          </div>
        </section>

        {/* 3. Color Palette */}
        <section className="space-y-12">
          <SectionHeader title="Color Palette" description="Midnight base with concentrated AI energy." />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ColorSwatch name="Midnight Base" hex="#09090b" role="Background" border />
            <ColorSwatch name="Glass Surface" hex="rgba(255, 255, 255, 0.03)" role="Surface" border />
            <ColorSwatch name="Starlight" hex="#ffffff" role="Primary Ink" border />
            <ColorSwatch name="Muted Star" hex="rgba(255, 255, 255, 0.6)" role="Secondary Ink" border />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="aurora-glass p-6 flex flex-col justify-end min-h-[200px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#8b5cf6] opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative z-10">
                <p className="font-mono text-sm opacity-80">#8b5cf6</p>
                <p className="font-display font-medium text-xl">Violet</p>
                <p className="text-sm opacity-60">Gradient Start</p>
              </div>
            </div>
            <div className="aurora-glass p-6 flex flex-col justify-end min-h-[200px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#06b6d4] opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative z-10">
                <p className="font-mono text-sm opacity-80">#06b6d4</p>
                <p className="font-display font-medium text-xl">Cyan</p>
                <p className="text-sm opacity-60">Gradient Mid / Accent</p>
              </div>
            </div>
            <div className="aurora-glass p-6 flex flex-col justify-end min-h-[200px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#10b981] opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative z-10">
                <p className="font-mono text-sm opacity-80">#10b981</p>
                <p className="font-display font-medium text-xl">Mint</p>
                <p className="text-sm opacity-60">Gradient End / Success</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Typography */}
        <section className="space-y-12">
          <SectionHeader title="Typography" description="Engineered for clarity. Styled for premium." />
          
          <div className="aurora-glass p-12 space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end border-b border-[var(--aurora-border)] pb-8">
              <div className="md:col-span-1">
                <p className="font-mono text-[var(--aurora-text-faint)] text-sm uppercase tracking-widest">Display</p>
                <p className="text-lg mt-1 font-display">Plus Jakarta Sans</p>
              </div>
              <div className="md:col-span-3">
                <p className="font-display text-5xl md:text-7xl font-bold tracking-tighter">Cinematic & Calm</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end border-b border-[var(--aurora-border)] pb-8">
              <div className="md:col-span-1">
                <p className="font-mono text-[var(--aurora-text-faint)] text-sm uppercase tracking-widest">Heading</p>
                <p className="text-lg mt-1">Geist</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-3xl md:text-4xl font-medium tracking-tight">Precision engineered for interfaces.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start border-b border-[var(--aurora-border)] pb-8">
              <div className="md:col-span-1">
                <p className="font-mono text-[var(--aurora-text-faint)] text-sm uppercase tracking-widest">Body</p>
                <p className="text-lg mt-1">Geist</p>
              </div>
              <div className="md:col-span-3 text-[var(--aurora-text-muted)] text-lg leading-relaxed font-light">
                <p>The standard typography handles density effortlessly. It remains perfectly legible even at small sizes, ensuring that dense schedules and complex client histories never feel overwhelming. It whispers rather than shouts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. UI Primitives */}
        <section className="space-y-12">
          <SectionHeader title="UI Primitives" description="Components that feel tangible, glass-like, and fluid." />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aurora-glass p-8 space-y-8 flex flex-col justify-center items-start">
              <div className="space-y-2 w-full">
                 <p className="font-mono text-[var(--aurora-text-faint)] text-xs mb-4 uppercase">Buttons</p>
                 <div className="flex flex-wrap gap-4">
                   <button className="bg-white text-black px-6 py-2.5 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors">Primary Action</button>
                   <button className="bg-[var(--aurora-surface)] border border-[var(--aurora-border)] text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-[var(--aurora-surface-hover)] transition-colors">Secondary</button>
                   <button className="text-[var(--aurora-text-muted)] hover:text-white px-4 py-2.5 rounded-full font-medium text-sm transition-colors">Ghost Link</button>
                 </div>
              </div>
              
              <div className="space-y-2 w-full pt-4">
                 <p className="font-mono text-[var(--aurora-text-faint)] text-xs mb-4 uppercase">Inputs</p>
                 <input type="text" placeholder="Search clients, appointments..." className="w-full bg-black/40 border border-[var(--aurora-border)] rounded-2xl px-5 py-3.5 text-white placeholder-[var(--aurora-text-faint)] focus:outline-none focus:border-[var(--aurora-accent)] focus:ring-1 focus:ring-[var(--aurora-accent)] transition-all" />
              </div>
              
              <div className="space-y-2 w-full pt-4">
                 <p className="font-mono text-[var(--aurora-text-faint)] text-xs mb-4 uppercase">Badges</p>
                 <div className="flex flex-wrap gap-3">
                   <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">Confirmed</span>
                   <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">Pending</span>
                   <span className="px-3 py-1 rounded-full text-xs font-medium aurora-gradient-bg text-white shadow-lg shadow-cyan-500/20">AI Optimized</span>
                 </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Card 1 */}
              <div className="aurora-glass p-6 w-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-[var(--aurora-text-muted)] text-sm font-medium mb-1">Today's Revenue</h3>
                    <p className="font-display text-4xl font-semibold">$1,240.00</p>
                  </div>
                  <span className="bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-full text-xs font-mono font-medium">+14.2%</span>
                </div>
                <div className="h-12 w-full flex items-end gap-1 opacity-60">
                   {[40, 70, 45, 90, 65, 85, 100, 60, 50, 80, 40].map((h, i) => (
                     <div key={i} className="flex-1 bg-[var(--aurora-border-light)] rounded-t-sm hover:bg-[var(--aurora-accent)] transition-colors duration-300" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
              </div>
              
              {/* Card 2 */}
              <div className="aurora-glass p-1 w-full bg-black/40">
                 <div className="p-5">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-display font-medium text-sm">ES</div>
                        <div>
                          <p className="font-medium">Elena Sokolov</p>
                          <p className="text-xs text-[var(--aurora-text-muted)]">Balayage & Cut • 2h 30m</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">2:00 PM</p>
                        <p className="text-xs text-[var(--aurora-text-muted)]">In 45 mins</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                     <button className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-medium">Check In</button>
                     <button className="flex-1 bg-[var(--aurora-surface)] border border-[var(--aurora-border)] text-white py-2 rounded-xl text-sm font-medium hover:bg-[var(--aurora-surface-hover)]">Message</button>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Sample App Surface */}
        <section className="space-y-12">
          <SectionHeader title="App Surface" description="The operating system in motion." />
          
          <div className="aurora-glass p-2 relative overflow-hidden">
             {/* Fake App Window */}
             <div className="bg-[#09090b] rounded-[1.25rem] border border-[var(--aurora-border)] overflow-hidden min-h-[500px] flex flex-col shadow-2xl relative">
                {/* Glow behind the AI chip */}
                <div className="absolute top-1/4 right-8 w-64 h-64 bg-[#06b6d4] opacity-10 blur-[100px] pointer-events-none"></div>
                
                {/* Header */}
                <header className="px-8 py-6 border-b border-[var(--aurora-border)] flex justify-between items-center bg-black/20 backdrop-blur-md">
                   <div>
                     <h2 className="text-2xl font-display font-semibold tracking-tight">Schedule</h2>
                     <p className="text-[var(--aurora-text-muted)] text-sm mt-1">Thursday, October 24</p>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="hidden md:flex bg-[var(--aurora-surface)] border border-[var(--aurora-border)] rounded-full p-1">
                        <button className="px-4 py-1.5 bg-[var(--aurora-surface-hover)] rounded-full text-sm font-medium shadow-sm">Today</button>
                        <button className="px-4 py-1.5 text-sm text-[var(--aurora-text-muted)] hover:text-white transition-colors">Week</button>
                     </div>
                     <div className="w-10 h-10 rounded-full border border-[var(--aurora-border)] overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100" alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                   </div>
                </header>

                <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-4">
                      {/* Timeline row 1 */}
                      <div className="flex gap-6 group">
                         <div className="w-16 text-right pt-2 text-[var(--aurora-text-muted)] font-mono text-xs">9:00 AM</div>
                         <div className="flex-1 bg-[var(--aurora-surface)] border border-[var(--aurora-border)] rounded-2xl p-4 flex justify-between items-center group-hover:bg-[var(--aurora-surface-hover)] transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                               <div className="w-1.5 h-12 bg-gray-600 rounded-full"></div>
                               <div>
                                 <p className="font-medium text-lg">Marcus Chen</p>
                                 <p className="text-[var(--aurora-text-muted)] text-sm">Skin Fade • Completed</p>
                               </div>
                            </div>
                            <span className="text-[var(--aurora-text-muted)] text-sm">Paid $45</span>
                         </div>
                      </div>
                      
                      {/* Timeline row 2 (Active) */}
                      <div className="flex gap-6 group relative">
                         {/* Current time line */}
                         <div className="absolute left-[4.5rem] top-6 w-[calc(100%-4.5rem)] h-[1px] bg-[#06b6d4] z-10 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-[#06b6d4] -ml-1"></div>
                         </div>
                         
                         <div className="w-16 text-right pt-2 text-[#06b6d4] font-mono text-xs font-bold">10:30 AM</div>
                         <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden cursor-pointer">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 aurora-gradient-bg"></div>
                            <div className="flex items-center gap-4 pl-3">
                               <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100" alt="Client" className="w-full h-full object-cover" />
                               </div>
                               <div>
                                 <p className="font-medium text-lg">Sarah Jenkins</p>
                                 <p className="text-[var(--aurora-text-muted)] text-sm">Full Highlights & Style</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/10 backdrop-blur-md">In Progress</span>
                            </div>
                         </div>
                      </div>

                      {/* Timeline row 3 */}
                      <div className="flex gap-6 group opacity-70">
                         <div className="w-16 text-right pt-2 text-[var(--aurora-text-muted)] font-mono text-xs">1:00 PM</div>
                         <div className="flex-1 bg-[var(--aurora-surface)] border border-[var(--aurora-border)] rounded-2xl p-4 flex justify-between items-center cursor-pointer">
                            <div className="flex items-center gap-4">
                               <div className="w-1.5 h-12 bg-transparent border border-dashed border-gray-600 rounded-full"></div>
                               <div>
                                 <p className="font-medium text-lg text-gray-400">Lunch Break</p>
                               </div>
                            </div>
                            <span className="text-[var(--aurora-text-muted)] text-sm">60m</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      {/* AI Suggestion Card */}
                      <div className="rounded-2xl p-[1px] aurora-gradient-bg relative group cursor-pointer overflow-hidden">
                         <div className="absolute inset-0 bg-black/40 backdrop-blur-xl group-hover:bg-black/20 transition-all z-0"></div>
                         <div className="bg-[#09090b]/90 rounded-[15px] p-5 relative z-10 h-full backdrop-blur-2xl">
                            <div className="flex items-center gap-2 mb-4">
                               <SparklesIcon className="w-4 h-4 text-[#06b6d4]" />
                               <span className="text-xs font-mono text-[var(--aurora-text-faint)] uppercase tracking-wider">Bliq Intelligence</span>
                            </div>
                            <p className="font-medium mb-2 leading-snug text-lg">Reschedule Gap Detected</p>
                            <p className="text-sm text-[var(--aurora-text-muted)] mb-5">You have a 90m opening at 2:00 PM. Send an early-access invite to 3 clients on your waitlist?</p>
                            <button className="w-full py-2.5 rounded-xl aurora-gradient-bg text-white font-medium text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-shadow">
                               Send Invites
                            </button>
                         </div>
                      </div>

                      {/* Mini stat */}
                      <div className="bg-[var(--aurora-surface)] border border-[var(--aurora-border)] rounded-2xl p-5">
                         <p className="text-sm text-[var(--aurora-text-muted)] mb-1">Utilization Today</p>
                         <div className="flex items-end gap-3 mb-3">
                           <p className="text-3xl font-display font-semibold">86%</p>
                           <p className="text-xs text-[#10b981] mb-1 font-mono">+12% vs avg</p>
                         </div>
                         <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                            <div className="h-full bg-white w-[86%] rounded-full"></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* 7. Voice & Tone */}
        <section className="space-y-12">
          <SectionHeader title="Voice & Tone" description="Precise, calm, slightly poetic." />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aurora-glass p-8 border-t-4 border-t-[#06b6d4]">
               <p className="font-mono text-xs text-[var(--aurora-text-faint)] uppercase mb-4 tracking-wider">Empty State</p>
               <p className="text-lg font-medium">A quiet day.</p>
               <p className="text-sm text-[var(--aurora-text-muted)] mt-2">No appointments scheduled yet. Take a breath, or let Bliq fill the gaps.</p>
            </div>
            
            <div className="aurora-glass p-8 border-t-4 border-t-[#10b981]">
               <p className="font-mono text-xs text-[var(--aurora-text-faint)] uppercase mb-4 tracking-wider">Success Toast</p>
               <p className="text-lg font-medium">Payment secured.</p>
               <p className="text-sm text-[var(--aurora-text-muted)] mt-2">$145.00 settled instantly to your vault.</p>
            </div>

            <div className="aurora-glass p-8 border-t-4 border-t-[#8b5cf6]">
               <p className="font-mono text-xs text-[var(--aurora-text-faint)] uppercase mb-4 tracking-wider">AI Suggestion</p>
               <p className="text-lg font-medium">Predictive booking.</p>
               <p className="text-sm text-[var(--aurora-text-muted)] mt-2">Sarah usually books a root touch-up around now. Draft a quick reminder?</p>
            </div>
          </div>
        </section>

        {/* 8. Footer */}
        <footer className="pt-12 border-t border-[var(--aurora-border)] text-center pb-8">
           <p className="font-mono text-sm text-[var(--aurora-text-faint)]">Bliq • Aurora • v0.1</p>
        </footer>

      </div>
    </div>
  );
}

// Helper Components
function SectionHeader({ title, description }: { title: string, description: string }) {
  return (
    <div className="border-b border-[var(--aurora-border)] pb-4">
      <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">{title}</h2>
      <p className="text-[var(--aurora-text-muted)] mt-2 font-light">{description}</p>
    </div>
  );
}

function ColorSwatch({ name, hex, role, border = false }: { name: string, hex: string, role: string, border?: boolean }) {
  return (
    <div className="group">
      <div 
        className={`w-full aspect-[4/3] rounded-2xl mb-4 transition-transform group-hover:-translate-y-1 ${border ? 'border border-[var(--aurora-border)]' : ''}`}
        style={{ backgroundColor: hex }}
      />
      <div className="space-y-1">
        <p className="font-display font-medium text-sm">{name}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--aurora-text-muted)]">{role}</span>
          <span className="font-mono text-[var(--aurora-text-faint)]">{hex}</span>
        </div>
      </div>
    </div>
  );
}

function LogoMark({ className = "", fill = "url(#aurora-gradient)", gradient = true }: { className?: string, fill?: string, gradient?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {gradient && (
        <defs>
          <linearGradient id="aurora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      )}
      <path 
        d="M25 20C25 20 40 10 60 20C80 30 85 50 80 70C75 90 50 95 35 85C20 75 15 50 25 20Z" 
        fill={fill} 
        className="opacity-90"
      />
      <path 
        d="M35 30C35 30 45 25 55 30C65 35 68 45 65 55C62 65 50 68 42 62C34 56 32 45 35 30Z" 
        fill="#09090b" 
        className="opacity-40"
      />
    </svg>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
