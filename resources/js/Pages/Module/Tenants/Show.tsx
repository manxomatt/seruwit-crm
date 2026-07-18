import DynamicLayout from '@/Layouts/DynamicLayout';
import Select from '@/Components/Select';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

interface Member {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

type ModuleState = 'installed' | 'available' | 'uninstalled' | 'locked' | 'locked_with_data' | 'disabled' | 'disabled_with_data';

interface ModuleEntry {
    key: string;
    label: string;
    description: string;
    requires: string[];
    entitled: boolean;
    installed: boolean;
    state: ModuleState;
    purges_at: string | null;
    plans_offering: string[];
}

interface Plan {
    key: string;
    label: string;
    description: string;
    modules: string[];
}

const STATE_BADGE: Record<ModuleState, { label: string; className: string }> = {
    installed: { label: 'Terpasang', className: 'bg-green-100 text-green-800' },
    available: { label: 'Tersedia', className: 'bg-sky-100 text-sky-800' },
    uninstalled: { label: 'Dicopot', className: 'bg-amber-100 text-amber-800' },
    locked: { label: 'Di luar paket', className: 'bg-gray-100 text-gray-600' },
    locked_with_data: { label: 'Terkunci, data tersimpan', className: 'bg-gray-100 text-gray-600' },
    disabled: { label: 'Dinonaktifkan', className: 'bg-red-100 text-red-800' },
    disabled_with_data: { label: 'Dinonaktifkan', className: 'bg-red-100 text-red-800' },
};

const isDisabled = (state: ModuleState): boolean => state === 'disabled' || state === 'disabled_with_data';

interface TenantDetail {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    subdomain: string | null;
    members: number;
    created_at: string | null;
    billing_email: string | null;
    phone: string | null;
    address: string | null;
    tax_id: string | null;
    notes: string | null;
    plan: string;
}

interface Props {
    tenant: TenantDetail;
    members: Member[];
    modules: ModuleEntry[];
    plans: Plan[];
    graceDays: number;
}

const ArrowLeftIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

export default function Show({ tenant, members, modules, plans, graceDays }: Props): JSX.Element {
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const { data, setData, patch, processing, errors } = useForm({
        name: tenant.name,
        subdomain: tenant.subdomain ?? '',
        status: tenant.status,
        plan: tenant.plan,
        billing_email: tenant.billing_email ?? '',
        phone: tenant.phone ?? '',
        address: tenant.address ?? '',
        tax_id: tenant.tax_id ?? '',
        notes: tenant.notes ?? '',
    });

    const deleteForm = useForm({ confirm_name: '' });

    const installModule = (key: string): void => {
        router.post(route('module.tenants.modules.install', [tenant.id, key]), {}, { preserveScroll: true });
    };

    const uninstallModule = (key: string): void => {
        router.delete(route('module.tenants.modules.uninstall', [tenant.id, key]), { preserveScroll: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('module.tenants.update', tenant.id), { preserveScroll: true });
    };

    const destroy = (e: React.FormEvent) => {
        e.preventDefault();
        deleteForm.delete(route('module.tenants.destroy', tenant.id));
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    const canDelete = deleteForm.data.confirm_name === tenant.name;

    return (
        <DynamicLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('module.tenants.index')} className="text-gray-400 hover:text-gray-600">
                        <ArrowLeftIcon />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{tenant.name}</h1>
                        {tenant.domain && <p className="text-sm text-gray-500">{tenant.domain}</p>}
                    </div>
                </div>
            }
        >
            <Head title={`Tenant: ${tenant.name}`} />

            <div className="space-y-6">
                {flash?.success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 ring-1 ring-green-200">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                        {flash.error}
                    </div>
                )}

                {/* Overview */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Status', value: tenant.status === 'active' ? 'Aktif' : 'Ditangguhkan' },
                        { label: 'Anggota', value: String(tenant.members) },
                        { label: 'Paket', value: plans.find((p) => p.key === tenant.plan)?.label ?? tenant.plan },
                        { label: 'Subdomain', value: tenant.subdomain ?? '—' },
                        { label: 'Dibuat', value: tenant.created_at ?? '—' },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{item.label}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Members */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Anggota</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Peran</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{member.email}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {member.roles.length > 0 ? (
                                                member.roles.map((role) => (
                                                    <span key={role} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                        {role}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-400">Belum ada anggota.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit form */}
                <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit Detail</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Nama Perusahaan
                            <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Subdomain
                            <input className={inputClass} value={data.subdomain} onChange={(e) => setData('subdomain', e.target.value.toLowerCase())} required />
                            {errors.subdomain && <p className="mt-1 text-xs text-red-500">{errors.subdomain}</p>}
                        </label>
                        <div className="block text-sm font-medium text-gray-700">
                            Status
                            <div className="mt-1 grid grid-cols-2 gap-2">
                                {[
                                    { value: 'active', label: 'Aktif', dot: 'bg-green-500', selected: 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' },
                                    { value: 'suspended', label: 'Ditangguhkan', dot: 'bg-amber-500', selected: 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500' },
                                ].map((opt) => {
                                    const isSelected = data.status === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('status', opt.value)}
                                            aria-pressed={isSelected}
                                            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                                                isSelected ? opt.selected : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className={`h-2 w-2 rounded-full transition-colors ${isSelected ? opt.dot : 'bg-gray-300'}`} />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
                        </div>
                        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                            Paket langganan
                            <Select
                                className="mt-1 w-full"
                                value={data.plan}
                                onChange={(value) => setData('plan', value)}
                                options={plans.map((plan) => ({ value: plan.key, label: `${plan.label} — ${plan.description}` }))}
                            />
                            {errors.plan && <p className="mt-1 text-xs text-red-500">{errors.plan}</p>}
                            <p className="mt-1 text-xs text-gray-500">
                                Menurunkan paket hanya mencabut akses — modul yang sudah terpasang beserta datanya tetap
                                utuh dan kembali begitu paketnya dinaikkan lagi.
                            </p>
                        </label>
                    </div>
                    {data.subdomain !== (tenant.subdomain ?? '') && (
                        <p className="mt-3 text-xs text-amber-600">
                            Mengubah subdomain akan mengganti URL workspace ini — tautan lama akan berhenti bekerja.
                        </p>
                    )}

                    <h3 className="mb-4 mt-8 border-t border-gray-100 pt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Profil &amp; Kontak
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Email Billing
                            <input type="email" className={inputClass} value={data.billing_email} onChange={(e) => setData('billing_email', e.target.value)} placeholder="billing@perusahaan.com" />
                            {errors.billing_email && <p className="mt-1 text-xs text-red-500">{errors.billing_email}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Telepon
                            <input className={inputClass} value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+62 ..." />
                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            NPWP / Tax ID
                            <input className={inputClass} value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} />
                            {errors.tax_id && <p className="mt-1 text-xs text-red-500">{errors.tax_id}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Alamat
                            <input className={inputClass} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                            Catatan Internal <span className="font-normal text-gray-400">(hanya terlihat admin platform)</span>
                            <textarea className={inputClass} rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-5 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Simpan Perubahan
                    </button>
                </form>

                {/* Modules */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Modul</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Apa yang boleh dipasang ditentukan paket di atas. Mencopot modul tidak menghapus datanya —
                            data disimpan {graceDays} hari sebelum dihapus permanen.
                        </p>
                    </div>

                    {modules.length === 0 ? (
                        <p className="p-6 text-sm text-gray-500">Belum ada modul opsional yang terdaftar.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {modules.map((module) => {
                                const badge = STATE_BADGE[module.state];

                                return (
                                    <li key={module.key} className="flex flex-wrap items-center gap-4 p-6">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900">{module.label}</h4>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">{module.description}</p>

                                            {module.state === 'uninstalled' && module.purges_at && (
                                                <p className="mt-2 text-xs text-amber-700">
                                                    Data dihapus permanen pada {module.purges_at}.
                                                </p>
                                            )}

                                            {isDisabled(module.state) && (
                                                <p className="mt-2 text-xs text-red-700">
                                                    Modul ini dinonaktifkan platform untuk semua tenant
                                                    {module.state === 'disabled_with_data' && ' — datanya tetap tersimpan'}.
                                                </p>
                                            )}

                                            {!isDisabled(module.state) && !module.entitled && module.plans_offering.length > 0 && (
                                                <p className="mt-2 text-xs text-gray-500">
                                                    Ada di paket {module.plans_offering.join(', ')} — pindahkan paketnya
                                                    untuk membuka.
                                                </p>
                                            )}
                                        </div>

                                        <div className="shrink-0">
                                            {isDisabled(module.state) ? (
                                                <span className="text-sm text-gray-400">Dinonaktifkan</span>
                                            ) : !module.entitled ? (
                                                <span className="text-sm text-gray-400">Di luar paket</span>
                                            ) : module.installed ? (
                                                <button
                                                    type="button"
                                                    onClick={() => uninstallModule(module.key)}
                                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Copot
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => installModule(module.key)}
                                                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                                >
                                                    Pasang
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Danger zone */}
                <form onSubmit={destroy} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-red-200">
                    <h2 className="text-lg font-semibold text-red-700">Zona Bahaya</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Menghapus tenant akan <strong>menghapus permanen seluruh datanya</strong> (schema database, pengguna,
                        konten). Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <label className="mt-4 block text-sm font-medium text-gray-700">
                        Ketik <span className="font-semibold text-gray-900">{tenant.name}</span> untuk mengonfirmasi
                        <input
                            className={inputClass}
                            value={deleteForm.data.confirm_name}
                            onChange={(e) => deleteForm.setData('confirm_name', e.target.value)}
                            placeholder={tenant.name}
                        />
                        {deleteForm.errors.confirm_name && <p className="mt-1 text-xs text-red-500">{deleteForm.errors.confirm_name}</p>}
                    </label>
                    <button
                        type="submit"
                        disabled={!canDelete || deleteForm.processing}
                        className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Hapus Tenant Permanen
                    </button>
                </form>
            </div>
        </DynamicLayout>
    );
}
