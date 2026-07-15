'use client';

import { Crown, Edit3, Eye, Megaphone, Play, Plus, Square, Trash2, Trophy, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { AdminTableSkeleton } from '@/components/admin/admin-table-skeleton';
import { ImageUploader } from '@/components/media/image-uploader';
import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500';

type RaffleStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';

type PromotionPlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  badgeLabel?: string | null;
  color?: string | null;
  isActive: boolean;
};

type RaffleListItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  startsAt: string;
  endsAt: string;
  status: RaffleStatus;
  participantsCount: number;
};

type RaffleParticipant = {
  rank: number;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  totalPoints: number;
  isWinner: boolean;
};

type RaffleDetail = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  startsAt: string;
  endsAt: string;
  status: RaffleStatus;
  isEnded: boolean;
  participantsCount: number;
  planPoints: Array<{
    planId: string;
    points: number;
    plan: PromotionPlan;
  }>;
  participants: RaffleParticipant[];
  winner: {
    userId: string;
    fullName: string;
    email: string;
    totalPoints: number;
  } | null;
  hero: {
    published: boolean;
    isActive: boolean;
    heroSlideId: string | null;
    platform: 'WEB' | 'MOBILE' | 'ALL' | null;
    imageUrl: string | null;
  };
};

type HeroPublishForm = {
  imageUrl: string;
  platform: 'WEB' | 'MOBILE' | 'ALL';
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  buttonLabelAr: string;
  buttonLabelEn: string;
  buttonLink: string;
};

type RaffleFormState = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  startsAt: string;
  endsAt: string;
  status: RaffleStatus;
  planPoints: Record<string, string>;
};

function toDateTimeLocal(value: string | Date) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultForm(plans: PromotionPlan[]): RaffleFormState {
  const planPoints = Object.fromEntries(plans.map((plan) => [plan.id, '0']));
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    startsAt: toDateTimeLocal(now),
    endsAt: toDateTimeLocal(weekLater),
    status: 'DRAFT',
    planPoints
  };
}

function formatPeriod(startsAt: string, endsAt: string, locale: 'ar' | 'en') {
  const formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  return `${formatter.format(new Date(startsAt))} — ${formatter.format(new Date(endsAt))}`;
}

