import LanguageSwitcher from '@/Components/LanguageSwitcher';
import InputError from '@/Components/InputError';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

interface BankAccount {
    bank: string;
    account_number: string;
    account_name: string;
    instructions?: string[];
}

interface OrderPayload {
    id: number;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    currency: string;
    billing_interval?: string;
    plan: {
        id: number;
        name: string;
        price: string;
    };
    transfer_proof_path?: string | null;
    proof_url?: string | null;
    transfer_note?: string | null;
    expires_at?: string | null;
}

interface SessionPayload {
    id: number;
    status: string;
    company_name: string;
    subdomain: string;
    plan_key: string;
    verticals: string[];
}

interface Props {
    session: SessionPayload;
    order: OrderPayload;
    instructions: {
        bank_name?: string;
        bank_account_number?: string;
        bank_account_name?: string;
        bank_accounts?: BankAccount[];
    };
    centralHost?: string;
    settings?: Record<string, string>;
}

function CopyBtn({ text }: { text: string }): JSX.Element {
    const [copied, setCopied] = useState(false);

    const copy = (): void => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            title="Salin ke clipboard"
        >
            <span className="material-symbols-outlined text-xs">
                {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
    );
}

export default function OnboardingPayment({
    session,
    order,
    instructions,
    centralHost = 'localhost',
    settings,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [previewUrl, setPreviewUrl] = useState<string | null>(order.proof_url ?? null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        transfer_proof: File | null;
        transfer_note: string;
    }>({
        transfer_proof: null,
        transfer_note: order.transfer_note ?? '',
    });

    const isAwaitingConfirmation = order.status === 'awaiting_confirmation';
    const isConfirmed = order.status === 'confirmed';

    useEffect(() => {
        if (isConfirmed || session.status === 'ready') {
            window.location.href = route('central.onboarding.status');
            return;
        }

        const interval = window.setInterval(() => {
            router.reload({
                only: ['session', 'order'],
                onSuccess: (page) => {
                    const props = page.props as {
                        session?: SessionPayload;
                        order?: OrderPayload;
                    };
                    if (props.order?.status === 'confirmed' || props.session?.status === 'ready' || props.session?.status === 'pending' || props.session?.status === 'provisioning') {
                        window.location.href = route('central.onboarding.status');
                    }
                },
            });
        }, 4000);

        return () => window.clearInterval(interval);
    }, [isConfirmed, session.status]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0] ?? null;
        setData('transfer_proof', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submit = (e: FormEvent): void => {
        e.preventDefault();
        post(route('central.onboarding.payment.submit'), {
            forceFormData: true,
            onSuccess: () => {
                reset('transfer_proof');
            },
        });
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];
    const workspaceHost = `${session.subdomain}.${centralHost}`;

    const bankAccounts = instructions.bank_accounts && instructions.bank_accounts.length > 0
        ? instructions.bank_accounts
        : (instructions.bank_name && instructions.bank_account_number ? [{
            bank: instructions.bank_name,
            account_number: instructions.bank_account_number,
            account_name: instructions.bank_account_name || siteName,
        }] : []);

    const formatCurrency = (val: string | number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(val));
    };

    return (
        <>
            <Head title="Aktivasi Pembayaran Workspace" />

            <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/60 to-indigo-50/80 text-slate-800 selection:bg-indigo-500 selection:text-white">
                {/* Ambient glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 -top-20 h-[450px] w-[450px] rounded-full bg-sky-300/30 blur-[130px]" />
                    <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-full bg-indigo-300/30 blur-[130px]" />
                </div>

                {/* Header Switcher */}
                <div className="absolute right-6 top-6 z-20">
                    <LanguageSwitcher compact className="bg-white/80 border border-slate-200/80 backdrop-blur-md text-xs font-bold shadow-sm [&_button]:text-slate-600 [&_button.bg-white]:bg-indigo-600 [&_button.bg-white]:text-white" />
                </div>

                <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
                    {/* Brand header */}
                    <div className="mb-6 flex flex-col items-center text-center">
                        <Link href="/" className="group mb-2 flex items-center gap-2.5">
                            {siteLogo ? (
                                <img src={siteLogo} alt={siteName} className="h-10 w-auto object-contain" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20">
                                    <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                                </div>
                            )}
                            <span className="font-extrabold text-xl tracking-tight text-slate-900">{siteName}</span>
                        </Link>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                            Pembayaran & Aktivasi Workspace
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Selesaikan transfer bank untuk meluncurkan database workspace <span className="font-bold text-indigo-600 font-mono">{workspaceHost}</span>
                        </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* LEFT: Tagihan & Rekening Transfer (7 cols) */}
                        <div className="space-y-4 lg:col-span-7">
                            {/* Order summary card */}
                            <div className="rounded-3xl border border-white/90 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                                            Invoice #{order.id}
                                        </span>
                                        <h3 className="mt-1 text-base font-extrabold text-slate-900">
                                            Paket {order.plan.name}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {session.company_name} ({workspaceHost})
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Transfer</span>
                                        <span className="text-2xl font-black text-indigo-600 font-mono">
                                            {formatCurrency(order.total_amount)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2 rounded-2xl bg-slate-50/80 p-3.5 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Biaya Berlangganan ({order.plan.name})</span>
                                        <span className="font-semibold text-slate-800">{formatCurrency(order.amount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <span>Kode Unik Verifikasi</span>
                                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">Wajib Sesuai</span>
                                        </span>
                                        <span className="font-mono font-bold text-amber-700">+{order.unique_code}</span>
                                    </div>
                                    <div className="border-t border-slate-200/70 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                                        <span>Total yang Harus Ditransfer</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-indigo-600 font-mono">{formatCurrency(order.total_amount)}</span>
                                            <CopyBtn text={String(Math.round(Number(order.total_amount)))} />
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5 leading-relaxed">
                                    ⚠️ <strong>Penting:</strong> Mohon transfer <strong>tepat sampai 3 digit terakhir</strong> ({order.unique_code}) agar sistem dapat memvalidasi pembayaran Anda secara otomatis dan cepat.
                                </p>
                            </div>

                            {/* Rekening Tujuan */}
                            <div className="rounded-3xl border border-white/90 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-indigo-600">account_balance</span>
                                    <span>Rekening Tujuan Transfer</span>
                                </h3>

                                <div className="space-y-3">
                                    {bankAccounts.map((acc, idx) => (
                                        <div key={idx} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/20">
                                            <div>
                                                <span className="rounded-lg bg-indigo-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase">
                                                    {acc.bank}
                                                </span>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="font-mono text-base font-black text-slate-900 tracking-wider">{acc.account_number}</span>
                                                    <CopyBtn text={acc.account_number} />
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">a.n. {acc.account_name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Upload Bukti Bayar & Konfirmasi (5 cols) */}
                        <div className="space-y-4 lg:col-span-5">
                            <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-emerald-600">receipt_long</span>
                                    <span>Konfirmasi Bukti Transfer</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mb-4">
                                    Unggah struk transfer atau screenshot bukti pembayaran Anda.
                                </p>

                                {isAwaitingConfirmation && (
                                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-4">
                                        <div className="flex items-start gap-2.5">
                                            <span className="material-symbols-outlined text-lg text-amber-600">hourglass_top</span>
                                            <div>
                                                <p className="text-xs font-bold text-amber-900">Menunggu Konfirmasi Admin</p>
                                                <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
                                                    Bukti transfer telah diterima. Tim kami sedang memverifikasi pembayaran Anda. Halaman ini akan otomatis dialihkan saat workspace aktif.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            File Bukti Transfer <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-2xl p-1.5 bg-slate-50/50"
                                        />
                                        <InputError message={errors.transfer_proof} className="mt-1" />
                                    </div>

                                    {previewUrl && (
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-1">
                                            <img
                                                src={previewUrl}
                                                alt="Preview Bukti Transfer"
                                                className="max-h-48 w-full object-contain rounded-xl"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Catatan / Nama Pengirim (Opsional)
                                        </label>
                                        <textarea
                                            value={data.transfer_note}
                                            onChange={(e) => setData('transfer_note', e.target.value)}
                                            rows={2}
                                            placeholder="Contoh: Transfer dari Bank BCA a.n. John Doe"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs focus:border-indigo-500 focus:ring-indigo-500/20"
                                        />
                                        <InputError message={errors.transfer_note} className="mt-1" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing || (!data.transfer_proof && !order.transfer_proof_path)}
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:from-emerald-700 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Mengunggah Bukti...</span>
                                            </>
                                        ) : isAwaitingConfirmation ? (
                                            <span>Perbarui Bukti Transfer</span>
                                        ) : (
                                            <span>Kirim Bukti Pembayaran →</span>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-4 border-t border-slate-100 pt-3 text-center">
                                    <Link
                                        href={route('central.onboarding.show')}
                                        className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition"
                                    >
                                        ← Kembali & Ubah Pilihan Paket
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
