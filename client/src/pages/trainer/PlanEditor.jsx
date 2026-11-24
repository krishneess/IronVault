import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, CircleAlert, Plus, Save, Trash2 } from 'lucide-react';
import { Card, PageHeader } from '../../components/common/Display';
import FormField from '../../components/common/FormField';
import { ErrorState, PageLoader, SubmitButton } from '../../components/common/Feedback';
import { useToast } from '../../context/ToastContext';
import { PLAN_TYPES } from '../../components/fitness/planTypes';

const EMPTY_ITEM = {
  workout: { name: '', sets: 3, repetitions: 10, restTime: 60, notes: '' },
  diet: { mealName: '', time: '', calories: '', description: '' },
};

const EMPTY_PLAN = {
  workout: { title: '', description: '', level: 'beginner', durationInWeeks: 4, exercises: [{ ...EMPTY_ITEM.workout }] },
  diet: { title: '', description: '', goal: '', calorieTarget: 2000, meals: [{ ...EMPTY_ITEM.diet }] },
};

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function toForm(type, plan) {
  if (!plan) return structuredClone(EMPTY_PLAN[type]);
  if (type === 'workout') {
    return {
      title: plan.title,
      description: plan.description || '',
      level: plan.level,
      durationInWeeks: plan.durationInWeeks,
      exercises: plan.exercises.map(({ name, sets, repetitions, restTime, notes }) => ({ name, sets, repetitions, restTime: restTime ?? '', notes: notes || '' })),
    };
  }
  return {
    title: plan.title,
    description: plan.description || '',
    goal: plan.goal,
    calorieTarget: plan.calorieTarget,
    meals: plan.meals.map(({ mealName, time, calories, description }) => ({ mealName, time: time || '', calories, description: description || '' })),
  };
}

const outOfRange = (v, min, max) => v === '' || Number.isNaN(Number(v)) || Number(v) < min || Number(v) > max;

