import { Body, Label } from './UI';

export function CapacityBar({ activeCount, capacity }) {
  const a = Number(activeCount) || 0;
  const c = Number(capacity) || 1;
  const pct = Math.min(100, Math.round((a / c) * 100));
  const isLow = pct < 50;
  const isMedium = pct >= 50 && pct < 80;
  const isHigh = pct >= 80;

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 shadow-md border border-outline-variant/10">
      <div className="flex items-end justify-between mb-5">
        <div className="flex-1">
          <Label className="text-on-surface-variant block mb-2">Pipeline Occupancy</Label>
          <div className="flex items-baseline gap-1">
            <Body className="font-semibold text-on-surface">{a}</Body>
            <span className="text-on-surface-variant/40">/</span>
            <Body className="text-on-surface-variant/70">{c} slots</Body>
          </div>
        </div>
        <div className="text-right">
          <Body size="sm" className={`font-mono font-semibold transition-colors ${
            isHigh ? 'text-error' : isMedium ? 'text-tertiary' : 'text-tertiary'
          }`}>
            {pct}%
          </Body>
          <Label className="text-xs text-on-surface-variant/50 block mt-0.5">
            {isHigh ? 'Critical' : isMedium ? 'Warning' : 'Optimal'}
          </Label>
        </div>
      </div>

      {/* Progress bar with enhanced styling */}
      <div className="relative h-2.5 bg-surface-container rounded-full overflow-hidden border border-outline-variant/10 shadow-sm mb-4">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isHigh ? 'bg-error shadow-lg shadow-error/20' : isMedium ? 'bg-tertiary shadow-lg shadow-tertiary/20' : 'bg-tertiary shadow-lg shadow-tertiary/15'
          }`}
          style={{ width: `${pct}%` }}
        />
        {pct > 100 && (
          <div className="absolute inset-y-0 right-0 w-1 bg-error animate-pulse" />
        )}
      </div>

      {/* Status indicator with icon */}
      <div className="flex items-center gap-2">
        {isHigh && (
          <>
            <span className="material-symbols-outlined text-sm text-error flex-shrink-0">warning</span>
            <Body size="sm" className="text-error/80 text-xs">Nearing capacity</Body>
          </>
        )}
        {isMedium && (
          <>
            <span className="material-symbols-outlined text-sm text-tertiary flex-shrink-0">info</span>
            <Body size="sm" className="text-tertiary/80 text-xs">Monitor pipeline health</Body>
          </>
        )}
        {isLow && (
          <>
            <span className="material-symbols-outlined text-sm text-tertiary flex-shrink-0">trending_up</span>
            <Body size="sm" className="text-tertiary/80 text-xs">Capacity available</Body>
          </>
        )}
      </div>
    </div>
  );
}
