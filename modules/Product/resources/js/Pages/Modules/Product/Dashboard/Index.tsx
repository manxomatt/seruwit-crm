import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import ProductNav from '../../../../ProductNav';

interface RecentProduct {
    id: number;
    code: string;
    sku: string | null;
    name: string;
    status: string;
    category: string;
    price: number | null;
    brand: string | null;
    product_type: string | null;
    created_at: string | null;
}

interface BrandRow {
    id: number;
    name: string;
    total: number;
}

interface Board {
    counts: {
        total: number;
        active: number;
        inactive: number;
        favorites: number;
        variants: number;
        without_brand: number;
        without_price: number;
    };
    categories: {
        merchandise: number;
        fleet_sparepart: number;
        service: number;
    };
    masters: {
        brands_active: number;
        brands_total: number;
        principals_active: number;
        principals_total: number;
        product_types: number;
        tags: number;
        attributes: number;
    };
    recent: RecentProduct[];
    top_brands: BrandRow[];
}

interface Props {
    board: Board;
    can: { create: boolean };
}

type StatTone = 'emerald' | 'sky' | 'violet' | 'amber' | 'slate' | 'rose';

const STAT_TONES: Record<
    StatTone,
    { card: string; icon: string; value: string; bar: string; track: string; accent: string }
> = {
    emerald: {
        card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-900',
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-900',
        bar: 'bg-sky-500',
        track: 'bg-sky-100',
        accent: 'bg-sky-500',
    },
    violet: {
        card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50',
        icon: 'bg-violet-500 text-white shadow-violet-500/30',
        value: 'text-violet-900',
        bar: 'bg-violet-500',
        track: 'bg-violet-100',
        accent: 'bg-violet-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        bar: 'bg-amber-500',
        track: 'bg-amber-100',
        accent: 'bg-amber-500',
    },
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        bar: 'bg-slate-500',
        track: 'bg-slate-200',
        accent: 'bg-slate-500',
    },
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        bar: 'bg-rose-500',
        track: 'bg-rose-100',
        accent: 'bg-rose-500',
    },
};

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function IconBox(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            />
        </svg>
    );
}

function IconStar(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
        </svg>
    );
}

function IconLayers(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m-11.142 0l5.571 3 5.571-3m-11.142 0L2.25 16.5 12 21.75l9.75-5.25-4.179-2.25"
            />
        </svg>
    );
}

function IconTag(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
    );
}