export function AdminRafflesManagement() {
  const { locale, m } = useI18n();
  const [raffles, setRaffles] = useState<RaffleListItem[]>([]);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [detail, setDetail] = useState<RaffleDetail>();
  const [form, setForm] = useState<RaffleFormState>(() => defaultForm([]));
  const [editingId, setEditingId] = useState<string>();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RaffleListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [deleteError, setDeleteError] = useState<string>();
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [heroForm, setHeroForm] = useState<HeroPublishForm | null>(null);
  const [isHeroLoading, setIsHeroLoading] = useState(false);
  const [isHeroSaving, setIsHeroSaving] = useState(false);
  const [heroError, setHeroError] = useState<string>();

  const statusLabel = useMemo(
    () => ({
      DRAFT: m.admin.raffleStatusDraft,
      ACTIVE: m.admin.raffleStatusActive,
      ENDED: m.admin.raffleStatusEnded
    }),
    [m.admin.raffleStatusActive, m.admin.raffleStatusDraft, m.admin.raffleStatusEnded]
  );

  const loadPlans = async () => {
    const response = await adminApi().get<{ data: PromotionPlan[] }>('/promotions/plans', {
      params: { includeInactive: true }
    });
    setPlans(response.data.data);
    return response.data.data;
  };

  const loadRaffles = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await adminApi().get<{ data: RaffleListItem[] }>('/admin/raffles');
      setRaffles(response.data.data);
    } catch {
      setError(m.admin.rafflesLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const response = await adminApi().get<{ data: RaffleDetail }>(`/admin/raffles/${id}`);
      setDetail(response.data.data);
      setSelectedId(id);
    } catch {
      setError(m.admin.rafflesLoadError);
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans().then((loadedPlans) => {
      setForm(defaultForm(loadedPlans));
    });
    void loadRaffles();
  }, [m.admin.rafflesLoadError]);

  const openCreateModal = () => {
    setForm(defaultForm(plans));
    setEditingId(undefined);
    setFormError(undefined);
    setFormModalOpen(true);
  };

  const openEditModal = (raffle: RaffleDetail) => {
    setForm({
      titleAr: raffle.titleAr,
      titleEn: raffle.titleEn,
      descriptionAr: raffle.descriptionAr,
      descriptionEn: raffle.descriptionEn,
      startsAt: toDateTimeLocal(raffle.startsAt),
      endsAt: toDateTimeLocal(raffle.endsAt),
      status: raffle.status,
      planPoints: Object.fromEntries(
        plans.map((plan) => [
          plan.id,
          String(raffle.planPoints.find((item) => item.planId === plan.id)?.points ?? 0)
        ])
      )
    });
    setEditingId(raffle.id);
    setFormError(undefined);
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    setForm(defaultForm(plans));
    setEditingId(undefined);
    setFormError(undefined);
    setFormModalOpen(false);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);

    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);
    if (endsAt.getTime() <= startsAt.getTime()) {
      setFormError(m.admin.rafflePeriodError);
      return;
    }

    const payload = {
      titleAr: form.titleAr.trim(),
      titleEn: form.titleEn.trim(),
      descriptionAr: form.descriptionAr.trim(),
      descriptionEn: form.descriptionEn.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: form.status,
      planPoints: plans.map((plan) => ({
        planId: plan.id,
        points: Math.max(0, Number.parseInt(form.planPoints[plan.id] ?? '0', 10) || 0)
      }))
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await adminApi().patch(`/admin/raffles/${editingId}`, payload);
      } else {
        await adminApi().post('/admin/raffles', payload);
      }
      closeFormModal();
      await loadRaffles();
      if (selectedId) await loadDetail(selectedId);
    } catch {
      setFormError(m.admin.raffleSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const activateRaffle = async (id: string) => {
    if (!window.confirm(m.admin.raffleActivateConfirm)) return;
    try {
      await adminApi().post(`/admin/raffles/${id}/activate`);
      await loadRaffles();
      await loadDetail(id);
    } catch {
      setError(m.admin.raffleSaveError);
    }
  };

  const endRaffle = async (id: string) => {
    if (!window.confirm(m.admin.raffleEndConfirm)) return;
    try {
      await adminApi().post(`/admin/raffles/${id}/end`);
      await loadRaffles();
      await loadDetail(id);
    } catch {
      setError(m.admin.raffleSaveError);
    }
  };

  const deleteRaffle = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await adminApi().delete(`/admin/raffles/${deleteTarget.id}`);
      setDeleteTarget(null);
      if (selectedId === deleteTarget.id) {
        setSelectedId(undefined);
        setDetail(undefined);
      }
      await loadRaffles();
    } catch {
      setDeleteError(m.admin.rafflesDeleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const openHeroModal = async (raffleId: string) => {
    setHeroModalOpen(true);
    setIsHeroLoading(true);
    setHeroError(undefined);
    try {
      const response = await adminApi().get<{ data: HeroPublishForm & { imageUrl: string } }>(
        `/admin/raffles/${raffleId}/hero-preview`
      );
      const preview = response.data.data;
      setHeroForm({
        imageUrl: preview.imageUrl ?? '',
        platform: preview.platform ?? 'ALL',
        titleAr: preview.titleAr,
        titleEn: preview.titleEn,
        subtitleAr: preview.subtitleAr,
        subtitleEn: preview.subtitleEn,
        buttonLabelAr: preview.buttonLabelAr,
        buttonLabelEn: preview.buttonLabelEn,
        buttonLink: preview.buttonLink ?? '/raffle'
      });
    } catch {
      setHeroError(m.admin.raffleHeroLoadError);
      setHeroForm(null);
    } finally {
      setIsHeroLoading(false);
    }
  };

  const closeHeroModal = () => {
    setHeroModalOpen(false);
    setHeroForm(null);
    setHeroError(undefined);
  };

  const publishToHero = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !heroForm) return;
    if (!heroForm.imageUrl) {
      setHeroError(m.admin.raffleHeroImageRequired);
      return;
    }

    setIsHeroSaving(true);
    setHeroError(undefined);
    try {
      await adminApi().post(`/admin/raffles/${selectedId}/publish-to-hero`, heroForm);
      closeHeroModal();
      await loadRaffles();
      await loadDetail(selectedId);
    } catch {
      setHeroError(m.admin.raffleHeroPublishError);
    } finally {
      setIsHeroSaving(false);
    }
  };

  const unpublishFromHero = async () => {
    if (!selectedId || !detail?.hero.published) return;
    if (!window.confirm(m.admin.raffleHeroUnpublishConfirm)) return;

    try {
      await adminApi().post(`/admin/raffles/${selectedId}/unpublish-from-hero`);
      await loadRaffles();
      await loadDetail(selectedId);
    } catch {
      setError(m.admin.raffleHeroPublishError);
    }
  };

  const displayTitle = (item: Pick<RaffleListItem, 'titleAr' | 'titleEn'>) =>
    locale === 'ar' ? item.titleAr : item.titleEn;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{m.admin.rafflesManagement}</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700"
        >
          <Plus className="h-5 w-5" />
          {m.admin.createRaffle}
        </button>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          {isLoading ? (
            <AdminTableSkeleton
              columnTypes={['text', 'text', 'badge', 'short', 'actions']}
              rows={4}
            />
          ) : raffles.length === 0 ? (
            <p className="py-8 text-center text-slate-500">{m.admin.rafflesEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-start">{m.admin.raffleTitleAr}</th>
                    <th className="px-4 py-3 text-start">{m.admin.rafflePeriod}</th>
                    <th className="px-4 py-3 text-start">{m.admin.raffleStatus}</th>
                    <th className="px-4 py-3 text-start">{m.admin.raffleParticipants}</th>
                    <th className="px-4 py-3 text-start">{m.admin.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {raffles.map((raffle) => (
                    <tr key={raffle.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">{displayTitle(raffle)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatPeriod(raffle.startsAt, raffle.endsAt, locale)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            raffle.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : raffle.status === 'ENDED'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {statusLabel[raffle.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">{raffle.participantsCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => loadDetail(raffle.id)}
                            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                            title={m.admin.raffleViewDetails}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {raffle.status !== 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => activateRaffle(raffle.id)}
                              className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50"
                              title={m.admin.raffleActivate}
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => endRaffle(raffle.id)}
                              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                              title={m.admin.raffleEnd}
                            >
                              <Square className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(raffle)}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            title={m.admin.deleteRaffle}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          {!selectedId ? (
            <p className="py-16 text-center text-slate-500">{m.admin.raffleViewDetails}</p>
          ) : isDetailLoading || !detail ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{displayTitle(detail)}</h2>
                  <p className="mt-1 text-sm text-slate-500">{formatPeriod(detail.startsAt, detail.endsAt, locale)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!detail.isEnded ? (
                    <button
                      type="button"
                      onClick={() => openHeroModal(detail.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
                    >
                      <Megaphone className="h-4 w-4" />
                      {detail.hero.published ? m.admin.raffleHeroUpdate : m.admin.raffleHeroPublish}
                    </button>
                  ) : null}
                  {detail.hero.published && detail.hero.isActive ? (
                    <button
                      type="button"
                      onClick={unpublishFromHero}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50"
                    >
                      {m.admin.raffleHeroUnpublish}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEditModal(detail)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    {m.admin.editRaffle}
                  </button>
                </div>
              </div>

              {detail.hero.published ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                    detail.hero.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {detail.hero.isActive ? m.admin.raffleHeroPublishedActive : m.admin.raffleHeroPublishedInactive}
                </div>
              ) : null}

              <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-brand-800">
                  <Trophy className="h-5 w-5" />
                  {m.admin.raffleAnnouncement}
                </h3>
                <p className="whitespace-pre-wrap text-slate-700">
                  {locale === 'ar' ? detail.descriptionAr : detail.descriptionEn}
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-bold text-slate-900">{m.admin.rafflePlanPoints}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {detail.planPoints.map((item) => (
                    <div key={item.planId} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {locale === 'ar' ? item.plan.nameAr : item.plan.nameEn}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {m.admin.rafflePoints}: <span className="font-bold text-brand-700">{item.points}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {detail.isEnded && detail.winner ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-800">
                    <Crown className="h-5 w-5" />
                    {m.admin.raffleWinner}
                  </h3>
                  <p className="text-xl font-black text-slate-900">{detail.winner.fullName}</p>
                  <p className="text-sm text-slate-600">{detail.winner.email}</p>
                  <p className="mt-2 font-bold text-brand-700">
                    {detail.winner.totalPoints} {m.admin.rafflePoints}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{m.admin.raffleWinnerHint}</p>
                </section>
              ) : null}

              <section>
                <h3 className="mb-3 text-lg font-bold text-slate-900">{m.admin.raffleParticipants}</h3>
                {detail.participants.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-slate-500">
                    {m.admin.raffleParticipantsEmpty}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-start">{m.admin.raffleParticipantRank}</th>
                          <th className="px-4 py-3 text-start">{m.admin.raffleParticipantName}</th>
                          <th className="px-4 py-3 text-start">{m.admin.raffleParticipantEmail}</th>
                          <th className="px-4 py-3 text-start">{m.admin.raffleParticipantPoints}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.participants.map((participant) => (
                          <tr
                            key={participant.userId}
                            className={`border-t border-slate-100 ${participant.isWinner ? 'bg-amber-50' : ''}`}
                          >
                            <td className="px-4 py-3 font-bold">{participant.rank}</td>
                            <td className="px-4 py-3 font-semibold">{participant.fullName}</td>
                            <td className="px-4 py-3 text-slate-600">{participant.email}</td>
                            <td className="px-4 py-3 font-bold text-brand-700">{participant.totalPoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {formModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">
                {editingId ? m.admin.updateRaffle : m.admin.createRaffle}
              </h2>
              <button type="button" onClick={closeFormModal} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={submitForm}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="font-semibold text-slate-700">{m.admin.raffleTitleAr}</span>
                  <input
                    className={inputClass}
                    value={form.titleAr}
                    onChange={(event) => setForm((current) => ({ ...current, titleAr: event.target.value }))}
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="font-semibold text-slate-700">{m.admin.raffleTitleEn}</span>
                  <input
                    className={inputClass}
                    value={form.titleEn}
                    onChange={(event) => setForm((current) => ({ ...current, titleEn: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="font-semibold text-slate-700">{m.admin.raffleDescriptionAr}</span>
                  <textarea
                    className={`${inputClass} min-h-28`}
                    value={form.descriptionAr}
                    onChange={(event) => setForm((current) => ({ ...current, descriptionAr: event.target.value }))}
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="font-semibold text-slate-700">{m.admin.raffleDescriptionEn}</span>
                  <textarea
                    className={`${inputClass} min-h-28`}
                    value={form.descriptionEn}
                    onChange={(event) => setForm((current) => ({ ...current, descriptionEn: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="font-semibold text-slate-700">{m.admin.raffleStartsAt}</span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.startsAt}
                    onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="font-semibold text-slate-700">{m.admin.raffleEndsAt}</span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.endsAt}
                    onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="font-semibold text-slate-700">{m.admin.raffleStatus}</span>
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value as RaffleStatus }))
                    }
                  >
                    <option value="DRAFT">{m.admin.raffleStatusDraft}</option>
                    <option value="ACTIVE">{m.admin.raffleStatusActive}</option>
                    <option value="ENDED">{m.admin.raffleStatusEnded}</option>
                  </select>
                </label>
              </div>

              <div>
                <h3 className="mb-3 font-bold text-slate-900">{m.admin.rafflePlanPoints}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {plans.map((plan) => (
                    <label key={plan.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <span className="block font-semibold text-slate-800">
                        {locale === 'ar' ? plan.nameAr : plan.nameEn}
                      </span>
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} mt-2`}
                        value={form.planPoints[plan.id] ?? '0'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            planPoints: { ...current.planPoints, [plan.id]: event.target.value }
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              {formError ? <p className="text-red-600">{formError}</p> : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-200 px-5 py-3 font-bold">
                  {m.admin.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {isSaving ? m.admin.saving : editingId ? m.admin.updateRaffle : m.admin.createRaffle}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black text-slate-900">{m.admin.rafflesDeleteTitle}</h3>
            <p className="mt-3 text-slate-600">{m.admin.rafflesDeleteConfirm}</p>
            {deleteError ? <p className="mt-3 text-red-600">{deleteError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 font-bold"
              >
                {m.admin.cancel}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={deleteRaffle}
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? m.admin.saving : m.admin.deleteRaffle}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {heroModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">{m.admin.raffleHeroPublishTitle}</h2>
              <button type="button" onClick={closeHeroModal} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isHeroLoading || !heroForm ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <form className="space-y-4" onSubmit={publishToHero}>
                <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">{m.admin.raffleHeroPublishHint}</p>

                <ImageUploader
                  folder="hero"
                  useAdminAuth
                  value={heroForm.imageUrl}
                  onChange={(value) => setHeroForm((current) => (current ? { ...current, imageUrl: value } : current))}
                  labels={{
                    title: m.admin.raffleHeroImage,
                    hint: m.admin.raffleHeroImageHint,
                    remove: m.admin.removeImage
                  }}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="font-semibold text-slate-700">{m.admin.raffleTitleAr}</span>
                    <input
                      className={inputClass}
                      value={heroForm.titleAr}
                      onChange={(event) => setHeroForm((current) => (current ? { ...current, titleAr: event.target.value } : current))}
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="font-semibold text-slate-700">{m.admin.raffleTitleEn}</span>
                    <input
                      className={inputClass}
                      value={heroForm.titleEn}
                      onChange={(event) => setHeroForm((current) => (current ? { ...current, titleEn: event.target.value } : current))}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="font-semibold text-slate-700">{m.admin.raffleHeroSubtitleAr}</span>
                    <textarea
                      className={`${inputClass} min-h-28`}
                      value={heroForm.subtitleAr}
                      onChange={(event) => setHeroForm((current) => (current ? { ...current, subtitleAr: event.target.value } : current))}
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="font-semibold text-slate-700">{m.admin.raffleHeroSubtitleEn}</span>
                    <textarea
                      className={`${inputClass} min-h-28`}
                      value={heroForm.subtitleEn}
                      onChange={(event) => setHeroForm((current) => (current ? { ...current, subtitleEn: event.target.value } : current))}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block space-y-2">
                    <span className="font-semibold text-slate-700">{m.admin.raffleHeroButtonAr}</span>
                    <input
                      className={inputClass}
                      value={heroForm.buttonLabelAr}
                      onChange={(event) =>
                        setHeroForm((current) => (current ? { ...current, buttonLabelAr: event.target.value } : current))
                      }
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="font-semibold text-slate-700">{m.admin.raffleHeroButtonEn}</span>
                    <input
                      className={inputClass}
                      value={heroForm.buttonLabelEn}
                      onChange={(event) =>
                        setHeroForm((current) => (current ? { ...current, buttonLabelEn: event.target.value } : current))
                      }
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="font-semibold text-slate-700">{m.admin.raffleHeroPlatform}</span>
                    <select
                      className={inputClass}
                      value={heroForm.platform}
                      onChange={(event) =>
                        setHeroForm((current) =>
                          current ? { ...current, platform: event.target.value as HeroPublishForm['platform'] } : current
                        )
                      }
                    >
                      <option value="ALL">{m.admin.raffleHeroPlatformAll}</option>
                      <option value="WEB">{m.admin.raffleHeroPlatformWeb}</option>
                      <option value="MOBILE">{m.admin.raffleHeroPlatformMobile}</option>
                    </select>
                  </label>
                </div>

                {heroError ? <p className="text-red-600">{heroError}</p> : null}

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button type="button" onClick={closeHeroModal} className="rounded-xl border border-slate-200 px-5 py-3 font-bold">
                    {m.admin.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isHeroSaving}
                    className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {isHeroSaving ? m.admin.saving : m.admin.raffleHeroPublishAction}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
