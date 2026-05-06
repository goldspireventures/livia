import React from "react";
import "./Pulse.css";
import { ArrowRight, Calendar, Zap, CheckCircle2, ChevronRight, Activity, Command, MoreHorizontal, User, Scissors } from "lucide-react";

export function Pulse() {
  return (
    <div className="pulse-theme min-h-screen w-full overflow-x-hidden selection:bg-[#ccff00] selection:text-black pb-24">
      {/* 1. Hero band */}
      <section className="relative border-b-2" style={{ borderColor: "var(--pulse-border)" }}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="container mx-auto px-6 py-32 flex flex-col items-start relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#ccff00] text-black">
              <Zap size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl font-bold tracking-tighter uppercase pulse-display">LIVIA</h1>
          </div>
          
          <h2 className="text-6xl md:text-8xl font-black uppercase leading-[0.9] tracking-tighter mb-8 max-w-4xl">
            Run your shop <br />
            <span className="text-[#ccff00]">like a pro.</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <p className="text-xl md:text-2xl text-[#a1a1aa] max-w-2xl pulse-mono">
              The high-energy, AI-native operating system for hustle-mode service businesses.
            </p>
            <div className="h-12 w-0.5 bg-[#333333] hidden sm:block"></div>
            <div className="pulse-badge pulse-badge-accent px-3 py-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
              System Live
            </div>
          </div>
        </div>
        
        {/* Kinetic ticker tape */}
        <div className="w-full overflow-hidden bg-[#ccff00] py-3 flex items-center border-y-2 border-black">
          <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] pulse-mono font-bold text-black uppercase text-sm tracking-wider">
            <span className="mx-4">AUTOMATE BOOKINGS</span> <Activity size={16} className="inline" /> 
            <span className="mx-4">CRUSH NO-SHOWS</span> <Activity size={16} className="inline" /> 
            <span className="mx-4">SCALE YOUR EMPIRE</span> <Activity size={16} className="inline" /> 
            <span className="mx-4">AUTOMATE BOOKINGS</span> <Activity size={16} className="inline" /> 
            <span className="mx-4">CRUSH NO-SHOWS</span> <Activity size={16} className="inline" /> 
            <span className="mx-4">SCALE YOUR EMPIRE</span> <Activity size={16} className="inline" />
            <span className="mx-4">AUTOMATE BOOKINGS</span> <Activity size={16} className="inline" /> 
            <span className="mx-4">CRUSH NO-SHOWS</span> <Activity size={16} className="inline" /> 
            <span className="mx-4">SCALE YOUR EMPIRE</span> <Activity size={16} className="inline" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 max-w-6xl">
        {/* 2. Logo system */}
        <section className="py-24 border-b-2" style={{ borderColor: "var(--pulse-border)" }}>
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold uppercase pulse-display text-[#a1a1aa]">01. Identity</h3>
            <div className="flex-grow h-[2px] bg-[#333333]"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="aspect-square flex items-center justify-center pulse-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#ccff00] text-black shadow-[0_0_30px_rgba(204,255,0,0.3)]">
                  <Zap size={28} strokeWidth={2.5} />
                </div>
                <span className="text-4xl font-bold tracking-tighter uppercase pulse-display">BLIQ</span>
              </div>
              <span className="absolute bottom-4 left-4 pulse-mono text-xs text-[#a1a1aa] uppercase">Primary Lockup</span>
            </div>
            
            <div className="aspect-square flex items-center justify-center pulse-card relative">
              <span className="text-5xl font-black tracking-tighter uppercase pulse-display">BLIQ</span>
              <span className="absolute bottom-4 left-4 pulse-mono text-xs text-[#a1a1aa] uppercase">Mono Wordmark</span>
            </div>
            
            <div className="aspect-square flex items-center justify-center bg-[#ccff00] rounded-16 relative">
              <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-black text-[#ccff00] shadow-2xl shadow-black/50">
                <Zap size={48} strokeWidth={2.5} />
              </div>
              <span className="absolute bottom-4 left-4 pulse-mono text-xs text-black uppercase font-bold">App Icon Tile</span>
            </div>
          </div>
        </section>

        {/* 3. Color palette */}
        <section className="py-24 border-b-2" style={{ borderColor: "var(--pulse-border)" }}>
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold uppercase pulse-display text-[#a1a1aa]">02. Core Colors</h3>
            <div className="flex-grow h-[2px] bg-[#333333]"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
            <ColorSwatch hex="#000000" role="Base / Canvas" label="Black" border />
            <ColorSwatch hex="#111111" role="Surface / Cards" label="Charcoal" border />
            <ColorSwatch hex="#222222" role="Ink / Elevate" label="Graphite" border />
            <ColorSwatch hex="#ccff00" role="Primary Accent" label="Electric Lime" textColor="text-black" />
            <ColorSwatch hex="#ffffff" role="Primary Text" label="White" textColor="text-black" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-8">
            <ColorSwatch hex="#a1a1aa" role="Muted Text" label="Zinc 400" />
            <ColorSwatch hex="#333333" role="Borders / Lines" label="Gray 800" border />
            <ColorSwatch hex="#10b981" role="Success State" label="Emerald 500" />
            <ColorSwatch hex="#ef4444" role="Destructive" label="Red 500" />
          </div>
        </section>

        {/* 4. Typography */}
        <section className="py-24 border-b-2" style={{ borderColor: "var(--pulse-border)" }}>
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold uppercase pulse-display text-[#a1a1aa]">03. Typography</h3>
            <div className="flex-grow h-[2px] bg-[#333333]"></div>
          </div>
          
          <div className="flex flex-col gap-16">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-baseline">
              <div className="pulse-mono text-sm text-[#a1a1aa] uppercase">Display</div>
              <div>
                <div className="pulse-display font-black text-6xl md:text-8xl leading-none uppercase tracking-tighter mb-4">
                  Space Grotesk
                </div>
                <div className="pulse-mono text-xs text-[#ccff00] border border-[#ccff00]/30 px-2 py-1 rounded inline-block bg-[#ccff00]/5">
                  Black 900 / Uppercase / Tracking -0.04em
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-baseline">
              <div className="pulse-mono text-sm text-[#a1a1aa] uppercase">Heading</div>
              <div>
                <div className="pulse-display font-bold text-4xl md:text-5xl leading-tight mb-4">
                  The quick brown fox jumps over the lazy dog.
                </div>
                <div className="pulse-mono text-xs text-[#a1a1aa] border border-[#333333] px-2 py-1 rounded inline-block">
                  Space Grotesk / Bold 700
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-baseline">
              <div className="pulse-mono text-sm text-[#a1a1aa] uppercase">Body</div>
              <div>
                <div className="font-sans text-lg md:text-xl leading-relaxed text-zinc-300 max-w-3xl mb-4">
                  This is the standard body copy. It uses Inter for maximum legibility in dense interfaces like calendars and client lists. It's clean, neutral, and stays out of the way so the bold display typography can do the heavy lifting.
                </div>
                <div className="pulse-mono text-xs text-[#a1a1aa] border border-[#333333] px-2 py-1 rounded inline-block">
                  Inter / Regular 400
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-baseline">
              <div className="pulse-mono text-sm text-[#a1a1aa] uppercase">Mono / Accents</div>
              <div>
                <div className="pulse-mono text-lg mb-4 text-[#ccff00]">
                  SYS.INIT(204, 255, 0); // AUTOMATION PROTOCOL
                </div>
                <div className="pulse-mono text-xs text-[#a1a1aa] border border-[#333333] px-2 py-1 rounded inline-block">
                  Space Mono / Regular 400
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. UI Primitives */}
        <section className="py-24 border-b-2" style={{ borderColor: "var(--pulse-border)" }}>
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold uppercase pulse-display text-[#a1a1aa]">04. Primitives</h3>
            <div className="flex-grow h-[2px] bg-[#333333]"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-12">
              <div>
                <h4 className="pulse-mono text-sm text-[#a1a1aa] uppercase mb-6">Buttons</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="pulse-btn pulse-btn-primary px-8 py-3 flex items-center gap-2">
                    Book Now <ArrowRight size={18} />
                  </button>
                  <button className="pulse-btn pulse-btn-secondary px-8 py-3">
                    Manage Schedule
                  </button>
                  <button className="pulse-btn pulse-btn-ghost px-8 py-3">
                    Cancel
                  </button>
                  <button className="pulse-btn pulse-btn-destructive px-8 py-3 flex items-center gap-2">
                    Delete
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="pulse-mono text-sm text-[#a1a1aa] uppercase mb-6">Badges</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="pulse-badge px-3 py-1">Upcoming</div>
                  <div className="pulse-badge pulse-badge-accent px-3 py-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]"></span> AI Suggested
                  </div>
                  <div className="pulse-badge px-3 py-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Paid</div>
                  <div className="pulse-badge px-3 py-1 bg-red-500/10 text-red-500 border-red-500/20">No Show</div>
                </div>
              </div>
              
              <div>
                <h4 className="pulse-mono text-sm text-[#a1a1aa] uppercase mb-6">Inputs</h4>
                <div className="max-w-sm space-y-4">
                  <div>
                    <label className="block pulse-mono text-xs text-[#a1a1aa] uppercase mb-2">Client Name</label>
                    <input type="text" className="pulse-input w-full px-4 py-3" placeholder="Enter name..." defaultValue="Marcus Johnson" />
                  </div>
                  <div>
                    <label className="block pulse-mono text-xs text-[#a1a1aa] uppercase mb-2">Search Commands</label>
                    <div className="relative">
                      <Command className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" size={16} />
                      <input type="text" className="pulse-input w-full pl-10 pr-4 py-3" placeholder="e.g. /rebook marcus..." />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="pulse-mono text-[10px] border border-[#333333] rounded px-1.5 py-0.5 text-[#a1a1aa]">⌘</kbd>
                        <kbd className="pulse-mono text-[10px] border border-[#333333] rounded px-1.5 py-0.5 text-[#a1a1aa]">K</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="pulse-mono text-sm text-[#a1a1aa] uppercase mb-6">Cards</h4>
              <div className="space-y-6">
                {/* Standard Card */}
                <div className="pulse-card p-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ccff00] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center">
                      <Scissors size={20} className="text-[#a1a1aa]" />
                    </div>
                    <button className="text-[#a1a1aa] hover:text-white transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  <h5 className="pulse-display text-xl font-bold mb-1">Fades & Lineups</h5>
                  <p className="text-[#a1a1aa] text-sm mb-6">Most popular service this week.</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#333333]">
                    <span className="pulse-mono text-[#ccff00]">$45.00</span>
                    <span className="text-sm font-medium">45 min</span>
                  </div>
                </div>

                {/* Stat Card */}
                <div className="pulse-card p-6 bg-gradient-to-br from-[#111111] to-[#0a0a0a]">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-[#ccff00]" />
                    <span className="pulse-mono text-xs text-[#a1a1aa] uppercase">Today's Revenue</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="pulse-display text-5xl font-black tracking-tighter">$1,240</span>
                    <span className="pulse-badge bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 flex items-center gap-1">
                      +12% <ArrowRight size={12} className="-rotate-45" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Sample app surface */}
        <section className="py-24 border-b-2" style={{ borderColor: "var(--pulse-border)" }}>
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold uppercase pulse-display text-[#a1a1aa]">05. UI Composition</h3>
            <div className="flex-grow h-[2px] bg-[#333333]"></div>
          </div>
          
          <div className="pulse-card border-2 border-[#333333] overflow-hidden shadow-2xl">
            {/* Header */}
            <header className="px-6 py-4 border-b-2 border-[#333333] flex justify-between items-center bg-[#09090b]">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#ccff00] text-black flex items-center justify-center">
                  <Zap size={18} strokeWidth={3} />
                </div>
                <div className="font-bold pulse-display text-xl tracking-tight">HUSTLE & CO.</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="pulse-badge pulse-badge-accent px-3 py-1 flex items-center gap-2 hidden md:flex">
                  <span className="w-2 h-2 bg-[#ccff00] rounded-full animate-pulse"></span>
                  AI Assistant Active
                </div>
                <div className="w-8 h-8 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=ccff00" alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#333333]">
              {/* Main Content */}
              <div className="p-6 md:p-8 bg-[#111111]">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="pulse-display font-bold text-3xl mb-2">Schedule</h2>
                    <p className="pulse-mono text-[#a1a1aa] text-sm">Tuesday, Oct 24 / 8 Appointments</p>
                  </div>
                  <button className="pulse-btn pulse-btn-primary px-5 py-2 text-sm flex items-center gap-2">
                    <Calendar size={16} /> New Booking
                  </button>
                </div>
                
                {/* Agenda List */}
                <div className="space-y-4">
                  {/* Past Appointment */}
                  <div className="flex items-stretch gap-4 opacity-50 group">
                    <div className="w-16 text-right pt-4 flex-shrink-0">
                      <div className="pulse-display font-bold text-xl">9:00</div>
                      <div className="pulse-mono text-[10px] uppercase">AM</div>
                    </div>
                    <div className="w-3 relative flex justify-center">
                      <div className="w-0.5 h-full bg-[#333333]"></div>
                      <div className="absolute top-5 w-3 h-3 rounded-full border-2 border-[#333333] bg-[#111111]"></div>
                    </div>
                    <div className="flex-grow pulse-card p-4 border-[#333333] flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center">
                          <User size={18} className="text-[#a1a1aa]" />
                        </div>
                        <div>
                          <div className="font-bold mb-0.5">David Chen</div>
                          <div className="text-sm text-[#a1a1aa]">Skin Fade • 45m</div>
                        </div>
                      </div>
                      <div className="pulse-badge bg-[#222222] border-none">Completed</div>
                    </div>
                  </div>

                  {/* Current Appointment */}
                  <div className="flex items-stretch gap-4">
                    <div className="w-16 text-right pt-4 flex-shrink-0 text-[#ccff00]">
                      <div className="pulse-display font-bold text-xl">10:00</div>
                      <div className="pulse-mono text-[10px] uppercase">AM</div>
                    </div>
                    <div className="w-3 relative flex justify-center">
                      <div className="w-0.5 h-full bg-[#333333]"></div>
                      <div className="absolute top-5 w-3 h-3 rounded-full border-2 border-[#ccff00] bg-[#111111] shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
                      {/* Current time indicator line */}
                      <div className="absolute top-12 left-1/2 w-full h-[2px] bg-[#ccff00] z-10 w-[calc(100%+800px)] pointer-events-none mix-blend-screen opacity-50"></div>
                    </div>
                    <div className="flex-grow pulse-card p-4 border-[#ccff00] border-l-4 relative overflow-hidden bg-[#18181b]">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Zap size={100} />
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center overflow-hidden border border-[#ccff00]">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-lg leading-tight flex items-center gap-2">
                              Marcus Johnson 
                              <span className="pulse-badge pulse-badge-accent px-1.5 py-0 text-[10px]">VIP</span>
                            </div>
                            <div className="text-sm text-[#a1a1aa] pulse-mono mt-1">Haircut & Beard • 60m</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="pulse-mono text-[#ccff00] font-bold mb-1">$65.00</div>
                          <button className="text-xs text-white border-b border-dashed border-white/30 hover:border-white transition-colors uppercase pulse-mono">Collect Payment</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Future Appointment */}
                  <div className="flex items-stretch gap-4 group">
                    <div className="w-16 text-right pt-4 flex-shrink-0">
                      <div className="pulse-display font-bold text-xl text-[#a1a1aa] group-hover:text-white transition-colors">11:15</div>
                      <div className="pulse-mono text-[10px] text-[#a1a1aa] uppercase">AM</div>
                    </div>
                    <div className="w-3 relative flex justify-center">
                      <div className="w-0.5 h-full bg-[#333333]"></div>
                      <div className="absolute top-5 w-3 h-3 rounded-full border-2 border-[#333333] bg-[#111111] group-hover:border-white transition-colors"></div>
                    </div>
                    <div className="flex-grow pulse-card p-4 border-[#333333] flex justify-between items-center hover:border-white/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center">
                          <span className="pulse-display font-bold">AL</span>
                        </div>
                        <div>
                          <div className="font-bold mb-0.5">Alex Lee</div>
                          <div className="text-sm text-[#a1a1aa]">Lineup • 15m</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sidebar / AI Panel */}
              <div className="bg-[#09090b] flex flex-col h-full">
                <div className="p-6 border-b-2 border-[#333333]">
                  <h3 className="pulse-display font-bold text-lg mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-[#ccff00]" /> Intelligence
                  </h3>
                  
                  {/* AI Suggestion Card */}
                  <div className="pulse-card border-[#ccff00]/30 bg-[#ccff00]/5 p-4 relative">
                    <div className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#ccff00] text-black flex items-center justify-center">
                      <span className="pulse-mono text-[10px] font-bold">1</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4">
                      <span className="font-bold text-white">Gap detected.</span> You have a 45m opening at 1:00 PM. 3 clients usually book around this time.
                    </p>
                    <button className="pulse-btn pulse-btn-secondary w-full py-2 text-xs border-[#ccff00]/50 hover:bg-[#ccff00] hover:text-black hover:border-[#ccff00]">
                      Draft SMS Blast
                    </button>
                  </div>
                </div>
                
                <div className="p-6 flex-grow">
                  <h3 className="pulse-mono text-xs uppercase text-[#a1a1aa] mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 rounded-lg hover:bg-[#222222] transition-colors flex items-center justify-between group">
                      <span className="font-medium text-sm">Add Time Block</span>
                      <ChevronRight size={16} className="text-[#333333] group-hover:text-white" />
                    </button>
                    <button className="w-full text-left p-3 rounded-lg hover:bg-[#222222] transition-colors flex items-center justify-between group">
                      <span className="font-medium text-sm">Client Intake Form</span>
                      <ChevronRight size={16} className="text-[#333333] group-hover:text-white" />
                    </button>
                    <button className="w-full text-left p-3 rounded-lg hover:bg-[#222222] transition-colors flex items-center justify-between group">
                      <span className="font-medium text-sm">Cash Out Register</span>
                      <ChevronRight size={16} className="text-[#333333] group-hover:text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Voice & Tone */}
        <section className="py-24 border-b-2" style={{ borderColor: "var(--pulse-border)" }}>
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold uppercase pulse-display text-[#a1a1aa]">06. Voice & Tone</h3>
            <div className="flex-grow h-[2px] bg-[#333333]"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="pulse-mono text-xs text-[#a1a1aa] uppercase mb-2">Empty State (Schedule)</div>
              <div className="pulse-card p-6 bg-[#111111] border-dashed">
                <div className="w-12 h-12 rounded-full bg-[#222222] flex items-center justify-center mb-4 text-[#a1a1aa]">
                  <Calendar size={24} />
                </div>
                <h5 className="font-bold mb-2">No bookings today.</h5>
                <p className="text-sm text-[#a1a1aa] mb-4">Your chair is empty. Time to drum up some business.</p>
                <button className="text-sm text-[#ccff00] font-bold uppercase pulse-mono hover:underline">Launch Promo</button>
              </div>
              <p className="text-sm text-zinc-400 mt-4 border-l-2 border-[#ccff00] pl-4">
                <strong>Direct, action-oriented.</strong> We don't say "Oops, nothing here!" We state the fact and immediately offer a tool to fix it.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="pulse-mono text-xs text-[#a1a1aa] uppercase mb-2">Success Toast</div>
              <div className="pulse-card p-4 bg-[#111111] border-l-4 border-l-emerald-500 shadow-2xl flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="font-bold text-sm mb-1">Payment secured.</div>
                  <div className="text-xs text-[#a1a1aa]">$65.00 added to today's payout.</div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-4 border-l-2 border-[#ccff00] pl-4">
                <strong>Confident, slightly hyped.</strong> "Secured" sounds better than "Successful". It reinforces the hustle mentality.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="pulse-mono text-xs text-[#a1a1aa] uppercase mb-2">AI Suggestion</div>
              <div className="pulse-card p-4 bg-[#ccff00] text-black shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} /> <span className="font-bold text-xs uppercase pulse-mono tracking-tight">Intelligence</span>
                </div>
                <p className="text-sm font-medium">
                  Marcus hasn't booked his usual 3-week fade. Want me to drop him a text?
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="bg-black text-white px-3 py-1 text-xs font-bold rounded uppercase pulse-mono">Send It</button>
                  <button className="text-black/60 px-3 py-1 text-xs font-bold rounded uppercase pulse-mono">Skip</button>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-4 border-l-2 border-[#ccff00] pl-4">
                <strong>The coach speaking.</strong> The AI talks like a sharp business partner looking out for your bottom line. Conversational but brief.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Footer */}
        <footer className="py-12 flex justify-between items-center text-[#a1a1aa] pulse-mono text-xs uppercase">
          <div>Livia • Bold Kinetic • v0.1</div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00]"></div>
            System Online
          </div>
        </footer>
      </div>
    </div>
  );
}

function ColorSwatch({ 
  hex, 
  role, 
  label, 
  border = false, 
  textColor = "text-white" 
}: { 
  hex: string; 
  role: string; 
  label: string; 
  border?: boolean; 
  textColor?: string;
}) {
  return (
    <div className="flex flex-col">
      <div 
        className={`aspect-[4/3] rounded-lg mb-3 shadow-inner ${border ? 'border border-[#333333]' : ''}`}
        style={{ backgroundColor: hex }}
      ></div>
      <div className="pulse-display font-bold text-lg mb-1">{label}</div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#a1a1aa]">{role}</span>
        <span className="pulse-mono uppercase text-[#a1a1aa]">{hex}</span>
      </div>
    </div>
  );
}
