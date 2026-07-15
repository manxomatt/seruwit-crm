import { Head, useForm } from '@inertiajs/react';

interface TenantRow {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    members: number;
    created_at: string | null;
}

interface Props {
    tenants: TenantRow[];
}

export default function TenantsIndex({ tenants }: Props): JSX.Element {
    const { data, setData, post, processing, errors, reset } = useForm({
        company_name: '',
        subdomain: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
    });

    const { patch: patchStatus, processing: toggling } = useForm({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/tenants', { onSuccess: () => reset() });
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border-slate-300 text-sm focus:border-sky-500 focus:ring-sky-500';

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-12">
            <Head title="Kelola Tenant" />

            <div className="mx-auto max-w-5xl space-y-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Tenant</h1>
                    <p className="mt-1 text-slate-500">Panel super admin untuk seluruh workspace di platform.</p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead>
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-3">Nama</th>
                                <th className="px-5 py-3">Domain</th>
                                <th className="px-5 py-3">Anggota</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Dibuat</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="px-5 py-3 font-medium text-slate-900">{tenant.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{tenant.domain ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{tenant.members}</td>
                                    <td className="px-5 py-3">
                                        {tenant.status === 'active' ? (
                                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                                                Ditangguhkan
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{tenant.created_at ?? '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            type="button"
                                            disabled={toggling}
                                            onClick={() => patchStatus(`/admin/tenants/${tenant.id}/status`)}
                                            className="text-sm font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50"
                                        >
                                            {tenant.status === 'active' ? 'Tangguhkan' : 'Aktifkan'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {tenants.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                        Belum ada tenant.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Buat Tenant Baru</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-600">
                            Nama Perusahaan
                            <input className={inputClass} value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} required />
                            {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-slate-600">
                            Subdomain
                            <input className={inputClass} value={data.subdomain} onChange={(e) => setData('subdomain', e.target.value.toLowerCase())} required />
                            {errors.subdomain && <p className="mt-1 text-xs text-red-500">{errors.subdomain}</p>}
                        </label>
                        <label className="block text-sm font-medium text-slate-600">
                            Nama Pemilik
                            <input className={inputClass} value={data.owner_name} onChange={(e) => setData('owner_name', e.target.value)} required />
                            {errors.owner_name && <p className="mt-1 text-xs text-red-500">{errors.owner_name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-slate-600">
                            Email Pemilik
                            <input type="email" className={inputClass} value={data.owner_email} onChange={(e) => setData('owner_email', e.target.value)} required />
                            {errors.owner_email && <p className="mt-1 text-xs text-red-500">{errors.owner_email}</p>}
                        </label>
                        <label className="block text-sm font-medium text-slate-600 sm:col-span-2">
                            Password Pemilik (kosongkan jika akun sudah ada)
                            <input type="password" className={inputClass} value={data.owner_password} onChange={(e) => setData('owner_password', e.target.value)} />
                            {errors.owner_password && <p className="mt-1 text-xs text-red-500">{errors.owner_password}</p>}
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-5 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
                    >
                        Buat Tenant
                    </button>
                </form>
            </div>
        </div>
    );
}