function validatePlan(type, v) {
  const e = {};
  if (v.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
  if (v.description.length > 2000) e.description = 'At most 2000 characters';
  if (type === 'workout') {
    if (outOfRange(v.durationInWeeks, 1, 104)) e.durationInWeeks = '1–104 weeks';
    if (!v.exercises.length) e.exercises = 'Add at least one exercise';
    v.exercises.forEach((x, i) => {
      if (!x.name.trim()) e[`exercises.${i}.name`] = 'Required';
      if (outOfRange(x.sets, 1, 20)) e[`exercises.${i}.sets`] = '1–20';
      if (outOfRange(x.repetitions, 1, 200)) e[`exercises.${i}.repetitions`] = '1–200';
      if (x.restTime !== '' && outOfRange(x.restTime, 0, 900)) e[`exercises.${i}.restTime`] = '0–900 s';
    });
  } else {
    if (!v.goal.trim()) e.goal = 'Goal is required';
    if (outOfRange(v.calorieTarget, 800, 10000)) e.calorieTarget = '800–10000 kcal';
    if (!v.meals.length) e.meals = 'Add at least one meal';
    v.meals.forEach((m, i) => {
      if (!m.mealName.trim()) e[`meals.${i}.mealName`] = 'Required';
      if (outOfRange(m.calories, 0, 5000)) e[`meals.${i}.calories`] = '0–5000';
      if (m.time && !TIME_REGEX.test(m.time)) e[`meals.${i}.time`] = 'HH:MM';
    });
  }
  return e;
}

function toPayload(type, v) {
  if (type === 'workout') {
    return {
      ...v,
      title: v.title.trim(),
      durationInWeeks: Number(v.durationInWeeks),
      exercises: v.exercises.map((x) => ({
        name: x.name.trim(),
        sets: Number(x.sets),
        repetitions: Number(x.repetitions),
        restTime: x.restTime === '' ? undefined : Number(x.restTime),
        notes: x.notes.trim(),
      })),
    };
  }
  return {
    ...v,
    title: v.title.trim(),
    goal: v.goal.trim(),
    calorieTarget: Number(v.calorieTarget),
    meals: v.meals.map((m) => ({ mealName: m.mealName.trim(), time: m.time, calories: Number(m.calories), description: m.description.trim() })),
  };
}

/** Create / edit page for workout and diet plans, with dynamic exercise or meal rows. */
export default function PlanEditor({ type }) {
  const cfg = PLAN_TYPES[type];
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState(() => toForm(type, null));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const itemsKey = cfg.itemsKey;

  useEffect(() => {
    if (!editing) return undefined;
    let cancelled = false;
    cfg.service
      .get(id)
      .then((res) => !cancelled && setValues(toForm(type, res.data)))
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [editing, id, type, cfg.service]);

  const clearError = (key) => errors[key] && setErrors((er) => ({ ...er, [key]: undefined }));

  const onField = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    clearError(name);
  };

  const onItem = (index, field, value) => {
    setValues((v) => ({ ...v, [itemsKey]: v[itemsKey].map((it, i) => (i === index ? { ...it, [field]: value } : it)) }));
    clearError(`${itemsKey}.${index}.${field}`);
  };

  const addItem = () => {
    setValues((v) => ({ ...v, [itemsKey]: [...v[itemsKey], { ...EMPTY_ITEM[type] }] }));
    clearError(itemsKey);
  };

  // Removing / reordering rows shifts indexes, so row-level errors are cleared.
  const dropItemErrors = () => setErrors((er) => Object.fromEntries(Object.entries(er).filter(([k]) => !k.startsWith(`${itemsKey}.`))));

  const removeItem = (index) => {
    setValues((v) => ({ ...v, [itemsKey]: v[itemsKey].filter((_, i) => i !== index) }));
    dropItemErrors();
  };

  const moveItem = (index, delta) => {
    setValues((v) => {
      const items = [...v[itemsKey]];
      const target = index + delta;
      if (target < 0 || target >= items.length) return v;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...v, [itemsKey]: items };
    });
    dropItemErrors();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validatePlan(type, values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(type, values);
      const res = editing ? await cfg.service.update(id, payload) : await cfg.service.create(payload);
      toast.success(editing ? `${cfg.label} updated` : `${cfg.label} created`, res.data.title);
      navigate(`${cfg.basePath}/${res.data._id}`, { replace: true });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error('Could not save plan', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading plan…" />;
  if (loadError) return <Card><ErrorState message={loadError} /></Card>;

  const items = values[itemsKey];
  const totalCalories = type === 'diet' ? items.reduce((s, m) => s + (Number(m.calories) || 0), 0) : 0;

  return (
    <>
      <Link to={editing ? `${cfg.basePath}/${id}` : cfg.basePath} className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> Back</Link>
      <PageHeader eyebrow={cfg.label} title={editing ? `Edit ${cfg.label.toLowerCase()}` : `New ${cfg.label.toLowerCase()}`} />

      <form onSubmit={onSubmit} noValidate>
        <Card title="Plan details" className="mb-4">
          <div className="row">
            <div className={type === 'workout' ? 'col-lg-6' : 'col-md-8'}>
              <FormField label="Title" name="title" value={values.title} onChange={onField} error={errors.title} maxLength={120} required placeholder={type === 'workout' ? 'e.g. Strength Foundations' : 'e.g. Lean Cut 2200'} />
            </div>
            {type === 'workout' ? (
              <>
                <div className="col-6 col-lg-3">
                  <FormField label="Level" as="select" name="level" value={values.level} onChange={onField} error={errors.level} required>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </FormField>
                </div>
                <div className="col-6 col-lg-3">
                  <FormField label="Weeks" type="number" min="1" max="104" name="durationInWeeks" value={values.durationInWeeks} onChange={onField} error={errors.durationInWeeks} required />
                </div>
              </>
            ) : (
              <div className="col-md-4">
                <FormField label="Daily calorie target" type="number" min="800" max="10000" name="calorieTarget" value={values.calorieTarget} onChange={onField} error={errors.calorieTarget} required />
              </div>
            )}
            {type === 'diet' && (
              <div className="col-12">
                <FormField label="Goal" name="goal" value={values.goal} onChange={onField} error={errors.goal} maxLength={120} required placeholder="e.g. Fat loss, Lean bulk, Maintenance" />
              </div>
            )}
            <div className="col-12">
              <FormField label="Description" as="textarea" rows={3} name="description" value={values.description} onChange={onField} error={errors.description} maxLength={2000} placeholder="Purpose, structure and guidance for the member" />
            </div>
          </div>
        </Card>

        <Card
          title={type === 'workout' ? 'Exercises' : 'Meals'}
          subtitle={type === 'workout' ? `${items.length} exercise${items.length === 1 ? '' : 's'}` : `${items.length} meal${items.length === 1 ? '' : 's'} · ${totalCalories} / ${values.calorieTarget || 0} kcal`}
          actions={<button type="button" className="btn btn-outline-gold btn-sm" onClick={addItem}><Plus size={15} /> Add {cfg.itemLabel}</button>}
          className="mb-4"
        >
          {errors[itemsKey] && (
            <div className="auth-alert"><CircleAlert size={18} className="flex-shrink-0" /> {errors[itemsKey]}</div>
          )}
          {items.map((item, i) => (
            <div key={i} className="p-3 mb-3 rounded-3" style={{ background: 'var(--iv-bg-elevated)', border: '1px solid var(--iv-border-soft)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="eyebrow">{cfg.itemLabel} {i + 1}</span>
                <div className="d-flex gap-1">
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => moveItem(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={15} /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown size={15} /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => removeItem(i)} disabled={items.length === 1} aria-label={`Remove ${cfg.itemLabel} ${i + 1}`}><Trash2 size={15} /></button>
                </div>
              </div>
              {type === 'workout' ? (
                <div className="row g-2">
                  <div className="col-md-5">
                    <FormField className="mb-0" label="Exercise" value={item.name} onChange={(e) => onItem(i, 'name', e.target.value)} error={errors[`exercises.${i}.name`]} placeholder="e.g. Barbell Squat" maxLength={100} />
                  </div>
                  <div className="col-4 col-md-2">
                    <FormField className="mb-0" label="Sets" type="number" min="1" max="20" value={item.sets} onChange={(e) => onItem(i, 'sets', e.target.value)} error={errors[`exercises.${i}.sets`]} />
                  </div>
                  <div className="col-4 col-md-2">
                    <FormField className="mb-0" label="Reps" type="number" min="1" max="200" value={item.repetitions} onChange={(e) => onItem(i, 'repetitions', e.target.value)} error={errors[`exercises.${i}.repetitions`]} />
                  </div>
                  <div className="col-4 col-md-3">
                    <FormField className="mb-0" label="Rest (sec)" type="number" min="0" max="900" value={item.restTime} onChange={(e) => onItem(i, 'restTime', e.target.value)} error={errors[`exercises.${i}.restTime`]} />
                  </div>
                  <div className="col-12">
                    <FormField className="mb-0" label="Notes" value={item.notes} onChange={(e) => onItem(i, 'notes', e.target.value)} error={errors[`exercises.${i}.notes`]} placeholder="Tempo, form cues, progression…" maxLength={300} />
                  </div>
                </div>
              ) : (
                <div className="row g-2">
                  <div className="col-md-6">
                    <FormField className="mb-0" label="Meal" value={item.mealName} onChange={(e) => onItem(i, 'mealName', e.target.value)} error={errors[`meals.${i}.mealName`]} placeholder="e.g. Breakfast – oats & whey" maxLength={100} />
                  </div>
                  <div className="col-6 col-md-3">
                    <FormField className="mb-0" label="Time" type="time" value={item.time} onChange={(e) => onItem(i, 'time', e.target.value)} error={errors[`meals.${i}.time`]} />
                  </div>
                  <div className="col-6 col-md-3">
                    <FormField className="mb-0" label="Calories" type="number" min="0" max="5000" value={item.calories} onChange={(e) => onItem(i, 'calories', e.target.value)} error={errors[`meals.${i}.calories`]} />
                  </div>
                  <div className="col-12">
                    <FormField className="mb-0" label="Description" value={item.description} onChange={(e) => onItem(i, 'description', e.target.value)} error={errors[`meals.${i}.description`]} placeholder="Ingredients and portions" maxLength={500} />
                  </div>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline-gold w-100" onClick={addItem}><Plus size={16} /> Add {cfg.itemLabel}</button>
        </Card>

        <div className="d-flex justify-content-end gap-2">
          <Link to={editing ? `${cfg.basePath}/${id}` : cfg.basePath} className="btn btn-ghost">Cancel</Link>
          <SubmitButton loading={saving} loadingText="Saving…">
            <Save size={17} /> {editing ? 'Save changes' : `Create ${cfg.label.toLowerCase()}`}
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
