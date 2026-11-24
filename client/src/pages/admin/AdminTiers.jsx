import { useState } from 'react';
import { Crown, Pencil, Plus, Power, PowerOff, Save, Trash2, X } from 'lucide-react';
import { Card, PageHeader, StatusBadge } from '../../components/common/Display';
import { EmptyState, ErrorState, SubmitButton } from '../../components/common/Feedback';
import FormField from '../../components/common/FormField';
import Modal from '../../components/common/Modal';
import { durationLabel, formatMoney } from '../../components/membership/membershipMeta';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { tierService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';

const toForm = (t) => ({
  name: t?.name || '',
  description: t?.description || '',
  durationInDays: t?.durationInDays ?? 30,
  price: t?.price ?? '',
  maxHoldDays: t?.maxHoldDays ?? 0,
  features: t?.features?.length ? [...t.features] : [''],
});

function TierModal({ tier, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState(() => toForm(tier));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (e) => {
    setV((x) => ({ ...x, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (v.name.trim().length < 2) er.name = 'Name is required';
    if (!(Number(v.durationInDays) >= 1 && Number(v.durationInDays) <= 1825)) er.durationInDays = '1–1825 days';
    if (v.price === '' || Number(v.price) < 0) er.price = 'Enter a price';
    if (Number(v.maxHoldDays) < 0 || Number(v.maxHoldDays) > 365) er.maxHoldDays = '0–365 days';
    setErrors(er);
    if (Object.keys(er).length) return;
    const payload = {
      name: v.name.trim(),
      description: v.description.trim(),
      durationInDays: Number(v.durationInDays),
      price: Number(v.price),
      maxHoldDays: Number(v.maxHoldDays || 0),
      features: v.features.map((f) => f.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      const res = tier ? await tierService.update(tier._id, payload) : await tierService.create(payload);
      toast.success(tier ? 'Tier updated' : 'Tier created', res.data.name);
      onSaved();
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error('Could not save tier', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} busy={saving} size="lg" title={tier ? `Edit ${tier.name}` : 'New membership tier'} subtitle="Changes apply to new memberships; existing ones keep their original terms.">
      <form onSubmit={submit} noValidate>
        <div className="row">
          <div className="col-md-6"><FormField label="Name" name="name" maxLength={60} value={v.name} onChange={set} error={errors.name} required placeholder="e.g. Gold Monthly" /></div>
          <div className="col-6 col-md-3"><FormField label="Price (₹)" type="number" min="0" name="price" value={v.price} onChange={set} error={errors.price} required /></div>
          <div className="col-6 col-md-3"><FormField label="Duration (days)" type="number" min="1" name="durationInDays" value={v.durationInDays} onChange={set} error={errors.durationInDays} required /></div>
          <div className="col-md-9"><FormField label="Description" name="description" maxLength={500} value={v.description} onChange={set} error={errors.description} /></div>
          <div className="col-md-3"><FormField label="Max hold (days)" type="number" min="0" max="365" name="maxHoldDays" value={v.maxHoldDays} onChange={set} error={errors.maxHoldDays} hint="0 = no holds" /></div>
        </div>
        <label className="form-label">Features</label>
        {v.features.map((f, i) => (
          <div key={i} className="d-flex gap-2 mb-2">
            <input
              className="form-control"
              value={f}
              maxLength={120}
              placeholder="e.g. Dedicated personal trainer"
              aria-label={`Feature ${i + 1}`}
              onChange={(e) => setV((x) => ({ ...x, features: x.features.map((y, j) => (j === i ? e.target.value : y)) }))}
            />
            <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove feature ${i + 1}`} onClick={() => setV((x) => ({ ...x, features: x.features.filter((_, j) => j !== i) }))}><X size={16} /></button>
          </div>
        ))}
        {errors.features && <div className="invalid-feedback d-block mb-2">{errors.features}</div>}
        <button type="button" className="btn btn-outline-gold btn-sm mb-3" disabled={v.features.length >= 12} onClick={() => setV((x) => ({ ...x, features: [...x.features, ''] }))}><Plus size={15} /> Add feature</button>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <SubmitButton loading={saving} loadingText="Saving…"><Save size={17} /> {tier ? 'Save tier' : 'Create tier'}</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminTiers() {
  const confirm = useConfirm();
  const toast = useToast();
  const { data, loading, error, reload } = useApiData(() => tierService.listAll(), []);
  const [modal, setModal] = useState(null);

  const toggle = async (tier) => {
    const ok = await confirm({
      title: `${tier.isActive ? 'Deactivate' : 'Activate'} ${tier.name}?`,
      message: tier.isActive ? 'The tier will no longer be offered for new memberships. Existing memberships are not affected.' : 'Members will be able to select this tier.',
      confirmText: tier.isActive ? 'Deactivate' : 'Activate',
      variant: tier.isActive ? 'danger' : 'primary',
    });
    if (!ok) return;
    try {
      await tierService.setActive(tier._id, !tier.isActive);
      toast.success(`Tier ${tier.isActive ? 'deactivated' : 'activated'}`, tier.name);
      reload();
    } catch (err) {
      toast.error('Could not update tier', err.message);
    }
  };

  const remove = async (tier) => {
    const ok = await confirm({ title: `Delete ${tier.name}?`, message: 'Only tiers that have never been used can be deleted. This cannot be undone.', confirmText: 'Delete tier' });
    if (!ok) return;
    try {
      await tierService.remove(tier._id);
      toast.success('Tier deleted', tier.name);
      reload();
    } catch (err) {
      toast.error('Could not delete tier', err.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Membership tiers"
        description="Configure the membership plans members can choose."
        actions={<button type="button" className="btn btn-gold" onClick={() => setModal({ tier: null })}><Plus size={18} /> New tier</button>}
      />
      {loading ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : !data.length ? (
        <Card><EmptyState icon={Crown} title="No tiers yet" message="Create your first membership tier so members can subscribe." action={<button type="button" className="btn btn-gold" onClick={() => setModal({ tier: null })}><Plus size={17} /> New tier</button>} /></Card>
      ) : (
        <div className="row g-4">
          {data.map((t) => (
            <div key={t._id} className="col-md-6 col-xl-4">
              <Card className="h-100" title={t.name} actions={<StatusBadge active={t.isActive} />}>
                <div className="mb-2">
                  <span className="h3 text-gold-gradient fw-bold">{formatMoney(t.price)}</span>
                  <span className="text-muted-iv ms-2">/ {durationLabel(t.durationInDays)}</span>
                </div>
                {t.description && <p className="text-muted-iv" style={{ fontSize: '.88rem' }}>{t.description}</p>}
                <ul className="ps-3 text-muted-iv" style={{ fontSize: '.86rem' }}>
                  {t.features.map((f) => <li key={f}>{f}</li>)}
                  <li>{t.maxHoldDays ? `Hold up to ${t.maxHoldDays} days` : 'No holds'}</li>
                </ul>
                <div className="d-flex gap-2 flex-wrap">
                  <button type="button" className="btn btn-outline-gold btn-sm" onClick={() => setModal({ tier: t })}><Pencil size={15} /> Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(t)}>
                    {t.isActive ? <><PowerOff size={15} /> Deactivate</> : <><Power size={15} /> Activate</>}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm text-danger ms-auto" onClick={() => remove(t)} aria-label={`Delete ${t.name}`}><Trash2 size={15} /></button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
      {modal && <TierModal tier={modal.tier} onClose={() => setModal(null)} onSaved={reload} />}
    </>
  );
}
