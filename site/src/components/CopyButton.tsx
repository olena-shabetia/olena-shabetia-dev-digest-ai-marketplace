import { useEffect, useRef, useState } from 'react';

type State = 'idle' | 'copied' | 'failed';

function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

interface Props {
  text: string;
  label?: string;
  className?: string;
  /** Called when the browser refused to copy, so the caller can select the text instead. */
  onFail?: () => void;
}

export function CopyButton({ text, label = 'Copy', className = 'btn btn-secondary btn-sm', onFail }: Props) {
  const [state, setState] = useState<State>('idle');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = legacyCopy(text);
    }
    if (!ok) onFail?.();
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2000);
  }

  return (
    <>
      <button type="button" className={`${className}${state === 'copied' ? ' btn-copied' : ''}`} onClick={copy}>
        {state === 'copied' ? 'Copied ✓' : state === 'failed' ? 'Select and copy' : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Copied to clipboard' : state === 'failed' ? 'Copy failed, the text is selected' : ''}
      </span>
    </>
  );
}
