import React from 'react';
import { LayoutGrid, Calendar, Users, Briefcase, Settings } from 'lucide-react';

export function Atrium() {
  const greeting = "Good afternoon, Vela.";
  const subhead = "5 done, 9 to go. You're on track.";

  return (
    <div 
      className="min-h-screen text-[hsl(0,0%,98%)] bg-[hsl(240,10%,4%)] flex relative overflow-hidden"
      style={{ fontFamily: "'Geist', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .glass-card {
          background: hsla(240, 8%, 7%, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid hsla(0, 0%, 100%, 0.06);
        }
        
        .aurora-text {
          background: linear-gradient(135deg, hsl(188 95% 43%) 0%, hsl(258 90% 66%) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .aurora-border {
          position: relative;
        }
        .aurora-border::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, hsl(188 95% 43%) 0%, hsl(258 90% 66%) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      {/* Ambient Orbs */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-[hsl(258,90%,66%)] opacity-[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(188,95%,43%)] opacity-[0.05] blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-[256px] border-r border-[hsl(240,6%,14%)] flex flex-col justify-between shrink-0 bg-[hsl(240,10%,4%)] z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-lg" 
                 style={{ background: 'linear-gradient(135deg, hsl(188 95% 43%) 0%, hsl(258 90% 66%) 100%)' }}>
              B
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight">Livia</span>
          </div>

          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsla(188,95%,43%,0.1)] text-[hsl(188,95%,43%)] font-medium text-sm">
              <LayoutGrid className="w-4 h-4" /> Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[hsl(240,5%,65%)] hover:text-white transition-colors font-medium text-sm">
              <Calendar className="w-4 h-4" /> Bookings
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[hsl(240,5%,65%)] hover:text-white transition-colors font-medium text-sm">
              <Users className="w-4 h-4" /> Customers
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[hsl(240,5%,65%)] hover:text-white transition-colors font-medium text-sm">
              <Briefcase className="w-4 h-4" /> Staff & Services
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[hsl(240,5%,65%)] hover:text-white transition-colors font-medium text-sm">
              <Settings className="w-4 h-4" /> Settings
            </a>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,18%)] flex items-center justify-center font-display text-sm font-semibold text-[hsl(240,5%,65%)]">
              VS
            </div>
            <div>
              <div className="text-sm font-medium">Vela Studio</div>
              <div className="text-xs text-[hsl(240,5%,65%)]">Owner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 flex flex-col items-center relative z-10">
        <div className="w-full max-w-4xl">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-2">
            <h1 className="font-display font-bold text-5xl tracking-tight aurora-text pb-1">
              {greeting}
            </h1>
            <p className="text-[hsl(240,5%,65%)] text-lg">
              {subhead}
            </p>
          </div>

          {/* Hero: Next Up */}
          <div className="flex justify-center mb-16">
            <div className="glass-card rounded-[24px] p-8 w-[480px] flex flex-col items-center text-center aurora-border shadow-[0_0_40px_hsla(188,95%,43%,0.1)]">
              <div className="text-[hsl(188,95%,43%)] font-mono text-xs uppercase tracking-widest font-semibold mb-6">
                Next Up
              </div>
              
              <div className="w-20 h-20 rounded-full bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,18%)] flex items-center justify-center text-2xl font-display font-bold mb-4"
                   style={{ background: 'linear-gradient(135deg, hsla(188, 95%, 43%, 0.2) 0%, hsla(258, 90%, 66%, 0.2) 100%)' }}>
                SC
              </div>

              <h2 className="font-display text-3xl font-bold mb-1">Sarah Chen</h2>
              <div className="text-[hsl(240,5%,65%)] mb-4">Balayage &middot; Stylist: Jordan</div>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="font-mono text-[hsl(188,95%,43%)] text-2xl">14:30</span>
                <span className="text-[hsl(240,5%,65%)] bg-[hsla(0,0%,100%,0.05)] px-3 py-1 rounded-full text-sm">in 23 minutes</span>
              </div>

              <div className="bg-[hsla(258,90%,66%,0.1)] border border-[hsla(258,90%,66%,0.2)] rounded-xl p-4 mb-8 text-sm text-[hsl(258,90%,75%)] w-full">
                <strong>AI Prep:</strong> Last visit was a balayage, requested cooler tones — Sarah likes the new gloss.
              </div>

              <div className="flex gap-4 w-full">
                <button className="flex-1 bg-[hsla(0,0%,100%,0.05)] hover:bg-[hsla(0,0%,100%,0.1)] transition-colors py-3 rounded-xl text-sm font-medium">
                  Message Sarah
                </button>
                <button className="flex-1 bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,18%)] hover:bg-[hsl(240,7%,10%)] transition-colors py-3 rounded-xl text-sm font-medium">
                  Open booking
                </button>
              </div>
            </div>
          </div>

          {/* Stat Tiles */}
          <div className="grid grid-cols-3 gap-6 mb-16">
            <div className="glass-card rounded-[16px] p-6 aurora-border flex flex-col items-center justify-center">
              <div className="font-mono text-4xl aurora-text mb-2">14</div>
              <div className="text-[hsl(240,5%,65%)] text-sm font-medium uppercase tracking-wider">Today's Bookings</div>
            </div>
            <div className="glass-card rounded-[16px] p-6 aurora-border flex flex-col items-center justify-center">
              <div className="font-mono text-4xl text-[hsl(38,92%,56%)] mb-2">3</div>
              <div className="text-[hsl(240,5%,65%)] text-sm font-medium uppercase tracking-wider">Pending Action</div>
            </div>
            <div className="glass-card rounded-[16px] p-6 aurora-border flex flex-col items-center justify-center">
              <div className="font-mono text-4xl text-[hsl(0,0%,98%)] mb-2">287</div>
              <div className="text-[hsl(240,5%,65%)] text-sm font-medium uppercase tracking-wider">Total Customers</div>
            </div>
          </div>

          {/* Today's Flow */}
          <div>
            <h3 className="font-display text-xl font-bold mb-6 text-center">Today's flow</h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                { time: '16:00', name: 'Jordan Reyes', service: 'Cut & Style', status: 'PENDING', color: 'hsl(38 92% 56%)' },
                { time: '16:45', name: 'Maya Patel', service: 'Blowout', status: 'CONFIRMED', color: 'hsl(188 95% 43%)' },
                { time: '17:30', name: 'Marcus Williams', service: 'Beard Trim', status: 'CONFIRMED', color: 'hsl(188 95% 43%)' },
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-xl p-4 flex items-center hover:-translate-y-1 transition-transform cursor-pointer">
                  <div className="w-24 font-mono text-lg text-[hsl(240,5%,65%)]">{item.time}</div>
                  <div className="flex-1">
                    <div className="font-medium text-lg">{item.name}</div>
                    <div className="text-sm text-[hsl(240,5%,65%)]">{item.service}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-[hsl(240,5%,65%)]">{item.status}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Nudge */}
      <div className="fixed bottom-8 right-8 w-80 glass-card rounded-2xl p-5 shadow-[0_0_30px_hsla(258,90%,66%,0.15)] z-50 aurora-border">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[hsla(258,90%,66%,0.2)] flex items-center justify-center shrink-0 mt-1">
            <span className="text-[hsl(258,90%,66%)] text-sm">✦</span>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-[hsl(0,0%,98%)] mb-4">
              I drafted a reminder for Jordan's 4pm — he's been late twice. Want me to send?
            </p>
            <div className="flex gap-2">
              <button className="flex-1 bg-[hsl(258,90%,66%)] hover:bg-[hsl(258,90%,70%)] text-white py-1.5 rounded-lg text-xs font-medium transition-colors">
                Send
              </button>
              <button className="flex-1 bg-[hsla(0,0%,100%,0.05)] hover:bg-[hsla(0,0%,100%,0.1)] text-white py-1.5 rounded-lg text-xs font-medium transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
