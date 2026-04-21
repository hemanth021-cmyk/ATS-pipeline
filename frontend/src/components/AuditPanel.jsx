import { useState } from 'react';
import { Title, Label, Body, TonalContainer } from './UI';

export function AuditPanel({ entries, loading, error }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group relative flex items-center justify-between p-6 bg-surface-container-low rounded-3xl transition-all hover:bg-surface-container hover:shadow-md overflow-hidden"
      >
        <div className="flex items-center gap-4 z-10">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-highest/50">
            <span className="material-symbols-outlined text-[20px] text-primary">history</span>
          </div>
          <div>
            <Title size="sm" className="font-bold tracking-tight">Audit Trail / History</Title>
            <p className="text-[11px] opacity-40 font-medium uppercase tracking-widest text-left">
              Pipeline State transitions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 z-10">
          {entries?.length > 0 && (
            <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-black opacity-40">
              {entries.length} EVENTS
            </span>
          )}
          <span className={`material-symbols-outlined text-primary/40 transition-transform duration-500 ${
            open ? 'rotate-180' : ''
          }`}>
            stat_1
          </span>
        </div>
        {/* Subtle background flair */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      </button>

      {/* Panel Body */}
      {open && (
        <TonalContainer className="flex flex-col gap-3 animate-fade-in !bg-transparent p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <Label className="uppercase tracking-widest font-black text-[10px]">Synchronizing...</Label>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-error-container/10 rounded-3xl border border-error/5">
              <Body size="sm" className="text-error font-medium">{error}</Body>
            </div>
          ) : !entries || entries.length === 0 ? (
            <div className="py-20 text-center opacity-20">
              <span className="material-symbols-outlined text-[48px] mb-2">auto_stories</span>
              <Label className="block uppercase tracking-widest font-black text-[10px]">No History Yet</Label>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((row) => (
                <div
                  key={row.id}
                  className="group flex flex-col gap-3 p-6 bg-surface-container-lowest rounded-3xl transition-all hover:bg-surface-bright hover:shadow-lg border border-transparent hover:border-surface-container"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,87,189,0.4)]" />
                      <time className="text-[12px] font-bold text-on-surface opacity-80">
                        {new Date(row.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                      <span className="text-[10px] uppercase font-black opacity-20 tracking-tighter">
                        {new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
                      <span className="text-[10px] font-bold opacity-40 uppercase">{row.from_status || 'Start'}</span>
                      <span className="text-[10px] opacity-20">→</span>
                      <span className="text-[10px] font-black text-secondary uppercase">{row.to_status}</span>
                    </div>
                  </div>
                  
                  {row.reason && (
                    <p className="text-[13px] font-medium text-on-surface-variant leading-relaxed pl-4.5 border-l-2 border-surface-container">
                      {row.reason}
                    </p>
                  )}
                  
                  {row.triggered_by && (
                    <div className="flex items-center gap-2 pl-5 opacity-40">
                      <span className="text-[10px]">BY</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{row.triggered_by}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TonalContainer>
      )}
    </div>
  );
}
