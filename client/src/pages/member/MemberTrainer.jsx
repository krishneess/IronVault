import { Award, BriefcaseBusiness, CalendarCheck, Mail, Phone, UserRoundX } from 'lucide-react';
import { Avatar, Card, InfoRow, PageHeader, StatCard } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import { memberService } from '../../services/fitnessService';
import useApiData from '../../hooks/useApiData';
import { MembershipRequired } from '../../components/membership/membershipUi';
import { formatDate } from '../../utils/format';

export default function MemberTrainer() {
  const { data, loading, error, errorCode, reload } = useApiData(() => memberService.trainer(), []);

  if (loading) return <PageLoader label="Loading your trainer…" />;
  if (errorCode === 'MEMBERSHIP_INACTIVE') {
    return (
      <>
        <PageHeader eyebrow="Member" title="My trainer" description="The coach responsible for your plans and progress." />
        <MembershipRequired message={error} />
      </>
    );
  }
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  return (
    <>
      <PageHeader eyebrow="Member" title="My trainer" description="The coach responsible for your plans and progress." />
      {!data ? (
        <Card>
          <EmptyState
            icon={UserRoundX}
            title="No trainer assigned yet"
            message="The gym administrator will assign a trainer to you. Your plans will follow once they do."
          />
        </Card>
      ) : (
        <div className="row g-4">
          <div className="col-lg-5">
            <Card>
              <div className="text-center">
                <div className="d-flex justify-content-center mb-3"><Avatar name={data.trainer.name} size="lg" /></div>
                <div className="eyebrow">Your trainer</div>
                <h2 className="font-display h3 mt-1 mb-1">{data.trainer.name}</h2>
                <div className="text-champagne mb-3">{data.trainer.specialization}</div>
              </div>
              <InfoRow label={<><Mail size={14} className="me-2" />Email</>} value={<a href={`mailto:${data.trainer.email}`}>{data.trainer.email}</a>} />
              <InfoRow label={<><Phone size={14} className="me-2" />Phone</>} value={data.trainer.phone || '—'} />
            </Card>
          </div>
          <div className="col-lg-7">
            <div className="row g-3 mb-4">
              <div className="col-sm-4">
                <StatCard icon={BriefcaseBusiness} label="Focus" value={<span style={{ fontSize: '1.05rem' }}>{data.trainer.specialization}</span>} />
              </div>
              <div className="col-sm-4">
                <StatCard icon={Award} label="Experience" value={`${data.trainer.experience ?? 0} yrs`} />
              </div>
              <div className="col-sm-4">
                <StatCard icon={CalendarCheck} label="Coaching you since" value={<span style={{ fontSize: '1.05rem' }}>{formatDate(data.assignedDate)}</span>} />
              </div>
            </div>
            <Card title="About">
              <p className="text-muted-iv mb-0" style={{ whiteSpace: 'pre-line' }}>{data.trainer.bio || 'Your trainer has not added a bio yet.'}</p>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
