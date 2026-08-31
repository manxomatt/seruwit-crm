import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import ScoringNav from '../../../../ScoringNav';

interface Rule {
    id: number;
    name: string;
    period: string;
    min_score: number;
    min_days: number;
    reward_amount: string | number;
    reward_label: string | null;
    is_active: boolean;
    notes?: string | null;
    awards_count?: number;
}

interface Award {
    id: number;
    average_score: string | number;
    scored_days: number;
    reward_amount: string | number;
    status: string;
    period_start: string;
    period_end: string;
    awarded_at?: string;
    driver: {
        id: number;
        name: string;
        phone?: string | null;
        status?: string | null;
    } | null;
    rule: {
        id: number;
        name: string;
        period?: string;
        reward_amount?: string | number;
        reward_label?: string | null;
    } | null;
}

interface Props {
    rules: Rule[];
    awards: Award[];
    can: { create: boolean; update: boolean; delete: boolean; award: boolean };
}

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const BanknotesIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
        />
    </svg>
);

const XMarkIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SparklesIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50';

function formatRupiah(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

function formatShortDate(dateStr?: string, locale = 'id-ID'): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    } catch {
        return dateStr;
    }
}

function getScoreBadgeInfo(scoreNum: number) {
    if (scoreNum >= 90) {
        return {
            label: 'Sangat Baik',
            textColor: 'text-emerald-700 dark:text-emerald-400',
            bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
            barColor: 'bg-emerald-500',
        };
    }
    if (scoreNum >= 75) {
        return {
            label: 'Baik',
            textColor: 'text-indigo-700 dark:text-indigo-400',
            bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
            barColor: 'bg-indigo-500',
        };
    }
    if (scoreNum >= 60) {
        return {
            label: 'Cukup',
            textColor: 'text-amber-700 dark:text-amber-400',
            bgBadge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
            barColor: 'bg-amber-500',
        };
    }
    return {
        label: 'Perlu Evaluasi',
        textColor: 'text-rose-700 dark:text-rose-400',
        bgBadge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
        barColor: 'bg-rose-500',
    };
}

function getAwardStatusBadge(status: string) {
    switch (status) {
        case 'approved':
            return {
                label: 'Disetujui',
                className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                dot: 'bg-emerald-500',
            };
        case 'paid':
            return {
                label: 'Sudah Cair',
                className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
                dot: 'bg-sky-500',
            };
        case 'rejected':
            return {
                label: 'Ditolak',
                className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                dot: 'bg-rose-500',
            };
        default:
            return {
                label: 'Menunggu Approval',
                className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                dot: 'bg-amber-500 animate-pulse',
            };
    }
}

