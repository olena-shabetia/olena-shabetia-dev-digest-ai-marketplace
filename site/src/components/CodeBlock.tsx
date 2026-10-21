import { useRef } from 'react';
import { CopyButton } from './CopyButton';

/** Monospace block that scrolls horizontally (commands never wrap) with a copy button. */
export function CodeBlock({ code, label = 'Copy' }: { code: string; label?: string }) {
  const pre = useRef<HTMLPreElement>(null);
  const select = () => {
    if (!pre.current) return;
    const range = document.createRange();
    range.selectNodeContents(pre.current);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };
  return (
    <div className="code">
      <pre ref={pre} tabIndex={0}>
        {code}
      </pre>
      <CopyButton text={code} label={label} onFail={select} />
    </div>
  );
}
