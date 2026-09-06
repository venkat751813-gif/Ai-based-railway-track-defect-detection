import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ScanLine, TrainTrack, AlertTriangle, Bell, LineChart, Radio } from 'lucide-react';

const nav = [
  { to: '/', label: 'Command', icon: LayoutDashboard, end: true },
  { to: '/inspect', label: 'AI Inspection', icon: ScanLine },
  { to: '/sections', label: 'Track Sections', icon: TrainTrack },
  { to: '/defects', label: 'Defect Log', icon: AlertTriangle },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-panel/70 backdrop-blur">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-amber/15 border border-amber/40 flex items-center justify-center">
            <div className="font-mono text-amber font-bold text-lg leading-none">R</div>
          </div>
          <div>
            <div className="font-mono font-bold tracking-tight text-ink">RAILGUARD<span className="text-amber">.AI</span></div>
            <div className="font-mono text-[10px] text-ink-mute uppercase tracking-widest">Track Vision v4.2</div>
          </div>
        </div>
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors shrink-0 ${
                  isActive
                    ? 'bg-amber/10 text-amber border border-amber/30'
                    : 'text-ink-dim hover:text-ink hover:bg-panel-2 border border-transparent'
                }`
              }
            >
              <Icon size={16} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block p-4 mt-4 mx-3 rounded-md border border-border bg-panel-2">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={12} className="text-ok pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ok">SYS ONLINE</span>
          </div>
          <div className="font-mono text-[11px] text-ink-mute leading-relaxed">
            Model: RT-Vision v4.2<br />
            Inference: 42ms avg<br />
            Coverage: 99.7%
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
