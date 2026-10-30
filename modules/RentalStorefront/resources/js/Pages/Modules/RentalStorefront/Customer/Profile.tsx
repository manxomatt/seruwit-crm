import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import CustomerPortalLayout from './CustomerPortalLayout';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    avatar_url?: string | null;
    has_password: boolean;
    created_at?: string;
}

interface Props {
    brand: Brand;
    customer: Customer;
}

export default function Profile({ brand, customer }: Props) {
    const { locale } = useTrans();
    const tr = (id: string, en: string) => (locale === 'en' ? en : id);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(customer.avatar_url || null);

    useEffect(() => {
        setAvatarPreview(customer.avatar_url || null);
    }, [customer.avatar_url]);

    const profileForm = useForm<{
        _method: string;
        name: string;
        email: string;
        avatar: File | null;
        remove_avatar: number;
    }>({
        _method: 'put',
        name: customer.name || '',
        email: customer.email || '',
        avatar: null,
        remove_avatar: 0,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            return;
        }
        profileForm.setData((prev) => ({
            ...prev,
            avatar: file,
            remove_avatar: 0,
        }));
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);
    };

    const handleRemoveAvatar = () => {
        profileForm.setData((prev) => ({
            ...prev,
            avatar: null,
            remove_avatar: 1,
        }));
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleProfileSubmit = (e: FormEvent) => {
        e.preventDefault();
        profileForm.post(route('book.rental.portal.profile.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                profileForm.setData((prev) => ({
                    ...prev,
                    avatar: null,
                    remove_avatar: 0,
                }));
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put(route('book.rental.portal.profile.password'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const initials = (profileForm.data.name || customer.name || 'P')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');

    return (
        <CustomerPortalLayout brand={brand} title={tr('Profil Akun Pelanggan', 'Customer Account Profile')}>
            <div className="max-w-3xl space-y-8">
                {/* Basic Info Form */}
                <form
                    onSubmit={handleProfileSubmit}
                    className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
                >
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-black text-slate-900">{tr('Informasi Pribadi', 'Personal Information')}</h3>
                        <p className="text-xs text-slate-500">
                            {tr(
                                'Perbarui foto profil, data nama, dan kontak akun Anda.',
                                'Update your profile photo, name, and account contact details.',
                            )}
                        </p>
                    </div>

                    {/* Profile Photo Upload Section */}
                    <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 sm:p-5">
                        <InputLabel htmlFor="avatar" value={tr('Foto Profil', 'Profile Photo')} />
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="relative h-20 w-20 shrink-0">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt={customer.name}
                                        className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-200"
                                    />
                                ) : (
                                    <div
                                        className="flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-black text-white shadow-md border-2 border-white ring-1 ring-slate-200"
                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                    >
                                        {initials || '👤'}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <input
                                    ref={fileInputRef}
                                    id="avatar"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{avatarPreview ? tr('Ganti Foto', 'Change Photo') : tr('Upload Foto Profil', 'Upload Profile Photo')}</span>
                                    </button>

                                    {avatarPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="inline-flex items-center gap-1 rounded-xl bg-white hover:bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 border border-slate-200 hover:border-rose-200 transition"
                                        >
                                            <span>{tr('Hapus Foto', 'Remove Photo')}</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {tr('Format JPG, PNG, atau WEBP. Ukuran maksimal 5 MB.', 'JPG, PNG, or WEBP format. Maximum size 5 MB.')}
                                </p>
                                {profileForm.data.avatar && (
                                    <p className="text-[11px] font-bold text-teal-700">
                                        {tr(
                                            `File dipilih: ${profileForm.data.avatar.name} (Klik "Simpan Profil" untuk menyimpan perubahan)`,
                                            `Selected file: ${profileForm.data.avatar.name} (Click "Save Profile" to save changes)`,
                                        )}
                                    </p>
                                )}
                                <InputError message={profileForm.errors.avatar || profileForm.errors.remove_avatar} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value={tr('Nama Lengkap Sesuai KTP', 'Full Name as on ID Card')} />
                            <TextInput
                                id="name"
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                className="w-full mt-1.5 text-sm font-semibold"
                                required
                            />
                            <InputError message={profileForm.errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value={tr('Nomor WhatsApp (Identitas Login Utama)', 'WhatsApp Number (Primary Login ID)')} />
                            <input
                                id="phone"
                                type="text"
                                value={customer.phone}
                                disabled
                                className="w-full mt-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-600 cursor-not-allowed"
                            />
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                {tr(
                                    'Nomor WhatsApp terikat ke akun dan riwayat verifikasi Anda.',
                                    'Your WhatsApp number is linked to your account and verification history.',
                                )}
                            </span>
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value={tr('Alamat Email (Opsional)', 'Email Address (Optional)')} />
                            <TextInput
                                id="email"
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                placeholder={tr('email@contoh.com', 'email@example.com')}
                                className="w-full mt-1.5 text-sm"
                            />
                            <InputError message={profileForm.errors.email} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={profileForm.processing}
                            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            {profileForm.processing ? tr('Menyimpan…', 'Saving…') : tr('Simpan Profil', 'Save Profile')}
                        </button>
                    </div>
                </form>

                {/* Password Setting Form */}
                <form
                    onSubmit={handlePasswordSubmit}
                    className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
                >
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-black text-slate-900">
                            {customer.has_password ? tr('Ubah Kata Sandi', 'Change Password') : tr('Atur Kata Sandi Baru', 'Set New Password')}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {customer.has_password
                                ? tr('Perbarui kata sandi akun untuk keamanan login.', 'Update your account password for login security.')
                                : tr(
                                      'Anda belum memiliki kata sandi. Atur kata sandi agar dapat login dengan email/nomor HP tanpa OTP.',
                                      'You do not have a password yet. Set a password so you can sign in with your email/phone number without OTP.',
                                  )}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {customer.has_password && (
                            <div>
                                <InputLabel htmlFor="current_password" value={tr('Kata Sandi Saat Ini', 'Current Password')} />
                                <TextInput
                                    id="current_password"
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    className="w-full mt-1.5 text-sm"
                                    required
                                />
                                <InputError message={passwordForm.errors.current_password} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="password" value={tr('Kata Sandi Baru', 'New Password')} />
                            <TextInput
                                id="password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                placeholder={tr('Minimal 8 karakter', 'Minimum 8 characters')}
                                className="w-full mt-1.5 text-sm"
                                required
                            />
                            <InputError message={passwordForm.errors.password} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password_confirmation" value={tr('Konfirmasi Kata Sandi Baru', 'Confirm New Password')} />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                placeholder={tr('Ulangi kata sandi baru', 'Repeat new password')}
                                className="w-full mt-1.5 text-sm"
                                required
                            />
                            <InputError message={passwordForm.errors.password_confirmation} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={passwordForm.processing}
                            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition disabled:opacity-50"
                        >
                            {passwordForm.processing ? tr('Menyimpan…', 'Saving…') : tr('Simpan Kata Sandi', 'Save Password')}
                        </button>
                    </div>
                </form>
            </div>
        </CustomerPortalLayout>
    );
}
