'use client';
import {useEffect, useState, type ReactNode} from 'react';
import {Icon} from './Icons';
import {cx, iconBtn} from '@/lib/ui';
/** Side panel that slides in from the right, with a dimmed background. */
export default function Drawer({open, onClose, title, label, children, foot, bodyRef, id}: {
  open: boolean; onClose: () => void; title: ReactNode; label: string; children: ReactNode; foot?: ReactNode; bodyRef?: React.Ref<HTMLDivElement>; id?: string;
}) {
  // keep the content on screen while the panel slides closed
  const [show, setShow] = useState(open);
  useEffect(() => { if (open){ setShow(true); return; } const t = setTimeout(() => setShow(false), 300); return () => clearTimeout(t); }, [open]);
  return (
    <>
      <div className={cx('fixed inset-0 z-40 bg-black/35 transition-opacity duration-200', open ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={onClose} />
      <aside id={id} aria-label={label} aria-hidden={!open} inert={!open}
        className={cx('fixed right-0 top-0 z-50 flex h-full w-[min(560px,100%)] flex-col border-l border-line bg-surface transition-transform duration-250', open ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <h3 className="m-0 flex-1 text-[17px] font-semibold">{title}</h3>
          <button className={iconBtn} aria-label="Close" data-close onClick={onClose}><Icon.x /></button>
        </div>
        <div ref={bodyRef} className="flex-1 overflow-auto p-4">{show && children}</div>
        {foot && <div className="flex justify-between gap-2 border-t border-line px-4 py-3">{foot}</div>}
      </aside>
    </>
  );
}
