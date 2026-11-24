import { useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { Spinner } from '../common/Feedback';
import { useToast } from '../../context/ToastContext';
import { membershipService } from '../../services/adminService';
import { STATUS_META, formatMoney } from './membershipMeta';

const NEEDS_REASON = ['suspend', 'terminate', 'revoke'];
const DESTRUCTIVE = ['terminate', 'revoke', 'cancel_application', 'abandon_payment', 'decline_renewal'];

const DESCRIPTIONS = {
  submit: 'The application moves to Payment Pending. Payment is collected at the front desk.',
  cancel_application: 'The application will be cancelled. A new plan can be selected afterwards.',
  verify_payment: 'Confirms payment was received. The membership becomes Active today and its validity period starts.',
  abandon_payment: 'The pending application is cancelled because payment was not completed.',
  suspend: 'Places the membership on hold. It expires automatically if the tier’s maximum hold duration is exceeded.',
  resume: 'Re-activates the membership. The end date is extended by the number of days spent on hold.',
  terminate: 'Ends the membership immediately. This cannot be undone.',
  revoke: 'Revokes the suspended membership. This cannot be undone.',
  decline_renewal: 'Closes the expired membership without renewal.',
};

/** Confirms a membership state transition, collecting payment details or a reason where needed. */
export default function TransitionModal({ membership, action, onClose, onDone }) {
  const toast = useToast();
  const [values, setValues] = useState({ paymentMethod: 'cash', paymentReference: '', note: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  if (!membership || !action) return null;

  const set = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (NEEDS_REASON.includes(action.action) && !values.note.trim()) {
      setErrors({ note: 'Please give a reason' });
      return;
    }
    const extra = { note: values.note.trim() || undefined };
    if (action.action === 'verify_payment') Object.assign(extra, { paymentMethod: values.paymentMethod, paymentReference: values.paymentReference.trim() });
    setSaving(true);
    try {
      const res = await membershipService.transition(membership._id, action.action, extra);
      toast.success(action.label, `Membership is now ${STATUS_META[res.data.status]?.label.toLowerCase()}.`);
      onDone?.(res.data);
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error(`Could not ${action.label.toLowerCase()}`, err.message);
    } finally {
      setSaving(false);
    }
  };

  const destructive = DESTRUCTIVE.includes(action.action);

  return (
    <Modal open onClose={onClose} busy={saving} title={action.label} subtitle={`${membership.planType} · ${formatMoney(membership.fee)}`}>
      <form onSubmit={submit} noValidate>
        <p className="text-muted-iv" style={{ fontSize: '.9rem' }}>{DESCRIPTIONS[action.action]}</p>
        {action.action === 'verify_payment' && (
          <div className="row">
            <div className="col-md-6">
              <FormField label="Payment method" as="select" name="paymentMethod" value={values.paymentMethod} onChange={set} error={errors.paymentMethod} required>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank transfer</option>
              </FormField>
            </div>
            <div className="col-md-6">
              <FormField label="Reference / receipt no." name="paymentReference" maxLength={80} value={values.paymentReference} onChange={set} error={errors.paymentReference} placeholder="Optional" />
            </div>
          </div>
        )}
        <FormField
          label={NEEDS_REASON.includes(action.action) ? 'Reason' : 'Note'}
          as="textarea"
          rows={2}
          name="note"
          maxLength={300}
          value={values.note}
          onChange={set}
          error={errors.note}
          required={NEEDS_REASON.includes(action.action)}
          placeholder={NEEDS_REASON.includes(action.action) ? 'Recorded in the membership history' : 'Optional'}
        />
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className={`btn ${destructive ? 'btn-danger' : 'btn-gold'}`} disabled={saving}>
            {saving && <Spinner small />} {action.label}
          </button>
        </div>
      </form>
    </Modal>
  );
}
