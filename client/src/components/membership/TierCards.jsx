import { CircleCheck, PauseCircle } from 'lucide-react';
import { durationLabel, formatMoney } from './membershipMeta';

/** Membership tier cards. Pass onSelect to show a select button per tier. */
export default function TierCards({ tiers, onSelect, selectingId, actionLabel = 'Choose plan', renderAction }) {
  const featuredIndex = tiers.length >= 3 ? 1 : -1;
  return (
    <div className="row g-4">
      {tiers.map((tier, i) => (
        <div key={tier._id} className={`col-md-6 ${tiers.length >= 3 ? 'col-xl-4' : ''}`}>
          <article className={`role-card d-flex flex-column ${i === featuredIndex ? 'featured' : ''}`} style={{ padding: '1.75rem' }}>
            <div className="d-flex justify-content-between align-items-start gap-2">
              <h3 className="m-0" style={{ fontFamily: 'var(--iv-font-display)', fontSize: '1.5rem' }}>{tier.name}</h3>
              {i === featuredIndex && <span className="iv-badge iv-badge-gold">Popular</span>}
            </div>
            <div className="mt-3 mb-1">
              <span className="text-gold-gradient fw-bold" style={{ fontSize: '2.2rem' }}>{formatMoney(tier.price)}</span>
              <span className="text-muted-iv ms-2">/ {durationLabel(tier.durationInDays)}</span>
            </div>
            {tier.description && <p className="text-muted-iv mb-0" style={{ fontSize: '.9rem' }}>{tier.description}</p>}
            <ul className="flex-grow-1">
              {tier.features.map((f) => (
                <li key={f}><CircleCheck size={16} /> {f}</li>
              ))}
              <li>
                <PauseCircle size={16} />
                {tier.maxHoldDays > 0 ? `Hold up to ${tier.maxHoldDays} days` : 'No membership holds'}
              </li>
            </ul>
            {renderAction
              ? renderAction(tier, i === featuredIndex)
              : onSelect && (
                  <button
                    type="button"
                    className={`btn w-100 mt-3 ${i === featuredIndex ? 'btn-gold' : 'btn-outline-gold'}`}
                    disabled={Boolean(selectingId)}
                    onClick={() => onSelect(tier)}
                  >
                    {selectingId === tier._id ? 'Selecting…' : actionLabel}
                  </button>
                )}
          </article>
        </div>
      ))}
    </div>
  );
}
