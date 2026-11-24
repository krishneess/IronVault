import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, History, LineChart, Pencil, Power, PowerOff, UserCog, UserMinus } from 'lucide-react';
import { Avatar, Card, InfoRow, StatCard, StatusBadge } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import AccountFormModal from '../../components/admin/AccountFormModal';
import AssignTrainerModal from '../../components/admin/AssignTrainerModal';
import CreateMembershipModal from '../../components/admin/CreateMembershipModal';
import MembershipCard from '../../components/membership/MembershipCard';
import TransitionModal from '../../components/membership/TransitionModal';
import { MembershipStatusBadge, StatusTimeline } from '../../components/membership/membershipUi';
import { formatMoney } from '../../components/membership/membershipMeta';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { adminMemberService, assignmentAdminService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';
import { formatDate, titleCase } from '../../utils/format';
import { toggleMemberStatus } from '../../components/admin/accountStatus';

export default function AdminMemberDetail() {
  const { id } = useParams();
  const confirm = useConfirm();
  const toast = useToast();
  const { data, loading, error, reload } = useApiData(() => adminMemberService.get(id), [id]);
  const [modal, setModal] = useState(null); // 'edit' | 'assign' | 'membership' | { action }

  if (loading) return <PageLoader label="Loading member…" />;
  if (error) {
    return (
      <>
        <Link to="/admin/members" className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> Members</Link>
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      </>
    );
  }

  const { member, membership, trainer, assignmentHistory, progress, plans } = data;
  const current = membership.current;

  const endAssignment = async () => {
    const ok = await confirm({
      title: `Remove ${trainer.trainer.name} as trainer?`,
      message: `${member.name} will no longer be coached by ${trainer.trainer.name}, and that trainer's plans will be removed from them.`,
      confirmText: 'End assignment',
    });
    if (!ok) return;
    try {
      await assignmentAdminService.end(member._id);
      toast.success('Assignment ended');
      reload();
    } catch (err) {
      toast.error('Could not end assignment', err.message);
    }
  };

  return (
    <>
      <Link to="/admin/members" className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> Members</Link>

      <div className="welcome-banner mb-4 d-flex flex-wrap align-items-center gap-3">
        <Avatar name={member.name} size="lg" />
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="eyebrow">Member account</div>
          <h1 className="font-display h2 mb-1">{member.name}</h1>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <StatusBadge active={member.isActive} />
            <MembershipStatusBadge status={current?.status || 'none'} />
            <span className="text-muted-iv" style={{ fontSize: '.85rem' }}>@{member.username} · joined {formatDate(member.joinDate)}</span>
          </div>
        </div>
        <div className="d-flex gap-2 position-relative" style={{ zIndex: 1 }}>
          <button type="button" className="btn btn-outline-gold btn-sm" onClick={() => setModal('edit')}><Pencil size={15} /> Edit</button>
          <button
            type="button"
            className={`btn btn-sm ${member.isActive ? 'btn-danger-soft' : 'btn-gold'}`}
            onClick={() => toggleMemberStatus({ member, confirm, toast, onDone: reload })}
          >
            {member.isActive ? <><PowerOff size={15} /> Deactivate</> : <><Power size={15} /> Reactivate</>}
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><StatCard icon={LineChart} label="Progress records" value={progress.count} hint={progress.latest ? `Last ${formatDate(progress.latest.recordDate)}` : 'None yet'} /></div>
        <div className="col-6 col-xl-3"><StatCard label="Latest weight" value={progress.latest ? `${progress.latest.weight} kg` : member.weight ? `${member.weight} kg` : '—'} hint={progress.change.weight !== undefined ? `${progress.change.weight > 0 ? '+' : ''}${progress.change.weight} kg overall` : '—'} /></div>
        <div className="col-6 col-xl-3"><StatCard label="Workout plans" value={plans.workout} hint="Assigned by trainer" /></div>
        <div className="col-6 col-xl-3"><StatCard label="Diet plans" value={plans.diet} hint="Assigned by trainer" /></div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-7">
          {current ? (
            <MembershipCard
              membership={current}
              title={membership.canStartNew ? 'Last membership' : 'Current membership'}
              onAction={member.isActive ? (a) => setModal({ action: a }) : undefined}
            />
          ) : (
            <Card title="Membership"><EmptyState icon={Crown} title="No membership" message="This member has never held a membership." /></Card>
          )}
          {membership.canStartNew && member.isActive && (
            <button type="button" className="btn btn-gold mt-3" onClick={() => setModal('membership')}><Crown size={17} /> New membership</button>
          )}
        </div>
        <div className="col-xl-5">
          <Card
            title="Trainer"
            className="mb-4"
            actions={
              member.isActive && (
                <button type="button" className="btn btn-outline-gold btn-sm" onClick={() => setModal('assign')}>
                  <UserCog size={15} /> {trainer ? 'Reassign' : 'Assign'}
                </button>
              )
            }
          >
            {trainer ? (
              <div className="d-flex align-items-center gap-3">
                <Avatar name={trainer.trainer.name} />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <Link to={`/admin/trainers/${trainer.trainer._id}`} className="fw-semibold text-decoration-none d-block" style={{ color: 'var(--iv-text)' }}>{trainer.trainer.name}</Link>
                  <div className="text-muted-iv" style={{ fontSize: '.8rem' }}>{trainer.trainer.specialization} · since {formatDate(trainer.assignedDate)}</div>
                </div>
                <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" title="End assignment" aria-label="End assignment" onClick={endAssignment}><UserMinus size={16} /></button>
              </div>
            ) : (
              <EmptyState icon={UserCog} title="No trainer assigned" message={member.isActive ? 'Assign a trainer to start coaching.' : 'Reactivate the account to assign a trainer.'} />
            )}
          </Card>
          <Card title="Profile">
            <InfoRow label="Email" value={member.email} />
            <InfoRow label="Phone" value={member.phone || '—'} />
            <InfoRow label="Age / gender" value={`${member.age ?? '—'} / ${member.gender ? titleCase(member.gender) : '—'}`} />
            <InfoRow label="Height" value={member.height ? `${member.height} cm` : '—'} />
            <InfoRow label="Goal" value={member.fitnessGoal || '—'} />
            <InfoRow label="Last sign-in" value={formatDate(member.lastLoginAt)} />
          </Card>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <Card title="Membership history" noPadding>
            {membership.history.length ? (
              <div className="table-responsive">
                <table className="table iv-table">
                  <thead><tr><th>Plan</th><th>Status</th><th>Fee</th><th>Period</th><th>Created</th></tr></thead>
                  <tbody>
                    {membership.history.map((m) => (
                      <tr key={m._id}>
                        <td className="fw-semibold">{m.planType}</td>
                        <td><MembershipStatusBadge status={m.status} /></td>
                        <td>{formatMoney(m.fee)}</td>
                        <td className="text-nowrap text-muted-iv">{m.startDate ? `${formatDate(m.startDate)} – ${formatDate(m.endDate)}` : '—'}</td>
                        <td className="text-nowrap text-muted-iv">{formatDate(m.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={History} title="No history" />
            )}
          </Card>
          {assignmentHistory.length > 0 && (
            <Card title="Trainer assignment history" className="mt-4" noPadding>
              <div className="table-responsive">
                <table className="table iv-table">
                  <thead><tr><th>Trainer</th><th>Status</th><th>From</th><th>To</th><th>By</th></tr></thead>
                  <tbody>
                    {assignmentHistory.map((a) => (
                      <tr key={a._id}>
                        <td className="fw-semibold">{a.trainer?.name || '—'}</td>
                        <td>{a.status === 'active' ? <span className="iv-badge iv-badge-success">Active</span> : <span className="iv-badge iv-badge-muted">Ended</span>}</td>
                        <td className="text-muted-iv text-nowrap">{formatDate(a.assignedDate)}</td>
                        <td className="text-muted-iv text-nowrap">{formatDate(a.endedAt)}</td>
                        <td className="text-muted-iv">{a.assignedBy?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
        <div className="col-lg-5">
          {current && (
            <Card title={<><History size={17} className="text-gold me-2" />Status timeline</>} subtitle={current.planType}>
              <StatusTimeline history={current.statusHistory} />
            </Card>
          )}
        </div>
      </div>

      {modal === 'edit' && <AccountFormModal role="member" account={member} onClose={() => setModal(null)} onSaved={reload} />}
      {modal === 'assign' && <AssignTrainerModal member={member} currentTrainerId={trainer?.trainer._id} onClose={() => setModal(null)} onDone={reload} />}
      {modal === 'membership' && <CreateMembershipModal member={member} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.action && (
        <TransitionModal key={modal.action.action} membership={current} action={modal.action} onClose={() => setModal(null)} onDone={reload} />
      )}
    </>
  );
}
