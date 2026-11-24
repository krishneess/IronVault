import { useState } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Avatar, Card, InfoRow, PageHeader, RoleBadge, StatusBadge } from '../../components/common/Display';
import { PasswordField } from '../../components/common/FormField';
import { SubmitButton } from '../../components/common/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { validateChangePassword, PASSWORD_HINT } from '../../utils/validation';
import { formatDate, formatDateTime } from '../../utils/format';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Shared by all three roles. */
export default function AccountSettings() {
  const { user } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validateChangePassword(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setLoading(true);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success('Password updated', 'Use your new password the next time you sign in.');
      setValues(EMPTY);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error('Could not update password', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account" title="Account settings" description="Your sign-in details and security." />
      <div className="row g-4">
        <div className="col-lg-5">
          <Card title="Account">
            <div className="d-flex align-items-center gap-3 mb-3">
              <Avatar name={user.name} size="lg" />
              <div>
                <div className="h5 mb-1">{user.name}</div>
                <div className="d-flex gap-2"><RoleBadge role={user.role} /><StatusBadge active={user.isActive} /></div>
              </div>
            </div>
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Username" value={`@${user.username}`} />
            <InfoRow label="Account created" value={formatDate(user.createdAt)} />
            <InfoRow label="Last sign-in" value={formatDateTime(user.lastLoginAt)} />
          </Card>
        </div>
        <div className="col-lg-7">
          <Card title="Change password" subtitle="Passwords are hashed with bcrypt before storage">
            <form onSubmit={onSubmit} noValidate>
              <PasswordField label="Current password" name="currentPassword" icon={Lock} value={values.currentPassword} onChange={onChange} error={errors.currentPassword} autoComplete="current-password" required />
              <PasswordField label="New password" name="newPassword" icon={KeyRound} value={values.newPassword} onChange={onChange} error={errors.newPassword} hint={PASSWORD_HINT} autoComplete="new-password" required />
              <PasswordField label="Confirm new password" name="confirmPassword" icon={KeyRound} value={values.confirmPassword} onChange={onChange} error={errors.confirmPassword} autoComplete="new-password" required />
              <SubmitButton loading={loading} loadingText="Updating…">
                <ShieldCheck size={17} /> Update password
              </SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
