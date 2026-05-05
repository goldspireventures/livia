import React, { useState } from 'react';
import { LucideIcon, Sparkles, TrendingUp, AlertCircle, RefreshCw, Scissors, Calendar, User, Clock, ChevronRight, Activity, Mail, CheckCircle2 } from 'lucide-react';

export function Concierge() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [dismissedCards, setDismissedCards] = useState<number[]>([]);

  const handleDismiss = (id: number) => {
    setDismissedCards([...dismissedCards, id]);
  };

  const aiCards = [
    {
      id: 1,
      category: 'Retention',
      categoryColor: 'hsl(188 95% 43%)',
      icon: RefreshCw,
      content: (
        <>
          <strong className="text-[hsl(0_0%_98%)] font-medium">Sarah Chen</strong> usually rebooks her cut around week 6. She's at week 7 — want me to send a personalized re-booking link with her usual Saturday slot held?
        </>
      ),
      primaryAction: 'Send draft',
      secondaryActions: ['Edit', 'Skip'],
      confidence: '89% historic convert'
    },
    {
      id: 2,
      category: 'Revenue',
      categoryColor: 'hsl(158 84% 39%)',
      icon: TrendingUp,
      content: (
        <>
          Tomorrow 2:00–2:45pm has a gap. <strong className="text-[hsl(0_0%_98%)] font-medium">Maya Park</strong> mentioned wanting highlights last visit. Promote a flash slot to her + 19 similar VIPs?
        </>
      ),
      primaryAction: 'Promote',
      secondaryActions: ['See list', 'Skip'],
      confidence: 'Est. +$120'
    },
    {
      id: 3,
      category: 'Risk',
      categoryColor: 'hsl(38 92% 56%)',
      icon: AlertCircle,
      content: (
        <>
          <strong className="text-[hsl(0_0%_98%)] font-medium">Jordan Reyes</strong> has no-showed twice this quarter. Apply a $25 deposit requirement on his next booking?
        </>
      ),
      primaryAction: 'Apply',
      secondaryActions: ['Dismiss'],
      confidence: 'Saves est. $80'
    },
    {
      id: 4,
      category: 'Ops',
      categoryColor: 'hsl(258 90% 66%)',
      icon: Clock,
      content: (
        <>
          <strong className="text-[hsl(0_0%_98%)] font-medium">Marcus</strong> is 12 min behind on color clients today. Auto-shift remaining 3 appointments by 10 min and notify customers?
        </>
      ),
      primaryAction: 'Apply',
      secondaryActions: ['Review each', 'Skip'],
      confidence: 'Prevents overlap'
    }
  ];

  const visibleCards = aiCards.filter(c => !dismissedCards.includes(c.id));

  return (
    <div style={{ fontFamily: "'Geist', sans-serif" }} className="flex h-screen bg-[hsl(240_10%_4%)] text-[hsl(0_0%_98%)] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        
        .aurora-border {
          position: relative;
          background: hsl(240 8% 7%);
          border-radius: 12px;
          z-index: 1;
        }
        
        .aurora-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 13px;
          background: linear-gradient(135deg, hsla(188, 95%, 43%, 0.5) 0%, hsla(258, 90%, 66%, 0.5) 100%);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .aurora-border:hover::before {
          opacity: 1;
        }
        
        .aurora-border:hover {
          box-shadow: 0 0 30px hsla(258, 90%, 66%, 0.1);
          transform: translateY(-1px);
        }

        .glass-panel {
          background: hsla(240, 8%, 7%, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid hsla(0, 0%, 100%, 0.06);
        }

        .ambient-orb-1 {
          position: absolute;
          top: -150px;
          left: 20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, hsla(258, 90%, 66%, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        .ambient-orb-2 {
          position: absolute;
          top: 100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, hsla(188, 95%, 43%, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      {/* Sidebar */}
      <div className="w-[256px] flex-shrink-0 border-r border-[hsl(240_6%_18%)] bg-[hsl(240_8%_7%)] flex flex-col z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[hsl(188_95%_43%)] to-[hsl(258_90%_66%)] text-white font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            B
          </div>
          <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Bliq</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {['Dashboard', 'Bookings', 'Customers', 'Staff & Services', 'Settings'].map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeNav === item 
                  ? 'bg-[hsla(188,95%,43%,0.1)] text-[hsl(188,95%,43%)]' 
                  : 'text-[hsl(240_5%_65%)] hover:bg-[hsl(240_6%_14%)] hover:text-white'
              }`}
            >
              {item === 'Dashboard' && <Activity className="w-4 h-4" />}
              {item === 'Bookings' && <Calendar className="w-4 h-4" />}
              {item === 'Customers' && <User className="w-4 h-4" />}
              {item === 'Staff & Services' && <Scissors className="w-4 h-4" />}
              {item === 'Settings' && <Sparkles className="w-4 h-4" />}
              {item}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[hsl(240_6%_18%)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[hsl(240_6%_18%)] flex items-center justify-center text-sm font-medium text-[hsl(240_5%_65%)]">
              AL
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Alex Owner</span>
              <span className="text-xs text-[hsl(240_5%_65%)]">Vela Studio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />

        {/* Top Bar */}
        <header className="h-16 border-b border-[hsl(240_6%_18%)] flex items-center justify-between px-8 z-10 glass-panel">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[hsl(240_5%_65%)]">Vela Studio</span>
            <ChevronRight className="w-4 h-4 text-[hsl(240_5%_65%)]" />
            <span className="text-sm font-medium text-white">Concierge</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsla(188,95%,43%,0.1)] border border-[hsla(188,95%,43%,0.2)]">
              <div className="w-2 h-2 rounded-full bg-[hsl(188_95%_43%)] animate-pulse" />
              <span className="text-xs font-medium text-[hsl(188_95%_43%)]">AI Agent · Active</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[hsl(240_6%_18%)] flex items-center justify-center text-xs font-medium">
              AL
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* AI Feed Hero */}
            <section>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Good morning, Alex.
                  </h1>
                  <p className="text-[hsl(240_5%_65%)] text-sm">
                    Your AI assistant has <strong className="text-white font-medium">{visibleCards.length} things</strong> for you to review.
                  </p>
                </div>
                <button className="text-xs text-[hsl(240_5%_65%)] hover:text-white transition-colors underline decoration-dotted underline-offset-4">
                  How does this work?
                </button>
              </div>

              <div className="space-y-3">
                {visibleCards.map((card) => (
                  <div key={card.id} className="aurora-border p-5 flex gap-5 transition-all duration-300">
                    <div className="flex-shrink-0 pt-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${card.categoryColor} 15%, transparent)` }}>
                        <card.icon className="w-5 h-5" style={{ color: card.categoryColor }} />
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: card.categoryColor }}>
                          {card.category}
                        </span>
                      </div>
                      <p className="text-[hsl(240_5%_65%)] text-[15px] leading-relaxed">
                        {card.content}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3 pl-4 border-l border-[hsl(240_6%_14%)] min-w-[200px]">
                      <div className="flex flex-col items-end gap-2 w-full">
                        <button 
                          className="w-full px-4 py-2 bg-[hsl(0_0%_98%)] hover:bg-[hsl(0_0%_90%)] text-[hsl(240_10%_4%)] text-sm font-medium rounded-lg transition-colors"
                          onClick={() => handleDismiss(card.id)}
                        >
                          {card.primaryAction}
                        </button>
                        <div className="flex w-full gap-2">
                          {card.secondaryActions.map((action, i) => (
                            <button 
                              key={i}
                              onClick={() => handleDismiss(card.id)}
                              className="flex-1 px-3 py-1.5 border border-[hsl(240_6%_18%)] hover:bg-[hsl(240_6%_14%)] text-[hsl(240_5%_65%)] hover:text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-[hsl(240_5%_65%)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        ↳ {card.confidence}
                      </span>
                    </div>
                  </div>
                ))}

                {visibleCards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[hsl(240_6%_18%)] rounded-xl bg-[hsla(240,8%,7%,0.3)]">
                    <CheckCircle2 className="w-8 h-8 text-[hsl(158_84%_39%)] mb-3" />
                    <p className="text-[hsl(240_5%_65%)]">All caught up. Your AI is monitoring the schedule.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Secondary: Schedule & KPIs */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Timeline */}
              <div className="lg:col-span-2 glass-panel rounded-xl p-5">
                <h3 className="text-sm font-medium text-[hsl(240_5%_65%)] mb-4 uppercase tracking-wider">Today's Flow</h3>
                
                <div className="relative h-12 mt-6">
                  {/* Timeline track */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-[hsl(240_6%_14%)] rounded-full"></div>
                  
                  {/* Hour markers */}
                  {[9, 11, 13, 15, 17].map(hour => (
                    <div key={hour} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2" style={{ left: `${((hour - 9) / 8) * 100}%` }}>
                      <div className="w-1 h-3 bg-[hsl(240_6%_18%)]"></div>
                      <span className="text-[10px] text-[hsl(240_5%_65%)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {hour}:00
                      </span>
                    </div>
                  ))}

                  {/* Appointments */}
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[hsl(158_84%_39%)] border-2 border-[hsl(240_8%_7%)]" style={{ left: '10%' }} title="Completed"></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[hsl(158_84%_39%)] border-2 border-[hsl(240_8%_7%)]" style={{ left: '25%' }} title="Completed"></div>
                  
                  <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[hsl(188_95%_43%)] shadow-[0_0_10px_hsla(188,95%,43%,0.5)] border-2 border-[hsl(240_8%_7%)] z-10" style={{ left: '45%' }} title="Current: Liam O'Connor"></div>
                  
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[hsl(240_5%_65%)] border-2 border-[hsl(240_8%_7%)]" style={{ left: '60%' }} title="Upcoming: Aisha Bell"></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[hsl(240_5%_65%)] border-2 border-[hsl(240_8%_7%)]" style={{ left: '75%' }} title="Upcoming: Thomas Becker"></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[hsl(240_5%_65%)] border-2 border-[hsl(240_8%_7%)]" style={{ left: '90%' }} title="Upcoming: Naomi Ford"></div>
                </div>

                <div className="mt-8 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-[hsl(240_5%_65%)] uppercase tracking-wider mb-1">Bookings Today</p>
                    <p className="text-xl font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>14</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[hsl(240_5%_65%)] uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-xl font-medium text-[hsl(158_84%_39%)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[hsl(240_5%_65%)] uppercase tracking-wider mb-1">Pending</p>
                    <p className="text-xl font-medium text-[hsl(38_92%_56%)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>3</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[hsl(240_5%_65%)] uppercase tracking-wider mb-1">Total Clients</p>
                    <p className="text-xl font-medium text-[hsl(240_5%_65%)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>287</p>
                  </div>
                </div>
              </div>

              {/* Activity Mini */}
              <div className="glass-panel rounded-xl p-5">
                <h3 className="text-sm font-medium text-[hsl(240_5%_65%)] mb-4 uppercase tracking-wider">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { icon: Sparkles, color: 'hsl(188 95% 43%)', text: "Booking created", time: "10m ago" },
                    { icon: CheckCircle2, color: 'hsl(158 84% 39%)', text: "Service completed", time: "22m ago" },
                    { icon: User, color: 'hsl(258 90% 66%)', text: "New customer profile", time: "1h ago" },
                    { icon: CheckCircle2, color: 'hsl(158 84% 39%)', text: "Booking confirmed", time: "2h ago" },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[hsl(240_6%_14%)]">
                        <act.icon className="w-3 h-3" style={{ color: act.color }} />
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-sm text-white truncate">{act.text}</p>
                      </div>
                      <span className="text-xs text-[hsl(240_5%_65%)] flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </section>
            
          </div>
        </div>
      </div>
    </div>
  );
}
