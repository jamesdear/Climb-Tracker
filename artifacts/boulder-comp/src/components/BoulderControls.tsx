import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { useLogAttemptRecord } from '@workspace/api-client-react';
import type { AttemptLogResult, BoulderState } from '@workspace/api-client-react';

const THUMB = 56;
const PAD = 4;

function CompleteSlider({ checked, disabled, onTrigger }: { checked: boolean; disabled: boolean; onTrigger: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const offset = useRef(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const travel = Math.max(1, width - THUMB - PAD * 2);
  const pos = drag ?? (checked ? 1 : 0);
  const clamp = (n: number) => Math.min(1, Math.max(0, n));

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    offset.current = e.clientX - pos * travel;
    setDrag(pos);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    setDrag(clamp((e.clientX - offset.current) / travel));
  };
  const up = () => {
    if (drag === null) return;
    const crossed = checked ? drag < 0.2 : drag > 0.8;
    setDrag(null);
    if (crossed) onTrigger();
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const forward = !checked && (e.key === 'ArrowRight' || e.key === 'End');
    const back = checked && (e.key === 'ArrowLeft' || e.key === 'Home');
    if (forward || back || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTrigger();
    }
  };

  return (
    <div className={`slide-track ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}`} ref={track}>
      <span className="slide-label">{checked ? 'Completed · slide back to undo' : 'Slide to mark completed'}</span>
      <div
        className={`slide-thumb ${drag !== null ? 'dragging' : ''}`}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Completed"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={checked ? 1 : 0}
        aria-valuetext={checked ? 'Completed' : 'Not completed'}
        aria-disabled={disabled}
        style={{ transform: `translateX(${pos * travel}px)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={key}
        data-testid="slider-boulder-completed"
      >
        {checked ? <Check size={22} /> : <span aria-hidden="true">&rsaquo;</span>}
      </div>
    </div>
  );
}

function Spinner({ value, min, max, onChange, disabled, label, testId }: {
  value: number; min: number; max: number; onChange: (n: number) => void; disabled: boolean; label: string; testId: string;
}) {
  return (
    <div className="spinner" role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || value <= min} onClick={() => onChange(value - 1)} data-testid={`button-${testId}-decrement`}><Minus size={22} /></button>
      <output className="spinner-value" aria-live="polite" data-testid={`text-${testId}`}>{value}</output>
      <button type="button" aria-label={`Increase ${label}`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} data-testid={`button-${testId}-increment`}><Plus size={22} /></button>
    </div>
  );
}

type Props = {
  scorecardId: string;
  boulder: BoulderState;
  readOnly: boolean;
  correctionMode?: boolean;
  onClose: () => void;
  refresh: () => Promise<unknown>;
  onSaved?: (result: AttemptLogResult) => void;
};

export function BoulderControls({ scorecardId, boulder, readOnly, correctionMode, onClose, refresh, onSaved }: Props) {
  const log = useLogAttemptRecord();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<null | 'complete' | 'revert'>(null);
  const [total, setTotal] = useState(1);

  const write = async (attempts: number, completed: boolean) => {
    if (inFlight.current || readOnly) return false;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await log.mutateAsync({
        scorecardId,
        boulderNumber: boulder.boulderNumber,
        data: { attempts, completed, expectedRecordId: boulder.currentRecordId },
      });
      await refresh();
      onSaved?.(result);
      return true;
    } catch (e) {
      const apiError = e as { status?: number; data?: { error?: string } };
      const status = apiError?.status;
      if (status === 409) {
        setError('This boulder was changed on another device. The latest result has been loaded. Check it and try again.');
        await refresh().catch(() => undefined);
      } else if (status === 401) {
        setError('Your session has expired. Sign in again before making this correction.');
      } else if (status === 403) {
        setError(apiError.data?.error || 'Scoring is closed. Only an administrator can make corrections from the organizer dashboard.');
        await refresh().catch(() => undefined);
      } else if (status && status >= 400 && status < 500) {
        setError(apiError.data?.error || 'This change could not be saved. Refresh the scorecard and try again.');
      } else if (status && status >= 500) {
        setError('The server could not save this change. Please try again.');
      } else {
        setError('Could not save. Check your connection and try again.');
      }
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const openComplete = () => {
    setTotal(boulder.completed ? Math.max(1, boulder.attempts) : Math.min(4, boulder.attempts + 1));
    setConfirm('complete');
  };
  const openRevert = () => {
    setTotal(Math.min(4, boulder.attempts));
    setConfirm('revert');
  };
  const confirmSave = async () => {
    const ok = await write(total, confirm === 'complete');
    if (ok) setConfirm(null);
  };

  const n = String(boulder.boulderNumber).padStart(2, '0');

  return (
    <div className="modal-backdrop" role="presentation" onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <section className="modal sheet" role="dialog" aria-modal="true" aria-labelledby="boulder-title" data-testid="modal-log-boulder">
        <div className="sheet-head">
          <div>
            <span className="eyebrow">{correctionMode ? 'Organizer correction' : boulder.completed ? 'Completed' : 'Not completed'}</span>
            <h2 id="boulder-title" className="sheet-title">Boulder {n}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={busy} aria-label="Close" data-testid="button-close-modal"><X size={20} /></button>
        </div>

        {confirm ? (
          <div data-testid={`panel-confirm-${confirm}`}>
            <p className="sheet-q">{confirm === 'complete' ? 'Total attempts including the completing attempt' : 'Failed attempts to keep'}</p>
            <Spinner
              value={total}
              min={confirm === 'complete' ? 1 : 0}
              max={4}
              onChange={setTotal}
              disabled={busy}
              label={confirm === 'complete' ? 'total attempts' : 'failed attempts'}
              testId="confirm-attempts"
            />
            <p className="muted small-note">
              {confirm === 'complete' ? 'Saved as completed only when you confirm.' : 'Marks this boulder as not completed. Previous records are kept.'}
            </p>
            {error && <p className="form-error" role="alert" data-testid="text-boulder-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn outline" disabled={busy} onClick={() => { setConfirm(null); setError(''); }} data-testid="button-cancel-confirm">Cancel</button>
              <button type="button" className="btn coral" disabled={busy} onClick={confirmSave} data-testid="button-confirm-boulder">
                {busy ? 'Saving…' : confirm === 'complete' ? 'Confirm completed' : 'Confirm not completed'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="sheet-summary" data-testid="text-boulder-summary">
              <strong>{boulder.points} pts</strong>
              <span>{boulder.attempts} {boulder.attempts === 1 ? 'attempt' : 'attempts'}{boulder.completed ? ' · completed' : ''}</span>
            </div>

            <div className="control-block">
              <span className="control-label">Completed</span>
              <CompleteSlider checked={boulder.completed} disabled={readOnly || busy} onTrigger={boulder.completed ? openRevert : openComplete} />
            </div>

            <div className="control-block">
              <span className="control-label">Failed attempts</span>
              {boulder.completed ? (
                <div className="completed-edit">
                  <span className="muted">Completed in {boulder.attempts} {boulder.attempts === 1 ? 'attempt' : 'attempts'}.</span>
                  <button type="button" className="btn outline small" disabled={readOnly || busy} onClick={openComplete} data-testid="button-edit-total-attempts">Change attempts</button>
                </div>
              ) : (
                <Spinner
                  value={boulder.attempts}
                  min={0}
                  max={4}
                  onChange={v => void write(v, false)}
                  disabled={readOnly || busy}
                  label="failed attempts"
                  testId="failed-attempts"
                />
              )}
              {!boulder.completed && <p className="muted small-note">Each change saves immediately. Use minus to correct a mistake.</p>}
            </div>

            {busy && <p className="muted" role="status">Saving…</p>}
            {error && <p className="form-error" role="alert" data-testid="text-boulder-error">{error}</p>}
            {readOnly && <p className="muted small-note" data-testid="text-boulder-readonly">This event is not open. Results are read-only.</p>}
          </>
        )}
      </section>
    </div>
  );
}
