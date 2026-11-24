import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, CircleAlert, Lock, Mail, Phone, Target, UserPlus, UserRound } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField, { PasswordField } from '../../components/common/FormField';
import { SubmitButton } from '../../components/common/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateRegister, PASSWORD_HINT } from '../../utils/validation';

const INITIAL = {
  name: '',
  email: '',
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  fitnessGoal: '',
};

const NUMERIC = ['age', 'height', 'weight'];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Join · IronVault';
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const parsed = { ...values };
    NUMERIC.forEach((k) => {
      parsed[k] = values[k] === '' ? undefined : Number(values[k]);
    });
    const validation = validateRegister(parsed);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setFormError('Please correct the highlighted fields.');
      return;
    }

    const payload = Object.fromEntries(
      Object.entries({ ...parsed, name: parsed.name.trim(), email: parsed.email.trim(), username: parsed.username.trim() }).filter(
        ([, v]) => v !== undefined && v !== ''
      )
    );

    setLoading(true);
    try {
      const user = await register(payload);
      toast.success('Welcome to IronVault!', `Your account is ready, ${user.name.split(' ')[0]}. Choose a membership plan to unlock training.`);
      navigate('/member/membership', { replace: true });
    } catch (err) {
      setFormError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout wide>
      <div className="eyebrow mb-2">Member registration</div>
      <h1>Create your account</h1>
      <p className="text-muted-iv mb-4">Join as a member. Your trainer and plans will be assigned by the gym.</p>

      {formError && (
        <div className="auth-alert" role="alert">
          <CircleAlert size={18} className="flex-shrink-0 mt-1" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="auth-section-label">Account details</div>
        <div className="row">
          <div className="col-md-6">
            <FormField label="Full name" name="name" icon={UserRound} value={values.name} onChange={onChange} error={errors.name} placeholder="Alex Morgan" autoComplete="name" required />
          </div>
          <div className="col-md-6">
            <FormField label="Username" name="username" icon={AtSign} value={values.username} onChange={onChange} error={errors.username} placeholder="alex.morgan" autoComplete="username" required />
          </div>
          <div className="col-md-6">
            <FormField label="Email" type="email" name="email" icon={Mail} value={values.email} onChange={onChange} error={errors.email} placeholder="you@example.com" autoComplete="email" required />
          </div>
          <div className="col-md-6">
            <FormField label="Phone" type="tel" name="phone" icon={Phone} value={values.phone} onChange={onChange} error={errors.phone} placeholder="+91 98765 43210" autoComplete="tel" />
          </div>
          <div className="col-md-6">
            <PasswordField name="password" icon={Lock} value={values.password} onChange={onChange} error={errors.password} hint={PASSWORD_HINT} autoComplete="new-password" required />
          </div>
          <div className="col-md-6">
            <PasswordField label="Confirm password" name="confirmPassword" icon={Lock} value={values.confirmPassword} onChange={onChange} error={errors.confirmPassword} autoComplete="new-password" required />
          </div>
        </div>

        <div className="auth-section-label mt-2">Fitness profile <span className="text-lowercase fw-normal" style={{ letterSpacing: 0 }}>(optional)</span></div>
        <div className="row">
          <div className="col-6 col-md-3">
            <FormField label="Age" type="number" name="age" min="10" max="100" value={values.age} onChange={onChange} error={errors.age} />
          </div>
          <div className="col-6 col-md-3">
            <FormField label="Gender" as="select" name="gender" value={values.gender} onChange={onChange} error={errors.gender}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </FormField>
          </div>
          <div className="col-6 col-md-3">
            <FormField label="Height (cm)" type="number" name="height" min="50" max="260" step="0.1" value={values.height} onChange={onChange} error={errors.height} />
          </div>
          <div className="col-6 col-md-3">
            <FormField label="Weight (kg)" type="number" name="weight" min="20" max="400" step="0.1" value={values.weight} onChange={onChange} error={errors.weight} />
          </div>
          <div className="col-12">
            <FormField label="Fitness goal" name="fitnessGoal" icon={Target} value={values.fitnessGoal} onChange={onChange} error={errors.fitnessGoal} placeholder="e.g. Build lean muscle and improve endurance" maxLength={200} />
          </div>
        </div>

        <SubmitButton loading={loading} loadingText="Creating account…" className="btn-gold w-100 btn-lg mt-1">
          <UserPlus size={18} /> Create member account
        </SubmitButton>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login" className="fw-semibold">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
