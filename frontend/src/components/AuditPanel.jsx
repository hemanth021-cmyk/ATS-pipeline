import { useState } from 'react';
import { Title, Label, Body } from './UI';

export function AuditPanel({ entries, loading, error }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-surface-container-low rounded-2xl p-6 shadow-md border border-outline-variant/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 py-3 hover:bg-surface-container/50 px-2 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">history</span>
          <Title size="sm" className="text-on-surface group-hover:text-primary transition-colors">Audit Trail</Title>
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${
          open ? 'rotate-180' : ''
        }`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="mt-6 pt-6 border-t border-outline-variant/15 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 py-8">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Label className="text-on-surface-variant/50">Loading…</Label>
            </div>
          )}
          {error && (
            <div className="bg-error-container/10 border border-error/20 rounded-xl p-4 mb-4">
              <Body size="sm" className="text-error">{error}</Body>
            </div>
          )}
          {!loading && !error && (!entries || entries.length === 0) && (
            <Label className="text-on-surface-variant/50 block text-center py-8">No events yet</Label>
          )}
          {!loading && entries && entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((row) => (
                <div
                  key={row.id}
                  className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <time className="label-xs text-on-surface-variant font-mono block">
                        {new Date(row.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </time>
                      <span className="block label-xs text-on-surface-variant/50 mt-0.5">
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="label-sm font-semibold text-on-surface">
                        {row.from_status || '○ initial'}
                      </span>
                      <span className="text-on-surface-variant/30">→</span>
                      <span className="label-sm font-semibold text-tertiary">
                        {row.to_status}
                      </span>
                    </div>
                  </div>
                  {(row.reason || row.triggered_by) && (
                    <Body size="sm" className="text-on-surface-variant/70 text-xs">
                      {row.reason && <span>{row.reason}</span>}
                      {row.reason && row.triggered_by && <span> · </span>}
                      {row.triggered_by && <span className="text-on-surface-variant/50">{row.triggered_by}</span>}
                    </Body>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
