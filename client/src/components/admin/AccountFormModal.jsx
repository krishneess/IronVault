import { useState } from 'react';
import { AtSign, KeyRound, Mail, Phone, Save, UserRound } from 'lucide-react';
import Modal from '../common/Modal';
import FormField, { PasswordField } from '../common/FormField';
import { SubmitButton } from '../common/Feedback';
import { useToast } from '../../context/ToastContext';
import { adminMemberService, adminTrainerService } from '../../services/adminService';
import { EMAIL_REGEX, PASSWORD_HINT, PASSWORD_REGEX, PHONE_REGEX, USERNAME_REGEX } from '../../utils/validation';

const SERVICE = { member: adminMemberService, trainer: adminTrainerService };

function initial(role, account) {
  const base = {
    name: account?.name || '',
    email: account?.email || '',
    username: account?.username || '',
    phone: account?.phone || '',
    password: '',
  };
  if (role === 'member') {
    return { ...base, age: account?.age ?? '', gender: account?.gender || '', height: account?.height ?? '', weight: account?.weight ?? '', fitnessGoal: account?.fitnessGoal || '' };
  }
  return { ...base, specialization: account?.specialization || '', experience: account?.experience ?? '', bio: account?.bio || '' };
}

function validateForm(role, v, editing) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Enter the full name';
  if (!EMAIL_REGEX.test(v.email)) e.email = 'Enter a valid email';
  if (!USERNAME_REGEX.test(v.username)) e.username = '3–30 characters: letters, numbers, _ or .';
  if (v.phone && !PHONE_REGEX.test(v.phone)) e.phone = 'Enter a valid phone number';
  if ((!editing || v.password) && !PASSWORD_REGEX.test(v.password)) e.password = PASSWORD_HINT;
  const range = (k, min, max) => {
    if (v[k] === '' || v[k] === undefined) return;
    const n = Number(v[k]);
    if (Number.isNaN(n) || n < min || n > max) e[k] = `${min}–${max}`;
  };
  if (role === 'member') {
    range('age', 10, 100);
    range('height', 50, 260);
    range('weight', 20, 400);
  } else {
    if (v.specialization.trim().length < 2) e.specialization = 'Specialization is required';
    range('experience', 0, 60);
  }
  return e;
}

/** Create or edit a member / trainer account (admin). */
export default function AccountFormModal({ role, account, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(account);
  const [values, setValues] = useState(() => initial(role, account));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const label = role === 'member' ? 'member' : 'trainer';

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const validation = validateForm(role, values, editing);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    const { password, ...rest } = values;
    const payload = { ...rest, name: rest.name.trim(), email: rest.email.trim(), username: rest.username.trim() };
    if (editing) {
      if (password) payload.newPassword = password;
    } else {
      payload.password = password;
    }
    setSaving(true);
    try {
      const res = editing ? await SERVICE[role].update(account._id, payload) : await SERVICE[role].create(payload);
      toast.success(editing ? 'Account updated' : `${label[0].toUpperCase()}${label.slice(1)} account created`, res.data.name);
      onSaved(res.data);
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error('Could not save account', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} busy={saving} size="lg" title={editing ? `Edit ${label}` : `Add ${label}`} subtitle={editing ? account.email : `Creates a ${label} login with the password you set`}>
      <form onSubmit={submit} noValidate>
        <div className="row">
          <div className="col-md-6"><FormField label="Full name" name="name" icon={UserRound} value={values.name} onChange={onChange} error={errors.name} required /></div>
          <div className="col-md-6"><FormField label="Username" name="username" icon={AtSign} value={values.username} onChange={onChange} error={errors.username} required /></div>
          <div className="col-md-6"><FormField label="Email" type="email" name="email" icon={Mail} value={values.email} onChange={onChange} error={errors.email} required /></div>
          <div className="col-md-6"><FormField label="Phone" type="tel" name="phone" icon={Phone} value={values.phone} onChange={onChange} error={errors.phone} /></div>
          {role === 'member' ? (
            <>
              <div className="col-6 col-md-3"><FormField label="Age" type="number" name="age" value={values.age} onChange={onChange} error={errors.age} /></div>
              <div className="col-6 col-md-3">
                <FormField label="Gender" as="select" name="gender" value={values.gender} onChange={onChange} error={errors.gender}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </FormField>
              </div>
              <div className="col-6 col-md-3"><FormField label="Height (cm)" type="number" step="0.1" name="height" value={values.height} onChange={onChange} error={errors.height} /></div>
              <div className="col-6 col-md-3"><FormField label="Weight (kg)" type="number" step="0.1" name="weight" value={values.weight} onChange={onChange} error={errors.weight} /></div>
              <div className="col-12"><FormField label="Fitness goal" name="fitnessGoal" maxLength={200} value={values.fitnessGoal} onChange={onChange} error={errors.fitnessGoal} /></div>
            </>
          ) : (
            <>
              <div className="col-md-8"><FormField label="Specialization" name="specialization" value={values.specialization} onChange={onChange} error={errors.specialization} required placeholder="e.g. Strength & Conditioning" /></div>
              <div className="col-md-4"><FormField label="Experience (years)" type="number" name="experience" value={values.experience} onChange={onChange} error={errors.experience} /></div>
              <div className="col-12"><FormField label="Bio" as="textarea" rows={2} name="bio" maxLength={1000} value={values.bio} onChange={onChange} error={errors.bio} /></div>
            </>
          )}
          <div className="col-md-6">
            <PasswordField
              label={editing ? 'Reset password' : 'Initial password'}
              name="password"
              icon={KeyRound}
              value={values.password}
              onChange={onChange}
              error={errors.password}
              hint={editing ? 'Leave blank to keep the current password' : PASSWORD_HINT}
              autoComplete="new-password"
              required={!editing}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <SubmitButton loading={saving} loadingText="Saving…"><Save size={17} /> {editing ? 'Save changes' : `Create ${label}`}</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
