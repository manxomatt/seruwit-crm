import LanguageToggle from '@/Components/LanguageToggle';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

interface Props extends PropsWithChildren {
    brand: Brand;
    title: string;
    headerAction?: ReactNode;
}

export default function CustomerPortalLayout({ brand, title, headerAction, children }: Props) {
    const { auth, flash, url } = usePage<any>().props;
    const customer = auth?.customer;
    const brandColor = brand.color || '#0f766e';

    const handleLogout = () => {
        router.post(route('book.rental.logout'));
    };

    const navLinks = [
        {
            name: 'Dashboard',
            href: route('book.rental.portal.dashboard'),
            active: url === '/book/rental/portal' || url.startsWith('/book/rental/portal?'),
            icon: '📊',
        },
        {
            name: 'Sewa Saya',
            href: route('book.rental.portal.rentals.index'),
            active: url.startsWith('/book/rental/portal/rentals'),
            icon: '🚗',
        },
        {
            name: 'Dokumen KYC',
            href: route('book.rental.portal.documents.index'),
            active: url.startsWith('/book/rental/portal/documents'),
            icon: '📄',
        },
        {
            name: 'Profil Saya',
            href: route('book.rental.portal.profile'),
            active: url.startsWith('/book/rental/portal/profile'),
            icon: '👤',
        },
    ];

    return (
        <div
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between selection:bg-teal-500 selection:text-white"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`${title} · Portal Pelanggan ${brand.name}`} />

            <div>
                {/* Modern Portal Header */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="flex h-16 items-center justify-between">
                            {/* Brand & Customer Portal Tag */}
                            <div className="flex items-center gap-6">
                                <Link href={route('book.rental.search')} className="flex items-center gap-3 group">
                                    {brand.logo_url ? (
                                        <img
                                            src={brand.logo_url}
                                            alt={brand.name}
                                            className="h-9 w-9 rounded-xl object-contain ring-1 ring-slate-200 transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div
                                            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs"
                                            style={{ backgroundColor: 'var(--brand-color)' }}
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-sm font-black tracking-tight text-slate-900 block leading-tight">
                                            {brand.name}
                                        </span>
                                        <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                                            Portal Pelanggan
                                        </span>
                                    </div>
                                </Link>

                                {/* Desktop Navigation Links */}
                                <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200">
                                    {navLinks.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                                item.active
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            <span>{item.icon}</span>
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            {/* Header Actions */}
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href={route('book.rental.search')}
                                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition shadow-2xs"
                                >
                                    <span>🔍</span>
                                    <span>Cari Mobil</span>
                                </Link>

                                <LanguageToggle />

                                {/* User Profile Badge / Logout */}
                                {customer && (
                                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                                        <div className="hidden sm:block text-right">
                                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                                                {customer.name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium block">
                                                {customer.phone}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            title="Keluar"
                                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Navigation Bar */}
                        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                                        item.active
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Sub-header / Title Banner */}
                <div className="bg-white border-b border-slate-200/80 py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Kelola sewa kendaraan, jadwal serah terima, dan dokumen identitas Anda.
                            </p>
                        </div>
                        {headerAction && <div>{headerAction}</div>}
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="flex items-center gap-2">
                                <span className="text-base">✅</span>
                                <span>{flash.success}</span>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
                        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="flex items-center gap-2">
                                <span className="text-base">⚠️</span>
                                <span>{flash.error}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Container */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
            </div>

            {/* Portal Footer */}
            <footer className="mt-16 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-medium">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                        © 2026 {brand.name}. Seluruh Hak Cipta Dilindungi.
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Link href={route('book.rental.search')} className="hover:text-slate-600 transition">
                            Katalog Kendaraan
                        </Link>
                        <span>·</span>
                        <Link href={route('book.rental.history')} className="hover:text-slate-600 transition">
                            Riwayat Sewa
                        </Link>
                        {brand.support_phone && (
                            <>
                                <span>·</span>
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 hover:underline font-bold"
                                >
                                    WhatsApp Support
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