export default function Index({ rules, awards, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    // Active main tab: 'awards' | 'rules'
    const [activeTab, setActiveTab] = useState<'awards' | 'rules'>('awards');

    // Awards filtering & view
    const [awardStatusFilter, setAwardStatusFilter] = useState<string>('all');
    const [awardPeriodFilter, setAwardPeriodFilter] = useState<string>('all');
    const [awardSearch, setAwardSearch] = useState<string>('');
    const [awardViewMode, setAwardViewMode] = useState<'table' | 'grid'>('table');

    // Modals
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [deletingRule, setDeletingRule] = useState<Rule | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const [showEvaluateModal, setShowEvaluateModal] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    // Rule Form
    const ruleForm = useForm({
        name: '',
        period: 'weekly',
        min_score: '85',
        min_days: '5',
        reward_amount: '250000',
        reward_label: 'Bonus aman berkendara',
        is_active: true,
        notes: '',
    });

    const openCreateRule = () => {
        setEditingRule(null);
        ruleForm.setData({
            name: '',
            period: 'weekly',
            min_score: '85',
            min_days: '5',
            reward_amount: '250000',
            reward_label: 'Bonus aman berkendara',
            is_active: true,
            notes: '',
        });
        ruleForm.clearErrors();
        setShowRuleModal(true);
    };

    const openEditRule = (rule: Rule) => {
        setEditingRule(rule);
        ruleForm.setData({
            name: rule.name,
            period: rule.period,
            min_score: String(rule.min_score),
            min_days: String(rule.min_days),
            reward_amount: String(rule.reward_amount),
            reward_label: rule.reward_label || '',
            is_active: rule.is_active,
            notes: rule.notes || '',
        });
        ruleForm.clearErrors();
        setShowRuleModal(true);
    };

    const closeRuleModal = () => {
        setShowRuleModal(false);
        setEditingRule(null);
        ruleForm.reset();
    };

    const submitRule: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingRule) {
            ruleForm.patch(prefixedRoute('scoring.incentives.update', editingRule.id), {
                onSuccess: () => closeRuleModal(),
            });
        } else {
            ruleForm.post(prefixedRoute('scoring.incentives.store'), {
                onSuccess: () => closeRuleModal(),
            });
        }
    };

    const toggleRuleActive = (rule: Rule) => {
        router.patch(
            prefixedRoute('scoring.incentives.update', rule.id),
            { is_active: !rule.is_active },
            { preserveScroll: true }
        );
    };

    const confirmDeleteRule = (): void => {
        if (!deletingRule) return;

        setProcessingDelete(true);
        router.delete(prefixedRoute('scoring.incentives.destroy', deletingRule.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingRule(null),
            onFinish: () => setProcessingDelete(false),
        });
    };

    const updateAwardStatus = (awardId: number, status: string): void => {
        router.post(prefixedRoute('scoring.awards.status', awardId), { status }, { preserveScroll: true });
    };

    const triggerEvaluate = () => {
        setEvaluating(true);
        router.post(
            prefixedRoute('scoring.incentives.evaluate'),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setEvaluating(false);
                    setShowEvaluateModal(false);
                },
            }
        );
    };

    // Summary KPIs
    const kpi = useMemo(() => {
        const totalPaidAwards = awards.filter((a) => a.status === 'paid');
        const totalPendingAwards = awards.filter((a) => a.status === 'pending');
        const totalApprovedAwards = awards.filter((a) => a.status === 'approved');

        const totalPaidAmount = totalPaidAwards.reduce((sum, a) => sum + Number(a.reward_amount || 0), 0);
        const totalPendingAmount = totalPendingAwards.reduce((sum, a) => sum + Number(a.reward_amount || 0), 0);
        const totalApprovedAmount = totalApprovedAwards.reduce((sum, a) => sum + Number(a.reward_amount || 0), 0);

        const activeRulesCount = rules.filter((r) => r.is_active).length;

        return {
            paidCount: totalPaidAwards.length,
            paidAmount: totalPaidAmount,
            pendingCount: totalPendingAwards.length,
            pendingAmount: totalPendingAmount,
            approvedCount: totalApprovedAwards.length,
            approvedAmount: totalApprovedAmount,
            activeRulesCount,
            totalRulesCount: rules.length,
        };
    }, [awards, rules]);

    // Filtered Awards
    const filteredAwards = useMemo(() => {
        return awards.filter((award) => {
            // Status filter
            if (awardStatusFilter !== 'all' && award.status !== awardStatusFilter) {
                return false;
            }

            // Period filter
            if (awardPeriodFilter !== 'all' && award.rule?.period !== awardPeriodFilter) {
                return false;
            }

            // Search query
            if (awardSearch.trim()) {
                const q = awardSearch.toLowerCase();
                const driverName = award.driver?.name?.toLowerCase() || '';
                const ruleName = award.rule?.name?.toLowerCase() || '';
                if (!driverName.includes(q) && !ruleName.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [awards, awardStatusFilter, awardPeriodFilter, awardSearch]);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Insentif & Reward Driver"
                    subtitle="Kelola program reward keselamatan berkendara, evaluasi otomatis performa pengemudi, dan monitoring pencairan insentif."
                />
            }
        >
            <Head title="Manajemen Insentif Driver" />

            <ScoringNav />

            <div className="space-y-6">
                {/* Top Action Bar & Header Card */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <span>✨</span>
                            <span>Sistem Reward Berbasis Telemetri Traccar</span>
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {can.award && (
                            <button
                                type="button"
                                onClick={() => setShowEvaluateModal(true)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-black text-indigo-700 shadow-2xs transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
                            >
                                <SparklesIcon />
                                <span>Evaluasi Insentif Periode</span>
                            </button>
                        )}

                        {can.create && (
                            <button
                                type="button"
                                onClick={openCreateRule}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700 active:scale-95"
                            >
                                <span>+ Buat Aturan Baru</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Paid KPI */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Cair (Paid)</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                💵
                            </span>
                        </div>
                        <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                            {formatRupiah(kpi.paidAmount)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {kpi.paidCount} klaim telah ditransfer ke pengemudi
                        </p>
                    </div>

                    {/* Pending Approval KPI */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Menunggu Approval</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                ⏳
                            </span>
                        </div>
                        <p className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400">
                            {formatRupiah(kpi.pendingAmount)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {kpi.pendingCount} penghargaan perlu verifikasi
                        </p>
                    </div>

                    {/* Approved KPI */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Disetujui (Siap Cair)</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                                ✅
                            </span>
                        </div>
                        <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                            {formatRupiah(kpi.approvedAmount)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {kpi.approvedCount} reward siap diproses payout
                        </p>
                    </div>

                    {/* Active Rules KPI */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Aturan Reward Aktif</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                ⚙️
                            </span>
                        </div>
                        <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                            {kpi.activeRulesCount}{' '}
                            <span className="text-xs font-semibold text-slate-400">/ {kpi.totalRulesCount} Aturan</span>
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Kriteria otomatis mingguan & bulanan
                        </p>
                    </div>
                </div>

                {/* Primary Navigation Tabs */}
                <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('awards')}
                        className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-black transition-all ${
                            activeTab === 'awards'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>🏆</span>
                        <span>Distribusi & Klaim Insentif</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {awards.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('rules')}
                        className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-black transition-all ${
                            activeTab === 'rules'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>⚙️</span>
                        <span>Konfigurasi Aturan Reward</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {rules.length}
                        </span>
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: DISTRIBUSI & KLAIM INSENTIF (AWARDS) */}
                {/* ========================================================================= */}
                {activeTab === 'awards' && (
                    <div className="space-y-4">
                        {/* Filter Toolbar */}
                        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
                            {/* Left: Search & Filter Tabs */}
                            <div className="flex flex-1 flex-wrap items-center gap-2.5">
                                {/* Search Bar */}
                                <div className="relative min-w-[200px] flex-1 max-w-sm">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                        🔍
                                    </span>
                                    <input
                                        type="text"
                                        value={awardSearch}
                                        onChange={(e) => setAwardSearch(e.target.value)}
                                        placeholder="Cari driver atau aturan insentif..."
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                    />
                                    {awardSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setAwardSearch('')}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400 hover:text-slate-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Status Filter Pills */}
                                <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                                    {[
                                        { key: 'all', label: 'Semua' },
                                        { key: 'pending', label: 'Pending' },
                                        { key: 'approved', label: 'Disetujui' },
                                        { key: 'paid', label: 'Sudah Cair' },
                                        { key: 'rejected', label: 'Ditolak' },
                                    ].map((st) => (
                                        <button
                                            key={st.key}
                                            type="button"
                                            onClick={() => setAwardStatusFilter(st.key)}
                                            className={`rounded-xl px-3 py-1 text-xs font-black transition whitespace-nowrap ${
                                                awardStatusFilter === st.key
                                                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                        >
                                            {st.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Period Dropdown Filter */}
                                <select
                                    value={awardPeriodFilter}
                                    onChange={(e) => setAwardPeriodFilter(e.target.value)}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <option value="all">Semua Periode</option>
                                    <option value="weekly">Mingguan</option>
                                    <option value="monthly">Bulanan</option>
                                </select>
                            </div>

                            {/* Right: View Mode Switcher */}
                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setAwardViewMode('table')}
                                    title="Tampilan Tabel Rinci"
                                    className={`rounded-lg p-1.5 transition ${
                                        awardViewMode === 'table'
                                            ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-400'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAwardViewMode('grid')}
                                    title="Tampilan Grid Kartu"
                                    className={`rounded-lg p-1.5 transition ${
                                        awardViewMode === 'grid'
                                            ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-400'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM14 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM4 16a2.25 2.25 0 012.25-2.25H6a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2zM14 16a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content: Empty / Grid / Table */}
                        {filteredAwards.length === 0 ? (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <span className="mb-3 block text-4xl">🏆</span>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {awards.length === 0 ? 'Belum Ada Penghargaan Insentif' : 'Tidak Ditemukan Data yang Sesuai'}
                                </h3>
                                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                                    {awards.length === 0
                                        ? 'Klik tombol "Evaluasi Insentif Periode" untuk menghitung otomatis pengemudi yang memenuhi target skor keselamatan berkendara.'
                                        : 'Coba sesuaikan kata kunci pencarian atau ganti filter status di atas.'}
                                </p>
                                {can.award && awards.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowEvaluateModal(true)}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                                    >
                                        <SparklesIcon />
                                        <span>Jalankan Evaluasi Insentif</span>
                                    </button>
                                )}
                            </div>
                        ) : awardViewMode === 'table' ? (
                            /* Table View */
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800">
                                        <thead>
                                            <tr className="bg-slate-50/80 dark:bg-slate-850/80">
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Pengemudi (Driver)
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Program Aturan & Periode
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Performa Skor
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Nominal Reward
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Status Klaim
                                                </th>
                                                <th className="w-32 px-4 py-3.5 text-right font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                                            {filteredAwards.map((award) => {
                                                const scoreVal = Number(award.average_score || 0);
                                                const scoreInfo = getScoreBadgeInfo(scoreVal);
                                                const statusInfo = getAwardStatusBadge(award.status);

                                                return (
                                                    <tr
                                                        key={award.id}
                                                        className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50"
                                                    >
                                                        {/* Driver Column */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                                    {award.driver?.name
                                                                        ? award.driver.name
                                                                              .split(' ')
                                                                              .map((n) => n[0])
                                                                              .slice(0, 2)
                                                                              .join('')
                                                                              .toUpperCase()
                                                                        : 'DR'}
                                                                </div>
                                                                <div>
                                                                    {award.driver ? (
                                                                        <Link
                                                                            href={prefixedRoute('scoring.drivers.show', award.driver.id)}
                                                                            className="font-black text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                                        >
                                                                            {award.driver.name}
                                                                        </Link>
                                                                    ) : (
                                                                        <span className="text-slate-400">Driver Tidak Dikenal</span>
                                                                    )}
                                                                    {award.driver?.phone && (
                                                                        <p className="font-mono text-[11px] text-slate-400">
                                                                            {award.driver.phone}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Rule & Period Column */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-black text-slate-900 dark:text-white">
                                                                        {award.rule?.name || 'Aturan Insentif'}
                                                                    </span>
                                                                    <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                        {award.rule?.period === 'monthly' ? 'Bulanan' : 'Mingguan'}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-0.5 text-[11px] text-slate-400">
                                                                    📅 {formatShortDate(award.period_start, localeTag)} – {formatShortDate(award.period_end, localeTag)}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        {/* Score Performance Column */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                                                                            {scoreVal.toFixed(1)}
                                                                        </span>
                                                                        <span
                                                                            className={`inline-flex items-center rounded-lg border px-1.5 py-0.2 text-[10px] font-bold ${scoreInfo.bgBadge}`}
                                                                        >
                                                                            {scoreInfo.label}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                                        🏁 {award.scored_days} Hari Aktif
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Reward Amount Column */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <div>
                                                                <p className="font-mono text-sm font-black text-slate-900 dark:text-white">
                                                                    {formatRupiah(award.reward_amount)}
                                                                </p>
                                                                {award.rule?.reward_label && (
                                                                    <p className="text-[11px] text-slate-400">
                                                                        {award.rule.reward_label}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Status Column */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-black ${statusInfo.className}`}
                                                            >
                                                                <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                                                                <span>{statusInfo.label}</span>
                                                            </span>
                                                        </td>

                                                        {/* Action Column */}
                                                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                            {can.award ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {award.status === 'pending' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateAwardStatus(award.id, 'approved')}
                                                                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700"
                                                                            title="Setujui Klaim Reward"
                                                                        >
                                                                            <CheckIcon />
                                                                            <span>Approve</span>
                                                                        </button>
                                                                    )}

                                                                    {award.status === 'approved' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateAwardStatus(award.id, 'paid')}
                                                                            className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-sky-700"
                                                                            title="Tandai Sudah Ditransfer/Cair"
                                                                        >
                                                                            <BanknotesIcon />
                                                                            <span>Bayar</span>
                                                                        </button>
                                                                    )}

                                                                    <Menu as="div" className="relative inline-block text-left">
                                                                        <MenuButton
                                                                            className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                            title="Opsi Status Lainnya"
                                                                        >
                                                                            <EllipsisVerticalIcon />
                                                                        </MenuButton>

                                                                        <MenuItems
                                                                            anchor="bottom end"
                                                                            className="z-30 w-48 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                                                                        >
                                                                            {award.driver && (
                                                                                <MenuItem>
                                                                                    <Link
                                                                                        href={prefixedRoute('scoring.drivers.show', award.driver.id)}
                                                                                        className={menuItemClassName}
                                                                                    >
                                                                                        <EyeIcon />
                                                                                        <span>Lihat Profil Driver</span>
                                                                                    </Link>
                                                                                </MenuItem>
                                                                            )}

                                                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                                                            {award.status !== 'approved' && (
                                                                                <MenuItem>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => updateAwardStatus(award.id, 'approved')}
                                                                                        className={menuItemClassName}
                                                                                    >
                                                                                        <CheckIcon />
                                                                                        <span>Setujui (Approve)</span>
                                                                                    </button>
                                                                                </MenuItem>
                                                                            )}

                                                                            {award.status !== 'paid' && (
                                                                                <MenuItem>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => updateAwardStatus(award.id, 'paid')}
                                                                                        className={menuItemClassName}
                                                                                    >
                                                                                        <BanknotesIcon />
                                                                                        <span>Tandai Cair (Paid)</span>
                                                                                    </button>
                                                                                </MenuItem>
                                                                            )}

                                                                            {award.status !== 'pending' && (
                                                                                <MenuItem>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => updateAwardStatus(award.id, 'pending')}
                                                                                        className={menuItemClassName}
                                                                                    >
                                                                                        <span>⏳</span>
                                                                                        <span>Kembalikan ke Pending</span>
                                                                                    </button>
                                                                                </MenuItem>
                                                                            )}

                                                                            {award.status !== 'rejected' && (
                                                                                <>
                                                                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                                    <MenuItem>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => updateAwardStatus(award.id, 'rejected')}
                                                                                            className={menuItemDangerClassName}
                                                                                        >
                                                                                            <XMarkIcon />
                                                                                            <span>Tolak Klaim (Reject)</span>
                                                                                        </button>
                                                                                    </MenuItem>
                                                                                </>
                                                                            )}
                                                                        </MenuItems>
                                                                    </Menu>
                                                                </div>
                                                            ) : award.driver ? (
                                                                <Link
                                                                    href={prefixedRoute('scoring.drivers.show', award.driver.id)}
                                                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                                >
                                                                    <EyeIcon />
                                                                    <span>Detail</span>
                                                                </Link>
                                                            ) : null}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* Grid Card View */
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredAwards.map((award) => {
                                    const scoreVal = Number(award.average_score || 0);
                                    const scoreInfo = getScoreBadgeInfo(scoreVal);
                                    const statusInfo = getAwardStatusBadge(award.status);

                                    return (
                                        <div
                                            key={award.id}
                                            className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            <div>
                                                {/* Header: Driver Info + Status */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                            {award.driver?.name
                                                                ? award.driver.name
                                                                      .split(' ')
                                                                      .map((n) => n[0])
                                                                      .slice(0, 2)
                                                                      .join('')
                                                                      .toUpperCase()
                                                                : 'DR'}
                                                        </div>
                                                        <div>
                                                            {award.driver ? (
                                                                <Link
                                                                    href={prefixedRoute('scoring.drivers.show', award.driver.id)}
                                                                    className="font-black text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                                >
                                                                    {award.driver.name}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">Driver</span>
                                                            )}
                                                            <p className="text-[10px] text-slate-400">
                                                                {award.rule?.name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-xl border px-2 py-0.5 text-[10px] font-black ${statusInfo.className}`}
                                                    >
                                                        <span className={`h-1 w-1 rounded-full ${statusInfo.dot}`} />
                                                        <span>{statusInfo.label}</span>
                                                    </span>
                                                </div>

                                                {/* Score & Active Days */}
                                                <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-850">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-400">Skor Rata-rata:</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                                                                {scoreVal.toFixed(1)}
                                                            </span>
                                                            <span
                                                                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${scoreInfo.bgBadge}`}
                                                            >
                                                                {scoreInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between text-xs">
                                                        <span className="text-slate-400">Hari Aktif:</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                            {award.scored_days} Hari
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Reward Nominal */}
                                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                                            Nominal Reward
                                                        </span>
                                                        <p className="font-mono text-sm font-black text-slate-900 dark:text-white">
                                                            {formatRupiah(award.reward_amount)}
                                                        </p>
                                                    </div>

                                                    <span className="text-[11px] text-slate-400">
                                                        {formatShortDate(award.period_start, localeTag)} – {formatShortDate(award.period_end, localeTag)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Footer Actions */}
                                            {can.award && (
                                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                                    {award.driver ? (
                                                        <Link
                                                            href={prefixedRoute('scoring.drivers.show', award.driver.id)}
                                                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                        >
                                                            Detail Driver →
                                                        </Link>
                                                    ) : <span />}

                                                    <div className="flex items-center gap-1">
                                                        {award.status === 'pending' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateAwardStatus(award.id, 'approved')}
                                                                className="rounded-xl bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                                title="Setujui Klaim"
                                                            >
                                                                <CheckIcon />
                                                            </button>
                                                        )}
                                                        {award.status === 'approved' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateAwardStatus(award.id, 'paid')}
                                                                className="rounded-xl bg-sky-50 p-1.5 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-400"
                                                                title="Tandai Sudah Cair"
                                                            >
                                                                <BanknotesIcon />
                                                            </button>
                                                        )}
                                                        {award.status !== 'rejected' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateAwardStatus(award.id, 'rejected')}
                                                                className="rounded-xl bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                                                                title="Tolak Klaim"
                                                            >
                                                                <XMarkIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: KONFIGURASI ATURAN INSENTIF (RULES) */}
                {/* ========================================================================= */}
                {activeTab === 'rules' && (
                    <div className="space-y-4">
                        {/* Rules Header Bar */}
                        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Daftar Aturan Reward Keselamatan
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Aturan yang berstatus <strong className="text-emerald-600">Aktif</strong> akan otomatis dievaluasi secara berkala berdasarkan data telemetri.
                                </p>
                            </div>

                            {can.create && (
                                <button
                                    type="button"
                                    onClick={openCreateRule}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                                >
                                    <span>+ Buat Aturan Baru</span>
                                </button>
                            )}
                        </div>

                        {/* Rules Grid Cards */}
                        {rules.length === 0 ? (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <span className="mb-3 block text-4xl">⚙️</span>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Belum Ada Aturan Insentif
                                </h3>
                                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                    Buat aturan pertama seperti bonus mingguan pengemudi teladan dengan batas minimal skor dan jumlah hari aktif.
                                </p>
                                {can.create && (
                                    <button
                                        type="button"
                                        onClick={openCreateRule}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                                    >
                                        <span>+ Buat Aturan Pertama</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {rules.map((rule) => {
                                    const minScoreInfo = getScoreBadgeInfo(rule.min_score);

                                    return (
                                        <div
                                            key={rule.id}
                                            className={`flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md dark:bg-slate-900 ${
                                                rule.is_active
                                                    ? 'border-slate-200/80 dark:border-slate-800'
                                                    : 'border-slate-200/60 bg-slate-50/50 opacity-75 dark:border-slate-800 dark:bg-slate-850'
                                            }`}
                                        >
                                            <div>
                                                {/* Header: Name + Period + Active Badge */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                            {rule.period === 'monthly' ? 'Bulanan' : 'Mingguan'}
                                                        </span>
                                                        <h4 className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                                                            {rule.name}
                                                        </h4>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => can.update && toggleRuleActive(rule)}
                                                        disabled={!can.update}
                                                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black transition ${
                                                            rule.is_active
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                        title="Klik untuk toggle status aktif"
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                rule.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                                            }`}
                                                        />
                                                        <span>{rule.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                    </button>
                                                </div>

                                                {/* Reward Nominal Highlight */}
                                                <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-850">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                                        Nominal Reward
                                                    </span>
                                                    <p className="font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
                                                        {formatRupiah(rule.reward_amount)}
                                                    </p>
                                                    {rule.reward_label && (
                                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                            🏷️ {rule.reward_label}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Criteria Details */}
                                                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400">Target Min. Skor:</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono font-black text-slate-900 dark:text-white">
                                                                ≥ {rule.min_score}
                                                            </span>
                                                            <span
                                                                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${minScoreInfo.bgBadge}`}
                                                            >
                                                                {minScoreInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400">Min. Hari Berkendara:</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            ≥ {rule.min_days} Hari Aktif
                                                        </span>
                                                    </div>

                                                    {rule.awards_count !== undefined && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-slate-400">Award Terbit:</span>
                                                            <span className="rounded-lg bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                                {rule.awards_count} Kali
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {rule.notes && (
                                                    <p className="mt-3 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 italic dark:bg-slate-800/60 dark:text-slate-400">
                                                        "{rule.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                {can.update && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditRule(rule)}
                                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                        title="Edit Aturan"
                                                    >
                                                        <PencilIcon />
                                                        <span>Edit</span>
                                                    </button>
                                                )}

                                                {can.delete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingRule(rule)}
                                                        className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                                        title="Hapus Aturan"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* MODALS */}
            {/* ========================================================================= */}

            {/* 1. Modal Create / Edit Rule */}
            <Modal show={showRuleModal} onClose={closeRuleModal} maxWidth="lg">
                <form onSubmit={submitRule} className="p-6 space-y-4">
                    <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {editingRule ? `Edit Aturan: ${editingRule.name}` : 'Tambah Aturan Insentif Baru'}
                        </h3>
                        <p className="text-xs text-slate-400">
                            Tentukan periode evaluasi, syarat skor minimal, dan nominal bonus yang akan diberikan.
                        </p>
                    </div>

                    <div>
                        <InputLabel value="Nama Program Insentif" />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            placeholder="Contoh: Bonus Mingguan Driver Teladan"
                            value={ruleForm.data.name}
                            onChange={(e) => ruleForm.setData('name', e.target.value)}
                            required
                        />
                        <InputError message={ruleForm.errors.name} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel value="Periode Evaluasi" />
                            <Select
                                className="mt-1"
                                value={ruleForm.data.period}
                                onChange={(value) => ruleForm.setData('period', value)}
                                options={[
                                    { value: 'weekly', label: '📅 Mingguan (Senin - Minggu)' },
                                    { value: 'monthly', label: '🗓️ Bulanan (1 Bulan Penuh)' },
                                ]}
                            />
                            <InputError message={ruleForm.errors.period} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Target Min. Rata-rata Skor (0 - 100)" />
                            <TextInput
                                type="number"
                                min={0}
                                max={100}
                                className="mt-1 block w-full"
                                value={ruleForm.data.min_score}
                                onChange={(e) => ruleForm.setData('min_score', e.target.value)}
                                required
                            />
                            <InputError message={ruleForm.errors.min_score} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Min. Hari Berkendara Aktif" />
                            <TextInput
                                type="number"
                                min={1}
                                max={31}
                                className="mt-1 block w-full"
                                value={ruleForm.data.min_days}
                                onChange={(e) => ruleForm.setData('min_days', e.target.value)}
                                required
                            />
                            <InputError message={ruleForm.errors.min_days} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Nominal Reward (Rp)" />
                            <TextInput
                                type="number"
                                min={0}
                                className="mt-1 block w-full"
                                value={ruleForm.data.reward_amount}
                                onChange={(e) => ruleForm.setData('reward_amount', e.target.value)}
                                required
                            />
                            <p className="mt-1 text-[11px] font-mono text-slate-500">
                                {formatRupiah(ruleForm.data.reward_amount || 0)}
                            </p>
                            <InputError message={ruleForm.errors.reward_amount} className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <InputLabel value="Label / Keterangan Singkat Reward" />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            placeholder="Contoh: Bonus Aman Berkendara"
                            value={ruleForm.data.reward_label}
                            onChange={(e) => ruleForm.setData('reward_label', e.target.value)}
                        />
                        <InputError message={ruleForm.errors.reward_label} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel value="Catatan Tambahan (Opsional)" />
                        <textarea
                            rows={2}
                            className="mt-1 block w-full rounded-2xl border-slate-300 text-xs shadow-xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="Keterangan internal atau syarat ketentuan tambahan..."
                            value={ruleForm.data.notes}
                            onChange={(e) => ruleForm.setData('notes', e.target.value)}
                        />
                        <InputError message={ruleForm.errors.notes} className="mt-1" />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="rule_is_active"
                            checked={ruleForm.data.is_active}
                            onChange={(e) => ruleForm.setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <label htmlFor="rule_is_active" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Aktifkan aturan ini sekarang (otomatis dievaluasi)
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={closeRuleModal}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={ruleForm.processing}>
                            {ruleForm.processing ? 'Menyimpan...' : editingRule ? 'Simpan Perubahan' : 'Buat Aturan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* 2. Modal Evaluate Confirmation */}
            <Modal show={showEvaluateModal} onClose={() => !evaluating && setShowEvaluateModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <SparklesIcon />
                    </div>

                    <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
                        Jalankan Evaluasi Insentif Periode Ini?
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Sistem akan mengagregasi data skor pengemudi untuk periode berjalan (minggu & bulan ini) dan mencocokkannya dengan semua <strong>Aturan Aktif</strong>. Jika pengemudi memenuhi syarat skor rata-rata dan minimal hari berkendara, klaim penghargaan baru berstatus <em>Pending</em> akan otomatis dibuat tanpa duplikasi.
                    </p>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton type="button" disabled={evaluating} onClick={() => setShowEvaluateModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="button" disabled={evaluating} onClick={triggerEvaluate}>
                            {evaluating ? 'Sedang Memproses...' : 'Mulai Evaluasi Sekarang'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* 3. Delete Rule Confirmation Dialog */}
            <ConfirmDeleteDialog
                show={!!deletingRule}
                onClose={() => !processingDelete && setDeletingRule(null)}
                onConfirm={confirmDeleteRule}
                processing={processingDelete}
                title={t('scoring.pages.incentives.delete_rule_title')}
                message={
                    deletingRule
                        ? t('scoring.pages.incentives.delete_rule_confirm', { name: deletingRule.name })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
