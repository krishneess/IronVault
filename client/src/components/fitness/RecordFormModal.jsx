import { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { SubmitButton } from '../common/Feedback';
import { useToast } from '../../context/ToastContext';
import { fitnessRecordService } from '../../services/fitnessService';

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const FIELDS = [
  { key: 'weight', label: 'Weight (kg)', min: 20, max: 400, required: true },
  { key: 'bodyFatPercentage', label: 'Body fat (%)', min: 2, max: 70 },
  { key: 'chest', label: 'Chest (cm)', min: 30, max: 250 },
  { key: 'waist', label: 'Waist (cm)', min: 30, max: 250 },
  { key: 'arms', label: 'Arms (cm)', min: 10, max: 100 },
  { key: 'legs', label: 'Legs (cm)', min: 20, max: 150 },
];

function toForm(record) {
  if (!record) return { recordDate: today(), weight: '', bodyFatPercentage: '', chest: '', waist: '', arms: '', legs: '', notes: '' };
  const form = { recordDate: String(record.recordDate).slice(0, 10), notes: record.notes || '' };
  FIELDS.forEach((f) => {
    form[f.key] = record[f.key] ?? '';
  });
  return form;
}

function validateForm(values) {
  const errors = {};
  if (!values.recordDate) errors.recordDate = 'Choose a date';
  else if (values.recordDate > today()) errors.recordDate = 'Date cannot be in the future';
  FIELDS.forEach((f) => {
    const v = values[f.key];
    if (v === '' || v === null) {
      if (f.required) errors[f.key] = 'Required';
      return;
    }
    const n = Number(v);
    if (Number.isNaN(n) || n < f.min || n > f.max) errors[f.key] = `${f.min}–${f.max}`;
  });
  if (values.notes.length > 500) errors.notes = 'At most 500 characters';
  return errors;
}

/** Add or edit a fitness record (member). The form mounts fresh each time it opens. */
export default function RecordFormModal({ open, record, onClose, onSaved }) {
  if (!open) return null;
  return <RecordForm key={record?._id || 'new'} record={record} onClose={onClose} onSaved={onSaved} />;
}

function RecordForm({ record, onClose, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState(() => toForm(record));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    const payload = { recordDate: values.recordDate, notes: values.notes.trim() };
    FIELDS.forEach((f) => {
      payload[f.key] = values[f.key] === '' ? '' : Number(values[f.key]);
    });

    setSaving(true);
    try {
      const res = record ? await fitnessRecordService.update(record._id, payload) : await fitnessRecordService.create(payload);
      toast.success(record ? 'Record updated' : 'Progress logged', res.message);
      onSaved(res.data);
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error('Could not save record', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={saving}
      size="lg"
      title={record ? 'Edit fitness record' : 'Log fitness progress'}
      subtitle="Weight is required; other measurements are optional."
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="row">
          <div className="col-md-4">
            <FormField label="Date" type="date" name="recordDate" max={today()} value={values.recordDate} onChange={onChange} error={errors.recordDate} required />
          </div>
          {FIELDS.map((f) => (
            <div key={f.key} className="col-6 col-md-4">
              <FormField
                label={f.label}
                type="number"
                step="0.1"
                min={f.min}
                max={f.max}
                name={f.key}
                value={values[f.key]}
                onChange={onChange}
                error={errors[f.key]}
                required={f.required}
              />
            </div>
          ))}
          <div className="col-12">
            <FormField label="Notes" as="textarea" rows={2} name="notes" maxLength={500} value={values.notes} onChange={onChange} error={errors.notes} placeholder="How did you feel? Any changes to routine?" />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <SubmitButton loading={saving} loadingText="Saving…">
            <Save size={17} /> {record ? 'Save changes' : 'Save record'}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
