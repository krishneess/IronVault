import { useState } from 'react';
import { BriefcaseBusiness, Phone, Save, UserRound } from 'lucide-react';
import { Avatar, Card, InfoRow, PageHeader, StatusBadge } from '../../components/common/Display';
import FormField from '../../components/common/FormField';
import { SubmitButton } from '../../components/common/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { trainerService } from '../../services/fitnessService';
import { PHONE_REGEX } from '../../utils/validation';
import { formatDate } from '../../utils/format';

const fromUser = (u) => ({
  name: u.name || '',
  phone: u.phone || '',
  specialization: u.specialization || '',
  experience: u.experience ?? '',
  bio: u.bio || '',
});

function validateProfile(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Enter your full name';
  if (v.phone && !PHONE_REGEX.test(v.phone)) e.phone = 'Enter a valid phone number';
  if (v.specialization.trim().length < 2) e.specialization = 'Specialization is required';
  if (v.experience !== '' && (Number(v.experience) < 0 || Number(v.experience) > 60)) e.experience = '0–60 years';
  if (v.bio.length > 1000) e.bio = 'At most 1000 characters';
  return e;
}

export default function TrainerProfile() {
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
      const res = await trainerService.updateProfile({ ...values, name: values.name.trim(), specialization: values.specialization.trim() });
      setUser(res.data.profile);
      setValues(fromUser(res.data.profile));
      toast.success('Profile updated', 'Members will see your updated profile.');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error('Could not update profile', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Trainer" title="My profile" description="This is the profile your assigned members see." />
      <div className="row g-4">
        <div className="col-lg-4">
          <Card>
            <div className="text-center mb-3">
              <div className="d-flex justify-content-center mb-3"><Avatar name={user.name} size="lg" /></div>
              <div className="h5 mb-1">{user.name}</div>
              <div className="text-champagne mb-2" style={{ fontSize: '.9rem' }}>{user.specialization}</div>
              <StatusBadge active={user.isActive} />
            </div>
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Username" value={`@${user.username}`} />
            <InfoRow label="Trainer since" value={formatDate(user.createdAt)} />
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
                <div className="col-md-8">
                  <FormField label="Specialization" name="specialization" icon={BriefcaseBusiness} value={values.specialization} onChange={onChange} error={errors.specialization} maxLength={80} required />
                </div>
                <div className="col-md-4">
                  <FormField label="Experience (years)" type="number" min="0" max="60" name="experience" value={values.experience} onChange={onChange} error={errors.experience} />
                </div>
                <div className="col-12">
                  <FormField label="Bio" as="textarea" rows={4} name="bio" maxLength={1000} value={values.bio} onChange={onChange} error={errors.bio} placeholder="Coaching style, certifications, what members can expect" />
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
