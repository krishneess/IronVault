import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Download, FileBarChart, IndianRupee, RefreshCw, UserPlus, Users } from 'lucide-react';
import { Card, PageHeader, StatCard } from '../../components/common/Display';
import { ErrorState, PageLoader } from '../../components/common/Feedback';
import BarChart, { ColumnChart } from '../../components/charts/BarChart';
import { STATUS_META, STATUS_ORDER, formatMoney } from '../../components/membership/membershipMeta';
import { reportService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function csvEscape(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds a multi-section CSV from the report and downloads it in the browser. */
function exportCsv(report) {
  const rows = [
    ['IronVault Operational Report'],
    ['Period', formatDate(report.period.from), formatDate(report.period.to)],
    ['Generated', new Date(report.generatedAt).toLocaleString()],
    [],
    ['Summary', 'Value'],
    ['Total members', report.members.total],
    ['Active member accounts', report.members.active],
    ['New members in period', report.members.newInPeriod],
    ['Trainers (active / total)', `${report.trainers.active} / ${report.trainers.total}`],
    ['Revenue in period', report.revenue.total],
    ['Payments verified in period', report.revenue.payments],
    ['Fitness records logged in period', report.activity.fitnessRecordsLogged],
    ['Audit events in period', report.activity.auditEvents],
    [],
    ['Membership status', 'Count'],
    ...STATUS_ORDER.map((s) => [STATUS_META[s].label, report.memberships.byStatus[s] ?? 0]),
    [],
    ['Revenue by plan', 'Payments', 'Revenue'],
    ...report.revenue.byPlanType.map((r) => [r.planType, r.count, r.revenue]),
    [],
    ['Trainer', 'Specialization', 'Active', 'Members', 'Workout plans', 'Diet plans'],
    ...report.trainerLoad.map((t) => [t.name, t.specialization, t.isActive ? 'Yes' : 'No', t.activeMembers, t.workoutPlans, t.dietPlans]),
    [],
    ['Expiring within 30 days', 'Email', 'Plan', 'End date'],
    ...report.memberships.expiringSoon.map((m) => [m.member?.name, m.member?.email, m.planType, formatDate(m.endDate)]),
    [],
    ['Month', 'New members'],
    ...report.signupsByMonth.map((m) => [m.month, m.count]),
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ironvault-report-${iso(new Date(report.period.from))}-to-${iso(new Date(report.period.to))}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const today = new Date();
  const [range, setRange] = useState({ from: iso(new Date(today.getTime() - 29 * 86400000)), to: iso(today) });
  const [applied, setApplied] = useState(range);
  const { data: report, loading, error, reload } = useApiData(() => reportService.operational(applied), [applied]);
  const rangeError = range.from && range.to && range.from > range.to ? '"From" must be before "To"' : '';

  const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short' });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Operational reports"
        description="Membership, revenue, trainer and activity figures for a period."
        actions={
          report && (
            <button type="button" className="btn btn-gold" onClick={() => exportCsv(report)}>
              <Download size={17} /> Export CSV
            </button>
          )
        }
      />

      <Card className="mb-4">
        <form
          className="d-flex flex-wrap align-items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rangeError) setApplied(range);
          }}
        >
          <div>
            <label className="form-label" htmlFor="from">From</label>
            <input id="from" type="date" className="form-control" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="to">To</label>
            <input id="to" type="date" className="form-control" value={range.to} max={iso(today)} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-outline-gold" disabled={Boolean(rangeError) || loading}><RefreshCw size={16} /> Generate</button>
          {rangeError && <span className="text-danger" style={{ fontSize: '.85rem' }}>{rangeError}</span>}
        </form>
      </Card>

      {loading ? (
        <PageLoader label="Generating report…" />
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3"><StatCard icon={IndianRupee} label="Revenue" value={formatMoney(report.revenue.total)} hint={`${report.revenue.payments} payment(s) verified`} /></div>
            <div className="col-sm-6 col-xl-3"><StatCard icon={UserPlus} label="New members" value={report.members.newInPeriod} hint={`${report.members.total} total · ${report.members.active} active`} /></div>
            <div className="col-sm-6 col-xl-3"><StatCard icon={Users} label="Active memberships" value={report.memberships.byStatus.active ?? 0} hint={`${report.memberships.byStatus.payment_pending ?? 0} awaiting payment`} /></div>
            <div className="col-sm-6 col-xl-3"><StatCard icon={Activity} label="Progress logs" value={report.activity.fitnessRecordsLogged} hint={`${report.activity.auditEvents} audit events`} /></div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <Card title="Memberships by status" className="h-100">
                <BarChart data={STATUS_ORDER.map((s) => ({ label: STATUS_META[s].label, value: report.memberships.byStatus[s] ?? 0 }))} emptyText="No memberships yet" />
              </Card>
            </div>
            <div className="col-lg-6">
              <Card title="Revenue by plan" subtitle="Payments verified in the period" className="h-100">
                <BarChart
                  data={report.revenue.byPlanType.map((r) => ({ label: `${r.planType} (${r.count})`, value: r.revenue }))}
                  valueFormatter={formatMoney}
                  emptyText="No payments verified in this period"
                />
              </Card>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-7">
              <Card title="New members per month" subtitle="Last 12 months">
                <ColumnChart data={report.signupsByMonth.map((m) => ({ label: monthLabel(m.month), value: m.count }))} />
              </Card>
            </div>
            <div className="col-lg-5">
              <Card title="Expiring within 30 days" noPadding className="h-100">
                {report.memberships.expiringSoon.length ? (
                  <div className="table-responsive">
                    <table className="table iv-table">
                      <tbody>
                        {report.memberships.expiringSoon.map((m) => (
                          <tr key={m._id}>
                            <td>{m.member ? <Link to={`/admin/members/${m.member._id}`} style={{ color: 'var(--iv-text)' }} className="text-decoration-none fw-semibold">{m.member.name}</Link> : '—'}<div className="text-muted-iv" style={{ fontSize: '.78rem' }}>{m.planType}</div></td>
                            <td className="text-end text-nowrap">{formatDate(m.endDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted-iv text-center py-4" style={{ fontSize: '.88rem' }}>No memberships expire in the next 30 days</div>
                )}
              </Card>
            </div>
          </div>

          <Card title="Trainer performance" subtitle="Current load and plans created" noPadding>
            {report.trainerLoad.length ? (
              <div className="table-responsive">
                <table className="table iv-table">
                  <thead><tr><th>Trainer</th><th>Specialization</th><th className="text-center">Members</th><th className="text-center">Workout plans</th><th className="text-center">Diet plans</th></tr></thead>
                  <tbody>
                    {report.trainerLoad.map((t) => (
                      <tr key={t._id}>
                        <td className="fw-semibold">{t.name}{!t.isActive && <span className="iv-badge iv-badge-danger ms-2">Inactive</span>}</td>
                        <td className="text-muted-iv">{t.specialization}</td>
                        <td className="text-center">{t.activeMembers}</td>
                        <td className="text-center">{t.workoutPlans}</td>
                        <td className="text-center">{t.dietPlans}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-iv text-center py-4"><FileBarChart size={18} className="me-2" />No trainers yet</div>
            )}
          </Card>
          <p className="text-muted-iv mt-3" style={{ fontSize: '.78rem' }}>
            Generated {new Date(report.generatedAt).toLocaleString()} for {formatDate(report.period.from)} – {formatDate(report.period.to)}.
          </p>
        </>
      )}
    </>
  );
}
