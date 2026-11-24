import { adminMemberService, adminTrainerService } from '../../services/adminService';

/** Confirms and performs member activation / deactivation (shared with the detail page). */
export async function toggleMemberStatus({ member, confirm, toast, onDone }) {
  const deactivate = member.isActive;
  const ok = await confirm({
    title: `${deactivate ? 'Deactivate' : 'Reactivate'} ${member.name}?`,
    message: deactivate
      ? 'The member will no longer be able to sign in. Their trainer assignment will end and any open membership will be cancelled. Their history is kept.'
      : 'The member will be able to sign in again. A new membership and trainer can then be assigned.',
    confirmText: deactivate ? 'Deactivate account' : 'Reactivate',
    variant: deactivate ? 'danger' : 'primary',
  });
  if (!ok) return;
  try {
    const res = await adminMemberService.setActive(member._id, !deactivate);
    const fx = res.data.effects || {};
    const extra = [fx.trainerUnassigned && 'trainer unassigned', fx.membershipClosed && 'membership closed'].filter(Boolean).join(', ');
    toast.success(res.message, extra ? `Also: ${extra}.` : undefined);
    onDone?.();
  } catch (err) {
    toast.error('Could not update account', err.message);
  }
}

export async function toggleTrainerStatus({ trainer, confirm, toast, onDone }) {
  const deactivate = trainer.isActive;
  const members = trainer.stats?.activeMembers ?? 0;
  const ok = await confirm({
    title: `${deactivate ? 'Deactivate' : 'Reactivate'} ${trainer.name}?`,
    message: deactivate
      ? `The trainer will no longer be able to sign in.${members ? ` Their ${members} assigned member(s) will be unassigned and lose this trainer's plans.` : ''} Their plans are kept.`
      : 'The trainer will be able to sign in again and can be assigned members.',
    confirmText: deactivate ? 'Deactivate trainer' : 'Reactivate',
    variant: deactivate ? 'danger' : 'primary',
  });
  if (!ok) return;
  try {
    const res = await adminTrainerService.setActive(trainer._id, !deactivate);
    const n = res.data.effects?.membersUnassigned;
    toast.success(res.message, n ? `${n} member(s) unassigned.` : undefined);
    onDone?.();
  } catch (err) {
    toast.error('Could not update account', err.message);
  }
}
