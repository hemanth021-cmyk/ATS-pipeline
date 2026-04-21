import { Body, Label } from './UI';

export function CapacityBar({ activeCount, capacity }) {
  const a = Number(activeCount) || 0;
  const c = Number(capacity) || 1;
  const pct = Math.min(100, Math.round((a / c) * 100));
  const isLow = pct < 50;
  const isMedium = pct >= 50 && pct < 80;
  const isHigh = pct >= 80;

  return (
    <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col gap-6 relative overflow-hidden group">
      {/* Editorial Header */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${
              isHigh ? 'bg-error animate-pulse' : 'bg-secondary shadow-[0_0_8px_rgba(0,87,189,0.4)]'
            }`} />
            <h3 className="text-title-sm font-bold tracking-tight">Pipeline Pulse</h3>
          </div>
          <p className="text-[11px] opacity-40 font-medium uppercase tracking-widest">
            Capacity management & occupancy
          </p>
        </div>
        <div className="text-right">
          <div className="text-display-sm font-black tracking-tighter opacity-10 leading-none">
            {pct}%
          </div>
          <Label size="sm" className="font-bold opacity-60 uppercase tracking-widest text-[10px]">
            {isHigh ? 'Critical' : isMedium ? 'Warning' : 'Optimal'}
          </Label>
        </div>
      </div>

      <div className="flex items-end gap-6 relative z-10">
        {/* Metric Large */}
        <div className="flex items-baseline gap-2">
          <span className="text-[3.5rem] font-bold tracking-tighter text-on-surface leading-none">
            {a}
          </span>
          <span className="text-display-sm font-black opacity-10 tracking-widest">/ {c}</span>
        </div>

        {/* Progress bar with enhanced styling */}
        <div className="flex-1 mb-3">
          <div className="relative h-4 bg-surface-container rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                isHigh ? 'bg-error shadow-[0_0_20px_rgba(179,27,37,0.4)]' : 'bg-gradient-to-r from-secondary to-tertiary'
              }`}
              style={{ 
                width: `${pct}%`,
                background: !isHigh ? 'linear-gradient(90deg, var(--secondary) 0%, var(--tertiary) 100%)' : undefined 
              }}
            />
          </div>
        </div>
      </div>

      {/* Status indicator with icon */}
      <div className="flex items-center gap-4 py-3 px-4 bg-surface-container-lowest rounded-2xl relative z-10 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
          <span className={`material-symbols-outlined text-[18px] ${
            isHigh ? 'text-error animate-pulse' : 'text-secondary'
          }`}>
            {isHigh ? 'notifications_active' : isMedium ? 'info' : 'analytics'}
          </span>
        </div>
        <div className="flex-1">
          <Body size="sm" className="font-bold text-[12px] opacity-80 leading-tight">
            {isHigh ? 'Critical capacity reached' : isMedium ? 'Moderately occupied' : 'Healthy throughput'}
          </Body>
          <p className="text-[10px] opacity-40 font-medium uppercase tracking-widest mt-0.5">
            {isHigh ? 'Waitlist active' : isMedium ? 'Next slots soon' : 'Fast promotion active'}
          </p>
        </div>
      </div>

      {/* Background Flair */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] group-hover:bg-secondary/10 transition-all duration-1000" />
    </div>
  );
}
