'use client';
import {useApp} from './AppProvider';
import {usePlayer} from './PlayerProvider';
import {Icon} from './Icons';
import {btn, chip, cx} from '@/lib/ui';
export function PlayAll({label, className}: {label: string; className?: string}) {
  const {playFirst} = usePlayer();
  return <button className={cx(btn, className)} data-playall onClick={playFirst}><Icon.play /> {label}</button>;
}
export function ChangeTranslations({className}: {className?: string}) {
  const {openSettings} = useApp();
  return <button className={cx(className ?? cx(chip, 'border-0'), 'whitespace-nowrap')} id="openSet" onClick={() => openSettings()}>Change translations</button>;
}
