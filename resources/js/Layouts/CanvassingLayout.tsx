import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

interface FlashProps {
    flash?: { success?: string | null; error?: string | null };
}

interface Props {
    salespersonName: string;
    title?: string;
    back?: string;
    header?: ReactNode;
}

export default function CanvassingLayout({ salespersonName, title, back, header, children }: PropsWithChildren<Props>): JSX.Element {
    const { flash } = usePage().props as unknown as FlashProps;

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="sticky top-0 z-10 bg-emerald-700 text-white shadow">
                <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        {back && (
                            <Link href={back} className="-ml-1 rounded-full p-1 hover:bg-emerald-600" aria-label="Kembali">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                        )}
                        <div>
                            <p className="text-xs text-emerald-200">Portal Canvassing</p>
                            <h1 className="text-base font-semibold leading-tight">{title ?? salespersonName}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('module.canvassing.portal.today')}
                            className="rounded-md px-2 py-1 text-sm font-medium text-emerald-100 hover:bg-emerald-600"
                        >
                            Hari Ini
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-md px-2 py-1 text-sm font-medium text-emerald-100 hover:bg-emerald-600"
                        >
                            Keluar
                        </Link>
                    </div>
                </div>
                {header}
            </header>

            <main className="mx-auto max-w-md px-4 py-4">
                {flash?.success && (
                    <div className="mb-4 rounded-md bg-green-100 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}
                {flash?.error && (
                    <div className="mb-4 rounded-md bg-red-100 px-4 py-3 text-sm text-red-800">{flash.error}</div>
                )}
                {children}
            </main>
        </div>
    );
}
