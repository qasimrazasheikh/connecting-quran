import {NavHold} from './NavProgress';

/** The site's one loading screen: the route fallback, and pages that load their next ayah or page in place. */
export default function PageLoading() {
  return <div className="grid place-items-center py-16 text-muted"><NavHold /><div className="spin mb-2.5" />Loading…</div>;
}