function IconAlert(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
        </svg>
    );
}

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    progress,
    progressLabel,
    meta,
}: {
    label: string;
    value: number | string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    progress?: number;
    progressLabel?: string;
    meta?: Array<{ label: string; value: number | string }>;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const clampedProgress = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));

    return (
        <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${styles.card}`}>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className={`mt-2 text-3xl font-bold tabular-nums ${styles.value}`}>{value}</p>
                    {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>{icon}</div>
            </div>
            {clampedProgress !== undefined && (
                <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-medium text-gray-500">
                        <span className="truncate">{progressLabel}</span>
                        <span className="tabular-nums">{clampedProgress}%</span>
                    </div>
                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${styles.track}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} style={{ width: `${clampedProgress}%` }} />
                    </div>
                </div>
            )}
            {meta && meta.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {meta.map((item) => (
                        <span
                            key={item.label}
                            className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-black/5"
                        >
                            <span className="tabular-nums text-gray-900">{item.value}</span>
                            <span>{item.label}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Index({ board, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { counts, categories, masters, recent, top_brands } = board;
    const brandMax = Math.max(...top_brands.map((row) => row.total), 1);
    const attention = counts.inactive + counts.without_brand + counts.without_price;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('products.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('products.create')}>
                                <PrimaryButton>{t('products.products.index.new')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('products.dashboard.title')} />

            <ProductNav />

            <p className="mb-6 text-sm text-gray-600">{t('products.dashboard.subtitle')}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    label={t('products.dashboard.active')}
                    value={counts.active}
                    hint={t('products.dashboard.of_products', { total: counts.total })}
                    tone="emerald"
                    icon={<IconBox />}
                    progress={sharePercent(counts.active, counts.total)}
                    progressLabel={t('products.dashboard.share_label')}
                />
                <StatCard
                    label={t('products.dashboard.favorites')}
                    value={counts.favorites}
                    hint={t('products.dashboard.favorites_hint')}
                    tone="amber"
                    icon={<IconStar />}
                    progress={sharePercent(counts.favorites, counts.total)}
                    progressLabel={t('products.dashboard.share_label')}
                />
                <StatCard
                    label={t('products.dashboard.variants')}
                    value={counts.variants}
                    hint={t('products.dashboard.variants_hint')}
                    tone="violet"
                    icon={<IconLayers />}
                    progress={sharePercent(counts.variants, counts.total)}
                    progressLabel={t('products.dashboard.share_label')}
                />
                <StatCard
                    label={t('products.dashboard.brands')}
                    value={masters.brands_active}
                    hint={t('products.dashboard.of_brands', { total: masters.brands_total })}
                    tone="sky"
                    icon={<IconTag />}
                    progress={sharePercent(masters.brands_active, masters.brands_total)}
                    progressLabel={t('products.dashboard.brands_ready')}
                    meta={[{ label: t('products.dashboard.principals_short'), value: masters.principals_active }]}
                />
                <StatCard
                    label={t('products.dashboard.needs_attention')}
                    value={attention}
                    hint={t('products.dashboard.needs_attention_hint')}
                    tone={attention > 0 ? 'rose' : 'slate'}
                    icon={<IconAlert />}
                    meta={[
                        { label: t('products.status.inactive'), value: counts.inactive },
                        { label: t('products.dashboard.without_brand'), value: counts.without_brand },
                        { label: t('products.dashboard.without_price'), value: counts.without_price },
                    ]}
                />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(['merchandise', 'fleet_sparepart', 'service'] as const).map((key) => (
                    <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {t(`products.categories.${key}`)}
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{categories[key]}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {sharePercent(categories[key], counts.total)}% {t('products.dashboard.share_label')}
                        </p>
                    </div>
                ))}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('products.dashboard.catalog_masters')}</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-black/5">
                            <span className="tabular-nums text-gray-900">{masters.product_types}</span> {t('products.nav.product_types')}
                        </span>
                        <span className="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-black/5">
                            <span className="tabular-nums text-gray-900">{masters.attributes}</span> {t('products.nav.attributes')}
                        </span>
                        <span className="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-black/5">
                            <span className="tabular-nums text-gray-900">{masters.tags}</span> {t('products.nav.tags')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('products.dashboard.top_brands')}</p>
                        <Link href={prefixedRoute('products.brands.index')} className="text-xs font-medium text-indigo-600 hover:underline">
                            {t('products.dashboard.manage_brands')}
                        </Link>
                    </div>
                    {top_brands.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('products.dashboard.no_brands')}</p>
                    ) : (
                        <div className="space-y-2">
                            {top_brands.map((row) => (
                                <div key={row.id}>
                                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                                        <span className="truncate font-medium text-gray-800">{row.name}</span>
                                        <span className="tabular-nums">{row.total}</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                                        <div
                                            className="h-full rounded-full bg-indigo-500"
                                            style={{ width: `${Math.max(8, (row.total / brandMax) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800">{t('products.dashboard.recent')}</h3>
                        <Link href={prefixedRoute('products.index')} className="text-sm font-medium text-indigo-600 hover:underline">
                            {t('products.dashboard.view_all')}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('products.fields.code')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('products.fields.name')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('products.fields.category')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('products.fields.price')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('products.fields.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('products.products.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.code}</td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('products.show', product.id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {product.name}
                                                </Link>
                                                <div className="text-xs text-gray-500">
                                                    {[product.brand, product.product_type].filter(Boolean).join(' · ') || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {t(`products.categories.${product.category}`, undefined, product.category)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                                {product.price !== null ? formatMoney(product.price) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        product.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {t(`products.status.${product.status}`, undefined, product.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
