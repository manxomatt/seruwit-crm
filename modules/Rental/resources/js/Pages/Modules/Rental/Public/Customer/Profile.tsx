import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
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
    has_password: boolean;
    created_at?: string;
}

interface Props {
    brand: Brand;
    customer: Customer;
}

export default function Profile({ brand, customer }: Props) {
    const profileForm = useForm({
        name: customer.name || '',
        email: customer.email || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e: FormEvent) => {
        e.preventDefault();
        profileForm.put(route('book.rental.portal.profile.update'), {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put(route('book.rental.portal.profile.password'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <CustomerPortalLayout brand={brand} title="Profil Akun Pelanggan">
            <div className="max-w-3xl space-y-8">
                {/* Basic Info Form */}
                <form
                    onSubmit={handleProfileSubmit}
                    className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
                >
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-black text-slate-900">Informasi Pribadi</h3>
                        <p className="text-xs text-slate-500">Perbarui data nama dan kontak akun Anda.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Lengkap Sesuai KTP" />
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
                            <InputLabel htmlFor="phone" value="Nomor WhatsApp (Identitas Login Utama)" />
                            <input
                                id="phone"
                                type="text"
                                value={customer.phone}
                                disabled
                                className="w-full mt-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-600 cursor-not-allowed"
                            />
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                Nomor WhatsApp terikat ke akun dan riwayat verifikasi Anda.
                            </span>
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Alamat Email (Opsional)" />
                            <TextInput
                                id="email"
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                placeholder="email@contoh.com"
                                className="w-full mt-1.5 text-sm"
                            />
                            <InputError message={profileForm.errors.email} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={profileForm.processing}
                            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            {profileForm.processing ? 'Menyimpan…' : 'Simpan Profil'}
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
                            {customer.has_password ? 'Ubah Kata Sandi' : 'Atur Kata Sandi Baru'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {customer.has_password
                                ? 'Perbarui kata sandi akun untuk keamanan login.'
                                : 'Anda belum memiliki kata sandi. Atur kata sandi agar dapat login dengan email/nomor HP tanpa OTP.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {customer.has_password && (
                            <div>
                                <InputLabel htmlFor="current_password" value="Kata Sandi Saat Ini" />
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
                            <InputLabel htmlFor="password" value="Kata Sandi Baru" />
                            <TextInput
                                id="password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                className="w-full mt-1.5 text-sm"
                                required
                            />
                            <InputError message={passwordForm.errors.password} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Konfirmasi Kata Sandi Baru" />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                placeholder="Ulangi kata sandi baru"
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
                            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition disabled:opacity-50"
                        >
                            {passwordForm.processing ? 'Menyimpan…' : 'Simpan Kata Sandi'}
                        </button>
                    </div>
                </form>
            </div>
        </CustomerPortalLayout>
    );
}
