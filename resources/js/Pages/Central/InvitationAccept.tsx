import { Head, useForm } from '@inertiajs/react';

interface Props {
    token: string;
    email: string;
    tenantName: string;
    hasAccount: boolean;
}

export default function InvitationAccept({ token, email, tenantName, hasAccount }: Props): JSX.Element {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/invitations/${token}`);
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border-slate-300 text-sm focus:border-sky-500 focus:ring-sky-500';

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
            <Head title="Terima Undangan" />

            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8">
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </span>

                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Undangan ke {tenantName}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Anda diundang sebagai <span className="font-medium text-slate-700">{email}</span>.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    {!hasAccount && (
                        <>
                            <label className="block text-sm font-medium text-slate-600">
                                Nama Lengkap
                                <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </label>
                            <label className="block text-sm font-medium text-slate-600">
                                Password
                                <input type="password" className={inputClass} value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                            </label>
                            <label className="block text-sm font-medium text-slate-600">
                                Konfirmasi Password
                                <input type="password" className={inputClass} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                            </label>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
                    >
                        Terima Undangan &amp; Masuk Workspace
                    </button>
                </form>
            </div>
        </div>
    );
}
