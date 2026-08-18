import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';

interface Props {
    referralCode: string;
    companyName: string | null;
    headline: string;
    subheadline: string | null;
    ctaText: string;
    highlights: string[];
}

/**
 * A reseller's own public pitch page — no login, no chrome from the app shell,
 * just the pitch and one button. Register already captures ?ref= via
 * CaptureResellerReferral, so the CTA is a plain link with no extra plumbing.
 */
export default function LandingPage({ referralCode, companyName, headline, subheadline, ctaText, highlights }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <>
            <Head title={headline} />

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/60 to-indigo-50/80 text-slate-800 selection:bg-indigo-500 selection:text-white">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 -top-20 h-[450px] w-[450px] rounded-full bg-sky-300/30 blur-[130px]" />
                    <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-full bg-indigo-300/30 blur-[130px]" />
                </div>

                <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
                    <span className="text-xl font-extrabold tracking-tight text-slate-900">{DEFAULT_SITE_NAME}</span>
                    {companyName && (
                        <span className="rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-indigo-700 backdrop-blur-sm">
                            {t('reseller.landing.presented_by', { name: companyName })}
                        </span>
                    )}
                </header>

                <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{headline}</h1>

                    {subheadline && <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">{subheadline}</p>}

                    <div className="mt-10">
                        <Link
                            href={`/register?ref=${referralCode}`}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90"
                        >
                            {ctaText}
                        </Link>
                    </div>

                    {highlights.length > 0 && (
                        <div className="mx-auto mt-16 grid gap-4 sm:grid-cols-2">
                            {highlights.map((highlight, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-5 py-4 text-left text-sm font-medium text-slate-700 backdrop-blur-sm"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                                        ✓
                                    </span>
                                    {highlight}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
