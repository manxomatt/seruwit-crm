import { Head, usePage } from '@inertiajs/react';

interface Workspace {
    id: string;
    name: string;
    status: string;
    domain: string | null;
}

interface Props {
    workspaces: Workspace[];
}

export default function Workspaces({ workspaces }: Props): JSX.Element {
    const { auth } = usePage().props as any;

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-16">
            <Head title="Pilih Workspace" />

            <div className="mx-auto w-full max-w-lg">
                <div className="mb-10 text-center">
                    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pilih Workspace</h1>
                    <p className="mt-2 text-slate-500">
                        Masuk sebagai <span className="font-medium text-slate-700">{auth.user?.email}</span>
                    </p>
                </div>

                {workspaces.length > 0 ? (
                    <ul className="space-y-3">
                        {workspaces.map((workspace) => (
                            <li key={workspace.id}>
                                <a
                                    href={`/workspaces/${workspace.id}/enter`}
                                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-sky-300 hover:shadow-md"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-base font-bold text-sky-600">
                                            {workspace.name.charAt(0).toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-slate-900">{workspace.name}</p>
                                            {workspace.domain && (
                                                <p className="text-sm text-slate-400">{workspace.domain}</p>
                                            )}
                                        </div>
                                    </div>
                                    {workspace.status === 'active' ? (
                                        <svg className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-sky-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    ) : (
                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                            Ditangguhkan
                                        </span>
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                        <p className="font-medium text-slate-700">Belum ada workspace</p>
                        <p className="mt-1 text-sm text-slate-400">
                            Anda belum menjadi anggota workspace mana pun.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
