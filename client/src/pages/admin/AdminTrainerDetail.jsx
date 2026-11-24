import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Pencil, Power, PowerOff, Salad, Users } from 'lucide-react';
import { Avatar, Card, InfoRow, StatCard, StatusBadge } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import AccountFormModal from '../../components/admin/AccountFormModal';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { adminTrainerService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';
import { toggleTrainerStatus } from '../../components/admin/accountStatus';

export default function AdminTrainerDetail() {
  const { id } = useParams();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const { data, loading, error, reload } = useApiData(() => adminTrainerService.get(id), [id]);

  if (loading) return <PageLoader label="Loading trainer…" />;
  if (error) {
    return (
      <>
        <Link to="/admin/trainers" className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> Trainers</Link>
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      </>
    );
  }
  const { trainer, members, stats } = data;

  return (
    <>
      <Link to="/admin/trainers" className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> Trainers</Link>
      <div className="welcome-banner mb-4 d-flex flex-wrap align-items-center gap-3">
        <Avatar name={trainer.name} size="lg" />
        <div className="flex-grow-1">
          <div className="eyebrow">Trainer account</div>
          <h1 className="font-display h2 mb-1">{trainer.name}</h1>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <StatusBadge active={trainer.isActive} />
            <span className="text-champagne" style={{ fontSize: '.9rem' }}>{trainer.specialization} · {trainer.experience ?? 0} yrs</span>
          </div>
        </div>
        <div className="d-flex gap-2 position-relative" style={{ zIndex: 1 }}>
          <button type="button" className="btn btn-outline-gold btn-sm" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>
          <button
            type="button"
            className={`btn btn-sm ${trainer.isActive ? 'btn-danger-soft' : 'btn-gold'}`}
            onClick={() => toggleTrainerStatus({ trainer: { ...trainer, stats }, confirm, toast, onDone: reload })}
          >
            {trainer.isActive ? <><PowerOff size={15} /> Deactivate</> : <><Power size={15} /> Reactivate</>}
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4"><StatCard icon={Users} label="Active members" value={stats.activeMembers} /></div>
        <div className="col-md-4"><StatCard icon={Dumbbell} label="Workout plans" value={stats.workoutPlans} /></div>
        <div className="col-md-4"><StatCard icon={Salad} label="Diet plans" value={stats.dietPlans} /></div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <Card title="Assigned members" subtitle="Manage allocation from each member's page or Trainer Allocation">
            {!members.length ? (
              <EmptyState icon={Users} title="No members assigned" />
            ) : (
              members.map(({ member, assignedDate }) => (
                <Link key={member._id} to={`/admin/members/${member._id}`} className="activity-item align-items-center text-decoration-none" style={{ color: 'inherit' }}>
                  <Avatar name={member.name} />
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="fw-semibold">{member.name}</div>
                    <div className="text-muted-iv" style={{ fontSize: '.78rem' }}>{member.email}</div>
                  </div>
                  <span className="text-muted-iv" style={{ fontSize: '.8rem' }}>since {formatDate(assignedDate)}</span>
                </Link>
              ))
            )}
          </Card>
        </div>
        <div className="col-lg-5">
          <Card title="Profile">
            <InfoRow label="Email" value={trainer.email} />
            <InfoRow label="Username" value={`@${trainer.username}`} />
            <InfoRow label="Phone" value={trainer.phone || '—'} />
            <InfoRow label="Joined" value={formatDate(trainer.createdAt)} />
            <InfoRow label="Last sign-in" value={formatDate(trainer.lastLoginAt)} />
            {trainer.bio && <p className="text-muted-iv mt-3 mb-0" style={{ fontSize: '.88rem', whiteSpace: 'pre-line' }}>{trainer.bio}</p>}
          </Card>
        </div>
      </div>
      {editing && <AccountFormModal role="trainer" account={trainer} onClose={() => setEditing(false)} onSaved={reload} />}
    </>
  );
}
