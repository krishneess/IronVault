import { useState } from 'react';
import { LineChart as LineChartIcon, Plus } from 'lucide-react';
import { Card, PageHeader, StatCard } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import ProgressChartCard from '../../components/fitness/ProgressChartCard';
import RecordsTable from '../../components/fitness/RecordsTable';
import RecordFormModal from '../../components/fitness/RecordFormModal';
import { METRICS, formatMetric, formatChange } from '../../components/fitness/metrics';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { fitnessRecordService } from '../../services/fitnessService';
import useApiData from '../../hooks/useApiData';
import { MembershipRequired } from '../../components/membership/membershipUi';
import { formatDate } from '../../utils/format';

export default function MemberProgress() {
  const confirm = useConfirm();
  const toast = useToast();
  const { data: records, loading, error, errorCode, reload } = useApiData(() => fitnessRecordService.list(), []);
  const locked = errorCode === 'MEMBERSHIP_INACTIVE';
  const [modal, setModal] = useState({ open: false, record: null });

  const openNew = () => setModal({ open: true, record: null });
  const openEdit = (record) => setModal({ open: true, record });

  const onDelete = async (record) => {
    const ok = await confirm({
      title: 'Delete this record?',
      message: `The fitness record from ${formatDate(record.recordDate)} will be permanently removed from your history.`,
      confirmText: 'Delete record',
    });
    if (!ok) return;
    try {
      await fitnessRecordService.remove(record._id);
      toast.success('Record deleted');
      reload();
    } catch (err) {
      toast.error('Could not delete record', err.message);
    }
  };

  const latest = records?.[0];
  const first = records?.[records.length - 1];
  const change = (key) => (latest && first && records.length > 1 && latest[key] != null && first[key] != null ? Math.round((latest[key] - first[key]) * 10) / 10 : null);

  return (
    <>
      <PageHeader
        eyebrow="Member"
        title="Fitness progress"
        description="Log your weight, body fat and measurements, and follow your history."
        actions={
          !locked && <button type="button" className="btn btn-gold" onClick={openNew}>
            <Plus size={18} /> Log progress
          </button>
        }
      />

      {loading ? (
        <PageLoader label="Loading your progress…" />
      ) : locked ? (
        <MembershipRequired message={error} />
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : !records.length ? (
        <Card>
          <EmptyState
            icon={LineChartIcon}
            title="No progress logged yet"
            message="Record your first weigh-in to start building your progress history."
            action={<button type="button" className="btn btn-gold" onClick={openNew}><Plus size={17} /> Log first record</button>}
          />
        </Card>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {METRICS.slice(0, 4).map((m) => {
              const delta = change(m.key);
              return (
                <div key={m.key} className="col-6 col-xl-3">
                  <StatCard
                    label={`Latest ${m.label.toLowerCase()}`}
                    value={formatMetric(latest[m.key], m.unit)}
                    hint={delta !== null ? `${formatChange(delta, m.unit)} since ${formatDate(first.recordDate)}` : `${records.length} record${records.length === 1 ? '' : 's'}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mb-4">
            <ProgressChartCard records={records} />
          </div>
          <Card title="History" subtitle={`${records.length} record${records.length === 1 ? '' : 's'}, newest first`} noPadding>
            <RecordsTable records={records} onEdit={openEdit} onDelete={onDelete} />
          </Card>
        </>
      )}

      <RecordFormModal open={modal.open} record={modal.record} onClose={() => setModal({ open: false, record: null })} onSaved={reload} />
    </>
  );
}
