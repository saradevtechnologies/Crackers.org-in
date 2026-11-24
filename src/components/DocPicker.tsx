'use client';

import { useRef } from 'react';
import { useT } from './Lang';
import { ErrorNote } from './ui';

export const DOC_ACCEPT = 'application/pdf,image/jpeg,image/png';

/** One document slot: choose a PDF/JPG/PNG (on phones this also offers the camera), show its name, remove it. */
export function DocPicker({
  id,
  label,
  hint,
  file,
  onChange,
  error,
  optional,
}: {
  id: string;
  label: string;
  hint?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string | null;
  optional?: boolean;
}) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {label} {optional && <span className="font-normal text-muted">({t('common.optional')})</span>}
      </span>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line bg-cream p-3">
        {file ? (
          <>
            <span aria-hidden="true">{file.type === 'application/pdf' ? '📄' : '🖼️'}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
            <span className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            <button
              type="button"
              className="btn-ghost min-h-[44px]"
              onClick={() => {
                onChange(null);
                if (input.current) input.current.value = '';
              }}
            >
              {t('bulk.f.removeFile')}
            </button>
          </>
        ) : (
          <label htmlFor={id} className="btn-ghost min-h-[44px] cursor-pointer">
            📎 {t('bulk.f.chooseFile')}
          </label>
        )}
        <input
          ref={input}
          id={id}
          type="file"
          accept={DOC_ACCEPT}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
      <p className="text-xs text-muted">{hint ?? t('bulk.f.fileHint')}</p>
      <ErrorNote msg={error} />
    </div>
  );
}

export function fileMeta(f: File) {
  return { name: f.name, size: f.size, type: f.type };
}
