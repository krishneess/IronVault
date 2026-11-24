import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, LogIn, Lock, UserRound } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField, { PasswordField } from '../../components/common/FormField';
import { SubmitButton } from '../../components/common/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateLogin } from '../../utils/validation';
import { roleHome, ROLE_LABELS } from '../../utils/format';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign in · IronVault';
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validation = validateLogin(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setLoading(true);
    try {
      const user = await login(values.identifier.trim(), values.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`, `Signed in as ${ROLE_LABELS[user.role]}.`);
      const from = location.state?.from;
      // Only return to a page inside this user's own area.
      navigate(from && from.startsWith(roleHome(user.role)) ? from : roleHome(user.role), { replace: true });
    } catch (err) {
      setFormError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="eyebrow mb-2">Welcome back</div>
      <h1>Sign in to IronVault</h1>
      <p className="text-muted-iv mb-4">Members, trainers and administrators sign in here.</p>

      {formError && (
        <div className="auth-alert" role="alert">
          <CircleAlert size={18} className="flex-shrink-0 mt-1" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <FormField
          label="Email or username"
          name="identifier"
          icon={UserRound}
          value={values.identifier}
          onChange={onChange}
          error={errors.identifier}
          placeholder="you@example.com"
          autoComplete="username"
          autoFocus
        />
        <PasswordField
          label="Password"
          name="password"
          icon={Lock}
          value={values.password}
          onChange={onChange}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <SubmitButton loading={loading} loadingText="Signing in…" className="btn-gold w-100 btn-lg mt-2">
          <LogIn size={18} /> Sign in
        </SubmitButton>
      </form>

      <p className="auth-switch">
        New to IronVault? <Link to="/register" className="fw-semibold">Create a member account</Link>
      </p>
      <p className="text-center text-muted-iv" style={{ fontSize: '.78rem' }}>
        Trainer and administrator accounts are issued by the gym administrator.
      </p>
    </AuthLayout>
  );
}
