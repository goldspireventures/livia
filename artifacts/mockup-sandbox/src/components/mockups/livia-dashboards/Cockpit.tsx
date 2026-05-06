import React from "react";
import { Search, Bell, Menu, Activity, Users, Calendar, Settings, Check, X, Clock, CheckCircle2, ChevronRight, Zap } from "lucide-react";

export function Cockpit() {
  const upcomingBookings = [
    { id: 1, customer: { firstName: 'Sarah', lastName: 'Chen' }, service: { name: 'Cut & Style' }, startAt: '2024-05-05T09:00:00Z', duration: 60, status: 'COMPLETED' },
    { id: 2, customer: { firstName: 'Jordan', lastName: 'Reyes' }, service: { name: 'Color Refresh' }, startAt: '2024-05-05T10:00:00Z', duration: 90, status: 'COMPLETED' },
    { id: 3, customer: { firstName: 'Maya', lastName: 'Patel' }, service: { name: 'Blowout' }, startAt: '2024-05-05T12:00:00Z', duration: 45, status: 'CONFIRMED' },
    { id: 4, customer: { firstName: 'Marcus', lastName: 'Williams' }, service: { name: 'Beard Trim' }, startAt: '2024-05-05T13:30:00Z', duration: 30, status: 'CONFIRMED' },
    { id: 5, customer: { firstName: 'Aisha', lastName: 'Bell' }, service: { name: 'Balayage' }, startAt: '2024-05-05T14:00:00Z', duration: 120, status: 'PENDING' },
    { id: 6, customer: { firstName: 'Liam', lastName: 'O\'Connor' }, service: { name: 'Updo' }, startAt: '2024-05-05T16:30:00Z', duration: 60, status: 'CONFIRMED' },
    { id: 7, customer: { firstName: 'Priya', lastName: 'Shah' }, service: { name: 'Highlights' }, startAt: '2024-05-05T17:30:00Z', duration: 90, status: 'PENDING' },
  ];

  const activityFeed = [
    { id: 1, type: 'BOOKING_COMPLETED', message: 'Sarah Chen completed Cut & Style', createdAt: '10:05 AM' },
    { id: 2, type: 'BOOKING_CONFIRMED', message: 'Maya Patel confirmed Blowout', createdAt: '09:42 AM' },
    { id: 3, type: 'CUSTOMER_CREATED', message: 'New profile: Jordan Reyes', createdAt: '09:15 AM' },
    { id: 4, type: 'BOOKING_CREATED', message: 'Aisha Bell requested Balayage', createdAt: '08:50 AM' },
    { id: 5, type: 'PAYMENT_RECEIVED', message: '$120 collected from Sarah Chen', createdAt: '10:10 AM' },
    { id: 6, type: 'AI_ACTION', message: 'AI rescheduled Marcus Williams to 1:30 PM', createdAt: '07:30 AM' },
    { id: 7, type: 'BOOKING_COMPLETED', message: 'Jordan Reyes completed Color Refresh', createdAt: '11:35 AM' },
    { id: 8, type: 'CUSTOMER_CREATED', message: 'New profile: Priya Shah', createdAt: 'Yesterday' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden text-[hsl(0,0%,98%)] bg-[hsl(240,10%,4%)]" style={{ fontFamily: "'Geist', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* Sidebar */}
      <aside className="w-64 border-r border-[hsl(240,6%,14%)] bg-[hsl(240,10%,4%)] flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-[hsl(240,6%,14%)] gap-3">
          <div className="w-6 h-6 rounded flex items-center justify-center font-display font-bold text-xs" style={{ background: 'linear-gradient(135deg, hsl(188 95% 43%) 0%, hsl(258 90% 66%) 100%)' }}>
            B
          </div>
          <span className="font-display font-bold text-base tracking-tight">Livia</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-mono text-[hsl(240,5%,65%)] uppercase tracking-wider mb-2 px-3 pt-2">Overview</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-[hsla(188,95%,43%,0.1)] text-[hsl(188,95%,43%)] text-sm font-medium">
            <Activity className="w-4 h-4" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[hsl(240,6%,14%)] text-[hsl(240,5%,65%)] hover:text-white text-sm font-medium transition-colors">
            <Calendar className="w-4 h-4" /> Bookings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[hsl(240,6%,14%)] text-[hsl(240,5%,65%)] hover:text-white text-sm font-medium transition-colors">
            <Users className="w-4 h-4" /> Customers
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[hsl(240,6%,14%)] text-[hsl(240,5%,65%)] hover:text-white text-sm font-medium transition-colors">
            <Settings className="w-4 h-4" /> Staff & Services
          </button>
        </nav>

        <div className="p-4 border-t border-[hsl(240,6%,14%)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[hsl(240,6%,18%)] flex items-center justify-center text-xs font-medium">
            VS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Vela Studio</div>
            <div className="text-[10px] text-[hsl(240,5%,65%)] font-mono truncate">Pro Plan</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[hsl(240,10%,4%)] h-screen overflow-y-auto no-scrollbar">
        {/* Top Bar */}
        <header className="h-14 border-b border-[hsl(240,6%,14%)] flex items-center justify-between px-6 shrink-0 sticky top-0 bg-[hsl(240,10%,4%)]/90 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-semibold text-sm">Today's flight plan</h1>
            <div className="w-1 h-1 rounded-full bg-[hsl(240,6%,18%)]"></div>
            <span className="text-xs text-[hsl(240,5%,65%)]">Tuesday, May 5 · 14 today · 3 to confirm</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[hsla(188,95%,43%,0.3)] bg-[hsla(188,95%,43%,0.05)]">
              <Zap className="w-3.5 h-3.5 text-[hsl(188,95%,43%)]" />
              <span className="text-[10px] font-medium text-[hsl(188,95%,43%)]">AI agent: 2 actions ready</span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-mono text-[hsl(240,5%,65%)] bg-[hsl(240,6%,14%)] px-2 py-1 rounded border border-[hsl(240,6%,18%)]">
              <span>⌘K</span>
              <span>Quick Actions</span>
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 flex flex-col gap-6">
          
          {/* Top Row: KPI Strip + Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
            {/* KPI Strip */}
            <div className="lg:col-span-2 grid grid-cols-4 gap-4">
              <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg p-4 flex flex-col justify-between">
                <div className="text-xs text-[hsl(240,5%,65%)] font-medium">Today's Bookings</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <div className="font-mono text-2xl">14</div>
                  <div className="text-[10px] text-[hsl(158,84%,39%)] font-mono">+2 vs avg</div>
                </div>
              </div>
              <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg p-4 flex flex-col justify-between">
                <div className="text-xs text-[hsl(240,5%,65%)] font-medium">Pending</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <div className="font-mono text-2xl text-[hsl(38,92%,56%)]">3</div>
                  <div className="text-[10px] text-[hsl(240,5%,65%)] font-mono">needs action</div>
                </div>
              </div>
              <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg p-4 flex flex-col justify-between">
                <div className="text-xs text-[hsl(240,5%,65%)] font-medium">Completed</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <div className="font-mono text-2xl text-[hsl(158,84%,39%)]">5</div>
                  <div className="text-[10px] text-[hsl(240,5%,65%)] font-mono">35% of day</div>
                </div>
              </div>
              <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg p-4 flex flex-col justify-between">
                <div className="text-xs text-[hsl(240,5%,65%)] font-medium">Total Customers</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <div className="font-mono text-2xl">287</div>
                  <div className="text-[10px] text-[hsl(158,84%,39%)] font-mono">+12 this wk</div>
                </div>
              </div>
            </div>

            {/* Queue Panel */}
            <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg flex flex-col overflow-hidden">
              <div className="h-10 border-b border-[hsl(240,6%,14%)] flex items-center px-4 justify-between bg-[hsla(240,8%,7%,0.6)]">
                <div className="text-xs font-semibold">Action Queue</div>
                <div className="text-[10px] font-mono bg-[hsl(38,92%,56%)]/10 text-[hsl(38,92%,56%)] px-1.5 rounded">3 PENDING</div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {[
                  { name: 'Aisha Bell', svc: 'Balayage', time: '14:00' },
                  { name: 'Priya Shah', svc: 'Highlights', time: '17:30' },
                  { name: 'Zoe Martin', svc: 'Consult', time: '18:15' }
                ].map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-[hsl(240,6%,10%)] border border-[hsl(240,6%,14%)] hover:border-[hsl(240,6%,18%)] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">{q.name}</span>
                      <span className="text-[10px] text-[hsl(240,5%,65%)] font-mono">{q.time} · {q.svc}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="w-6 h-6 rounded bg-[hsl(240,6%,14%)] hover:bg-[hsl(0,84%,60%)]/20 hover:text-[hsl(0,84%,60%)] flex items-center justify-center transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                      <button className="w-6 h-6 rounded bg-[hsl(188,95%,43%)]/20 text-[hsl(188,95%,43%)] hover:bg-[hsl(188,95%,43%)]/30 flex items-center justify-center transition-colors">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Timeline */}
          <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg overflow-hidden flex flex-col shrink-0">
            <div className="h-10 border-b border-[hsl(240,6%,14%)] flex items-center px-4 justify-between bg-[hsla(240,8%,7%,0.6)]">
              <div className="text-xs font-semibold">Live Timeline</div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[hsl(158,84%,39%)]"></div> Completed</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[hsl(188,95%,43%)]"></div> Confirmed</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[hsl(38,92%,56%)]"></div> Pending</span>
              </div>
            </div>
            
            <div className="relative h-48 overflow-x-auto no-scrollbar bg-[hsl(240,10%,4%)]">
              {/* Grid Lines & Time Labels */}
              <div className="absolute top-0 left-0 h-full min-w-full flex" style={{ width: '1200px' }}>
                {Array.from({ length: 13 }).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-dashed border-[hsl(240,6%,14%)] relative h-full">
                    <div className="absolute top-2 -left-3 text-[10px] font-mono text-[hsl(240,5%,65%)] bg-[hsl(240,10%,4%)] px-1 z-10">
                      {8 + i}:00
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Time Line (~ 11:15 AM) */}
              <div className="absolute top-0 bottom-0 w-px bg-[hsl(188,95%,43%)] z-20" style={{ left: 'calc(1200px * (3.25 / 12))' }}>
                <div className="absolute top-8 -left-5 bg-[hsl(188,95%,43%)] text-[hsl(240,10%,4%)] text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold shadow-[0_0_10px_hsla(188,95%,43%,0.5)]">
                  11:15
                </div>
              </div>

              {/* Blocks */}
              <div className="absolute top-16 left-0 right-0 h-24">
                {/* 9:00 - 10:00 (Completed) */}
                <div className="absolute top-0 h-10 bg-[hsl(158,84%,39%)]/10 border border-[hsl(158,84%,39%)]/30 rounded px-2 py-1 overflow-hidden" style={{ left: 'calc(1200px * (1/12))', width: 'calc(1200px * (1/12))' }}>
                  <div className="text-[10px] font-bold text-[hsl(158,84%,39%)] truncate">S. Chen</div>
                  <div className="text-[9px] text-[hsl(158,84%,39%)]/70 font-mono truncate">Cut</div>
                </div>

                {/* 10:00 - 11:30 (Completed) */}
                <div className="absolute top-12 h-10 bg-[hsl(158,84%,39%)]/10 border border-[hsl(158,84%,39%)]/30 rounded px-2 py-1 overflow-hidden" style={{ left: 'calc(1200px * (2/12))', width: 'calc(1200px * (1.5/12))' }}>
                  <div className="text-[10px] font-bold text-[hsl(158,84%,39%)] truncate">J. Reyes</div>
                  <div className="text-[9px] text-[hsl(158,84%,39%)]/70 font-mono truncate">Color</div>
                </div>

                {/* 12:00 - 12:45 (Confirmed) */}
                <div className="absolute top-0 h-10 bg-[hsl(188,95%,43%)]/10 border border-[hsl(188,95%,43%)]/50 rounded px-2 py-1 overflow-hidden shadow-[0_0_15px_hsla(188,95%,43%,0.1)]" style={{ left: 'calc(1200px * (4/12))', width: 'calc(1200px * (0.75/12))' }}>
                  <div className="text-[10px] font-bold text-[hsl(188,95%,43%)] truncate">M. Patel</div>
                  <div className="text-[9px] text-[hsl(188,95%,43%)]/70 font-mono truncate">Blowout</div>
                </div>

                {/* 13:30 - 14:00 (Confirmed) */}
                <div className="absolute top-12 h-10 bg-[hsl(188,95%,43%)]/10 border border-[hsl(188,95%,43%)]/50 rounded px-2 py-1 overflow-hidden" style={{ left: 'calc(1200px * (5.5/12))', width: 'calc(1200px * (0.5/12))' }}>
                  <div className="text-[10px] font-bold text-[hsl(188,95%,43%)] truncate">M. Will</div>
                  <div className="text-[9px] text-[hsl(188,95%,43%)]/70 font-mono truncate">Trim</div>
                </div>

                {/* 14:00 - 16:00 (Pending) */}
                <div className="absolute top-0 h-10 bg-[hsl(38,92%,56%)]/10 border border-[hsl(38,92%,56%)]/50 rounded px-2 py-1 overflow-hidden border-dashed" style={{ left: 'calc(1200px * (6/12))', width: 'calc(1200px * (2/12))' }}>
                  <div className="text-[10px] font-bold text-[hsl(38,92%,56%)] truncate">A. Bell</div>
                  <div className="text-[9px] text-[hsl(38,92%,56%)]/70 font-mono truncate">Balayage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            
            {/* Activity Log */}
            <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg flex flex-col min-h-[240px]">
              <div className="h-10 border-b border-[hsl(240,6%,14%)] flex items-center px-4 justify-between bg-[hsla(240,8%,7%,0.6)]">
                <div className="text-xs font-semibold">Activity Log</div>
              </div>
              <div className="flex-1 p-0 flex flex-col">
                {activityFeed.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-[hsl(240,6%,14%)] last:border-0 hover:bg-[hsl(240,6%,10%)] transition-colors">
                    <div className="mt-0.5">
                      {item.type.includes('COMPLETED') && <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(158,84%,39%)]" />}
                      {item.type.includes('CONFIRMED') && <Check className="w-3.5 h-3.5 text-[hsl(188,95%,43%)]" />}
                      {item.type.includes('CREATED') && <Users className="w-3.5 h-3.5 text-[hsl(258,90%,66%)]" />}
                      {item.type.includes('AI') && <Zap className="w-3.5 h-3.5 text-[hsl(188,95%,43%)]" />}
                      {item.type.includes('PAYMENT') && <div className="w-3.5 h-3.5 rounded-full border border-[hsl(158,84%,39%)] text-[hsl(158,84%,39%)] flex items-center justify-center text-[8px] font-bold">$</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[hsl(0,0%,90%)] truncate">{item.message}</div>
                    </div>
                    <div className="text-[10px] text-[hsl(240,5%,65%)] font-mono shrink-0 pt-0.5">{item.createdAt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff on Shift */}
            <div className="bg-[hsl(240,8%,7%)] border border-[hsl(240,6%,14%)] rounded-lg flex flex-col min-h-[240px]">
              <div className="h-10 border-b border-[hsl(240,6%,14%)] flex items-center px-4 justify-between bg-[hsla(240,8%,7%,0.6)]">
                <div className="text-xs font-semibold">Staff on Shift</div>
                <div className="text-[10px] font-mono text-[hsl(240,5%,65%)]">3 Active</div>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-4">
                {[
                  { name: 'Elena R.', role: 'Senior Stylist', util: 85, next: '12:00 PM · M. Patel', status: 'available' },
                  { name: 'David K.', role: 'Colorist', util: 100, next: 'In Progress · J. Reyes', status: 'busy' },
                  { name: 'Sam T.', role: 'Barber', util: 40, next: '1:30 PM · M. Williams', status: 'available' },
                ].map((staff, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-[hsl(240,6%,18%)] flex items-center justify-center text-[10px] font-bold border border-[hsl(240,6%,24%)]">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[hsl(240,8%,7%)] ${staff.status === 'available' ? 'bg-[hsl(158,84%,39%)]' : 'bg-[hsl(38,92%,56%)]'}`}></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{staff.name}</span>
                          <span className="text-[10px] text-[hsl(240,5%,65%)]">{staff.role}</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[hsl(240,5%,65%)] text-right">
                        <div>Next</div>
                        <div className="text-[hsl(0,0%,98%)]">{staff.next}</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[hsl(240,6%,14%)] rounded-full overflow-hidden flex">
                      <div className="h-full bg-[hsl(188,95%,43%)]" style={{ width: `${staff.util}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
