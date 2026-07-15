import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

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

const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const BuildingIcon = () => (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);

export default function Index({ tenants }: Props): JSX.Element {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        company_name: '',
        subdomain: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('module.tenants.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const toggleStatus = (tenant: TenantRow) => {
        router.patch(route('module.tenants.toggle-status', tenant.id));
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tenants</h1>
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <PlusIcon />
                        <span className="ml-2">{showForm ? 'Tutup Form' : 'Buat Tenant'}</span>
                    </button>
                </div>
            }
        >
            <Head title="Tenants" />

            {showForm && (
                <form onSubmit={submit} className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Buat Tenant Baru</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Nama Perusahaan
                            <input className={inputClass} value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} required />
                            {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Subdomain
                            <input className={inputClass} value={data.subdomain} onChange={(e) => setData('subdomain', e.target.value.toLowerCase())} required />
                            {errors.subdomain && <p className="mt-1 text-xs text-red-500">{errors.subdomain}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Nama Pemilik
                            <input className={inputClass} value={data.owner_name} onChange={(e) => setData('owner_name', e.target.value)} required />
                            {errors.owner_name && <p className="mt-1 text-xs text-red-500">{errors.owner_name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Email Pemilik
                            <input type="email" className={inputClass} value={data.owner_email} onChange={(e) => setData('owner_email', e.target.value)} required />
                            {errors.owner_email && <p className="mt-1 text-xs text-red-500">{errors.owner_email}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                            Password Pemilik <span className="font-normal text-gray-400">(kosongkan jika akun sudah ada)</span>
                            <input type="password" className={inputClass} value={data.owner_password} onChange={(e) => setData('owner_password', e.target.value)} />
                            {errors.owner_password && <p className="mt-1 text-xs text-red-500">{errors.owner_password}</p>}
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-5 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Buat Tenant
                    </button>
                </form>
            )}

            {tenants.length === 0 ? (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="py-16 text-center">
                        <div className="flex justify-center">
                            <BuildingIcon />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">Belum ada tenant</h3>
                        <p className="mt-2 text-sm text-gray-500">Mulai dengan membuat workspace pertama untuk pelanggan.</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Domain</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Anggota</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dibuat</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="transition-colors hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <Link
                                            href={route('module.tenants.show', tenant.id)}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                        >
                                            {tenant.name}
                                        </Link>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-500">{tenant.domain ?? '—'}</code>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{tenant.members}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                tenant.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {tenant.status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(tenant.created_at)}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleStatus(tenant)}
                                                className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                            >
                                                {tenant.status === 'active' ? 'Tangguhkan' : 'Aktifkan'}
                                            </button>
                                            <Link
                                                href={route('module.tenants.show', tenant.id)}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                            >
                                                Detail
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DynamicLayout>
    );
}
