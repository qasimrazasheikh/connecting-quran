'use client';
import {useApp} from './AppProvider';
import {usePlayer} from './PlayerProvider';
import {Icon} from './Icons';
import {btn, chip, cx} from '@/lib/ui';
export function PlayAll({label}: {label: string}) {
  const {playFirst} = usePlayer();
  return <button className={btn} data-playall onClick={playFirst}><Icon.play /> {label}</button>;
}
export function ChangeTranslations() {
  const {openSettings} = useApp();
  return <button className={cx(chip, 'border-0')} id="openSet" onClick={() => openSettings()}>Change translations</button>;
}
