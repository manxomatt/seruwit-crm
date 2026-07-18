import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface ModuleRow {
    key: string;
    label: string;
    description: string;
    requires: string[];
    is_enabled: boolean;
}

interface Props {
    modules: ModuleRow[];
}

export default function Index({ modules }: Props): JSX.Element {
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [processingKey, setProcessingKey] = useState<string | null>(null);

    const toggle = (module: ModuleRow): void => {
        setProcessingKey(module.key);
        router.patch(route('module.registry.toggle-status', module.key), {}, {
            preserveScroll: true,
            onFinish: () => setProcessingKey(null),
        });
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Modul Platform</h2>}>
            <Head title="Modul Platform" />

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

                <p className="max-w-2xl text-sm text-gray-600">
                    Menonaktifkan modul di sini memutus akses <strong>semua tenant</strong> ke modul tersebut seketika,
                    terlepas dari paket langganan atau status pasangnya masing-masing. Data tenant tidak tersentuh —
                    mengaktifkan kembali langsung memulihkan semuanya, persis seperti menurunkan lalu menaikkan paket.
                </p>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <ul className="divide-y divide-gray-100">
                        {modules.map((module) => (
                            <li key={module.key} className="flex flex-wrap items-start gap-4 p-6">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-medium text-gray-900">{module.label}</h3>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                                            {module.key}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                module.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {module.is_enabled ? 'Aktif' : 'Dinonaktifkan'}
                                        </span>
                                    </div>

                                    {module.description && <p className="mt-1 text-sm text-gray-500">{module.description}</p>}

                                    {module.requires.length > 0 && (
                                        <p className="mt-2 text-xs text-gray-400">Membutuhkan: {module.requires.join(', ')}</p>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    <SecondaryButton
                                        disabled={processingKey === module.key}
                                        onClick={() => toggle(module)}
                                        className={module.is_enabled ? '!text-red-700' : '!text-green-700'}
                                    >
                                        {processingKey === module.key ? 'Memproses…' : module.is_enabled ? 'Nonaktifkan' : 'Aktifkan'}
                                    </SecondaryButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </DynamicLayout>
    );
}
