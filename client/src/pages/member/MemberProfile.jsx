import { useState } from 'react';
import { Phone, Save, Target, UserRound } from 'lucide-react';
import { Avatar, Card, InfoRow, PageHeader, StatusBadge } from '../../components/common/Display';
import FormField from '../../components/common/FormField';
import { SubmitButton } from '../../components/common/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { memberService } from '../../services/fitnessService';
import { PHONE_REGEX } from '../../utils/validation';
import { formatDate } from '../../utils/format';

const fromUser = (u) => ({
  name: u.name || '',
  phone: u.phone || '',
  age: u.age ?? '',
  gender: u.gender || '',
  height: u.height ?? '',
  weight: u.weight ?? '',
  fitnessGoal: u.fitnessGoal || '',
});

function validateProfile(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Enter your full name';
  if (v.phone && !PHONE_REGEX.test(v.phone)) e.phone = 'Enter a valid phone number';
  const range = (key, min, max, label) => {
    if (v[key] === '') return;
    const n = Number(v[key]);
    if (Number.isNaN(n) || n < min || n > max) e[key] = `${label} must be ${min}–${max}`;
  };
  range('age', 10, 100, 'Age');
  range('height', 50, 260, 'Height');
  range('weight', 20, 400, 'Weight');
  if (v.fitnessGoal.length > 200) e.fitnessGoal = 'At most 200 characters';
  return e;
}

export default function MemberProfile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState(() => fromUser(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validateProfile(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setSaving(true);
    try {
      const res = await memberService.updateProfile({ ...values, name: values.name.trim() });
      setUser(res.data.profile);
      setValues(fromUser(res.data.profile));
      toast.success('Profile updated', 'Your details have been saved.');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error('Could not update profile', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Member" title="My profile" description="Keep your personal and fitness details up to date." />
      <div className="row g-4">
        <div className="col-lg-4">
          <Card>
            <div className="text-center mb-3">
              <div className="d-flex justify-content-center mb-3"><Avatar name={user.name} size="lg" /></div>
              <div className="h5 mb-1">{user.name}</div>
              <div className="text-muted-iv mb-2" style={{ fontSize: '.85rem' }}>@{user.username}</div>
              <StatusBadge active={user.isActive} />
            </div>
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Member since" value={formatDate(user.joinDate)} />
            <p className="text-muted-iv mt-3 mb-0" style={{ fontSize: '.78rem' }}>
              To change your email or username, contact the gym administrator.
            </p>
          </Card>
        </div>
        <div className="col-lg-8">
          <Card title="Edit details">
            <form onSubmit={onSubmit} noValidate>
              <div className="row">
                <div className="col-md-6">
                  <FormField label="Full name" name="name" icon={UserRound} value={values.name} onChange={onChange} error={errors.name} required />
                </div>
                <div className="col-md-6">
                  <FormField label="Phone" type="tel" name="phone" icon={Phone} value={values.phone} onChange={onChange} error={errors.phone} />
                </div>
                <div className="col-6 col-md-3">
                  <FormField label="Age" type="number" name="age" min="10" max="100" value={values.age} onChange={onChange} error={errors.age} />
                </div>
                <div className="col-6 col-md-3">
                  <FormField label="Gender" as="select" name="gender" value={values.gender} onChange={onChange} error={errors.gender}>
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </FormField>
                </div>
                <div className="col-6 col-md-3">
                  <FormField label="Height (cm)" type="number" step="0.1" name="height" value={values.height} onChange={onChange} error={errors.height} />
                </div>
                <div className="col-6 col-md-3">
                  <FormField label="Weight (kg)" type="number" step="0.1" name="weight" value={values.weight} onChange={onChange} error={errors.weight} hint="Starting weight" />
                </div>
                <div className="col-12">
                  <FormField label="Fitness goal" name="fitnessGoal" icon={Target} maxLength={200} value={values.fitnessGoal} onChange={onChange} error={errors.fitnessGoal} />
                </div>
              </div>
              <SubmitButton loading={saving} loadingText="Saving…">
                <Save size={17} /> Save profile
              </SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
