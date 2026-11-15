import { ArrowRight, ArrowUpRight, CalendarDays, CarFront, CheckCircle2, ClipboardList, Clock3, FilePenLine, MessageSquareText, Plus, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

export type AdminTab = 'overview'|'bookings'|'engagement'|'fleet'|'content'|'notifications'|'recovery';

export type WorkEnquiry = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  pickup: string;
  destination: string;
  source?: string;
};

type Props = {
  enquiries: WorkEnquiry[];
  interactions: number;
  sessions: number|null;
  notificationMode: string;
  loading: boolean;
  error: string;
  lastSynced: Date|null;
  onNavigate: (tab: AdminTab, filter?: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onReview: (enquiry: WorkEnquiry) => void;
};

const startOfToday = () => {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};

function shortDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : 'Date unavailable';
}

export function OperationsOverview({
  enquiries, interactions, sessions, notificationMode, loading, error,
  lastSynced, onNavigate, onCreate, onRefresh, onReview,
}: Props) {
  const attention = enquiries
    .filter(item => item.status === 'new' || item.status === 'contacted')
    .sort((a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0));
  const newCount = enquiries.filter(item => item.status === 'new').length;
  const quotedCount = enquiries.filter(item => item.status === 'quoted').length;
  const confirmedCount = enquiries.filter(item => item.status === 'confirmed').length;
  const completedCount = enquiries.filter(item => item.status === 'completed').length;
  const todayCount = enquiries.filter(item => (Date.parse(item.createdAt) || 0) >= startOfToday()).length;
  const metrics = [
    { label: 'All enquiries', value: enquiries.length, detail: `${todayCount} received today`, icon: ClipboardList, tab: 'bookings' as AdminTab, filter: 'all' },
    { label: 'Needs follow-up', value: attention.length, detail: `${newCount} awaiting first contact`, icon: Clock3, tab: 'bookings' as AdminTab, filter: 'attention' },
    { label: 'Quoted', value: quotedCount, detail: 'Customer decisions pending', icon: FilePenLine, tab: 'bookings' as AdminTab, filter: 'quoted' },
    { label: 'Confirmed trips', value: confirmedCount, detail: `${completedCount} trips completed`, icon: CheckCircle2, tab: 'bookings' as AdminTab, filter: 'confirmed' },
  ];
  const safeMode = notificationMode !== 'live';

  return <div className="crm-ops-overview">
    <section className="crm-ops-intro" aria-labelledby="crm-ops-title">
      <div>
        <span className="crm-ops-eyebrow"><Sparkles size={14} aria-hidden="true"/> YOUR OPERATIONS, ONE PLACE</span>
        <h1 id="crm-ops-title">A clearer way to run every journey.</h1>
        <p>Follow up on leads, prepare quotations, manage your fleet and control what appears on your website — from one secure workspace.</p>
        <div className="crm-ops-intro-actions">
          <button className="crm-ops-primary" type="button" onClick={onCreate}><Plus size={18} aria-hidden="true"/> Log an enquiry</button>
          <button className="crm-ops-secondary" type="button" onClick={() => onNavigate('bookings')}>
            Open enquiries <ArrowRight size={17} aria-hidden="true"/>
          </button>
        </div>
      </div>
      <div className="crm-ops-intro-aside" aria-label="Workspace status">
        <div className="crm-ops-orbit"><ShieldCheck size={28} strokeWidth={1.7} aria-hidden="true"/></div>
        <span>OPERATIONS STATUS</span>
        <strong>{error ? 'Review connection' : loading ? 'Syncing records' : 'Ready for your team'}</strong>
        <p>{lastSynced ? `Enquiries refreshed at ${lastSynced.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}` : 'Staff records load after secure sign-in.'}</p>
      </div>
    </section>

    {error && <div className="crm-ops-alert" role="alert"><span>{error}</span><button type="button" onClick={onRefresh}><RefreshCw size={15} aria-hidden="true"/> Retry</button></div>}

    <section className="crm-ops-metrics" aria-label="Enquiry pipeline at a glance">
      {metrics.map(({label, value, detail, icon: Icon, tab, filter}, index) =>
        <button type="button" className={'crm-ops-metric'+(index===1?' is-attention':'')} key={label} onClick={() => onNavigate(tab, filter)}>
          <span className="crm-ops-metric-top"><span>{label}</span><Icon size={19} aria-hidden="true"/></span>
          <strong>{value}</strong>
          <span className="crm-ops-metric-foot">{detail}<ArrowUpRight size={15} aria-hidden="true"/></span>
        </button>) }
    </section>

    <div className="crm-ops-grid">
      <section className="crm-ops-panel crm-ops-queue" aria-labelledby="crm-queue-title">
        <div className="crm-ops-panel-head">
          <div><span className="crm-ops-eyebrow">DAILY WORK QUEUE</span><h2 id="crm-queue-title">Needs your attention <span>{attention.length}</span></h2></div>
          <button type="button" onClick={() => onNavigate('bookings', 'attention')}>View all <ArrowRight size={16} aria-hidden="true"/></button>
        </div>
        {attention.length ? <div className="crm-ops-queue-list">
          {attention.slice(0, 5).map(item => <div className="crm-ops-queue-row" key={item.id}>
            <div className="crm-ops-queue-initial" aria-hidden="true">{(item.name || '?').trim().charAt(0).toUpperCase()}</div>
            <div className="crm-ops-queue-copy"><strong>{item.name || 'Unnamed enquiry'}</strong><span>{item.pickup || 'Pickup to confirm'} → {item.destination || 'Destination to confirm'}</span></div>
            <span className={'crm-status-pill status-'+item.status}>{item.status === 'new' ? 'New' : 'Contacted'}</span>
            <time>{shortDate(item.createdAt)}</time>
            <button className="crm-ops-queue-open" type="button" onClick={() => onReview(item)} aria-label={'Review enquiry for '+(item.name || item.id)}><ArrowUpRight size={18} aria-hidden="true"/></button>
          </div>)}
        </div> : <div className="crm-ops-queue-empty">
          <span><CheckCircle2 size={26} aria-hidden="true"/></span>
          <h3>No follow-ups waiting</h3>
          <p>{enquiries.length ? 'All recorded leads have moved beyond the first-contact stage.' : 'New customer enquiries will appear here as soon as they arrive. You can also log phone and WhatsApp enquiries manually.'}</p>
          <button type="button" onClick={onCreate}><Plus size={16} aria-hidden="true"/> Log your first enquiry</button>
        </div>}
      </section>

      <aside className="crm-ops-panel crm-ops-shortcuts" aria-label="Quick actions">
        <div className="crm-ops-panel-head"><div><span className="crm-ops-eyebrow">WORKSPACE TOOLS</span><h2>Quick actions</h2></div></div>
        <div className="crm-ops-shortcut-list">
          <button type="button" onClick={() => onNavigate('fleet')}><span><CarFront size={19} aria-hidden="true"/></span><span><strong>Fleet & pricing</strong><small>Vehicles, rates and photo approvals</small></span><ArrowUpRight size={17} aria-hidden="true"/></button>
          <button type="button" onClick={() => onNavigate('content')}><span><FilePenLine size={19} aria-hidden="true"/></span><span><strong>Website content</strong><small>Edit drafts, review and publish</small></span><ArrowUpRight size={17} aria-hidden="true"/></button>
          <button type="button" onClick={() => onNavigate('notifications')}><span><MessageSquareText size={19} aria-hidden="true"/></span><span><strong>Message outbox</strong><small>Review email and WhatsApp previews</small></span><ArrowUpRight size={17} aria-hidden="true"/></button>
        </div>
      </aside>
    </div>

    <section className="crm-ops-bottom" aria-label="Visitor activity and safeguards">
      <div className="crm-ops-pulse"><div className="crm-ops-pulse-heading"><CalendarDays size={18} aria-hidden="true"/><span>Visitor activity</span><button type="button" onClick={() => onNavigate('engagement')}>Explore <ArrowRight size={15} aria-hidden="true"/></button></div><div className="crm-ops-pulse-values"><div><strong>{interactions}</strong><small>Recorded interactions</small></div><div><strong>{sessions ?? '—'}</strong><small>Anonymous sessions</small></div></div><p>Session counts are not unique people or confirmed customers.</p></div>
      <div className="crm-ops-safety"><ShieldCheck size={20} aria-hidden="true"/><div><strong>Protected operations</strong><p>Staff-only authorization is checked on the server. {safeMode ? 'Automatic message sending is disabled.' : 'Live messaging is configured; review dispatch approvals before sending.'} Backups and publishing remain deliberate staff actions.</p></div><button type="button" onClick={() => onNavigate('recovery')}>Recovery <ArrowRight size={15} aria-hidden="true"/></button></div>
    </section>
  </div>;
}
