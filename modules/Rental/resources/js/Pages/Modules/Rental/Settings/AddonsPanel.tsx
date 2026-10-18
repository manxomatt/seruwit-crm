import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Select, { SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export interface RentalAddonItem {
    id: number;
    code: string;
    name: string;
    category: string;
    description: string | null;
    icon: string;
    price_type: 'daily' | 'flat';
    price: number;
    max_quantity: number;
    is_active: boolean;
    sort_order: number;
}

const CATEGORY_MAP: Record<string, { label: string; icon: string; badgeClass: string }> = {
    accessory: { label: 'Aksesoris', icon: '🧳', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    service: { label: 'Layanan & Sopir', icon: '👨‍✈️', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
    comfort: { label: 'Kenyamanan', icon: '💳', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    fuel: { label: 'BBM', icon: '⛽', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    protection: { label: 'Proteksi', icon: '🛡️', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const CATEGORY_OPTIONS: SelectOption[] = [
    { value: 'accessory', label: '🧳 Aksesoris Kendaraan', description: 'Kursi bayi, roof box, aksesoris fisik' },
    { value: 'service', label: '👨‍✈️ Layanan & Sopir', description: 'Supir tambahan, valet delivery' },
    { value: 'comfort', label: '💳 Kenyamanan & Perjalanan', description: 'E-toll card, fasilitas perjalanan' },
    { value: 'fuel', label: '⛽ Bahan Bakar (BBM)', description: 'Paket prepaid BBM awal' },
    { value: 'protection', label: '🛡️ Proteksi & Asuransi', description: 'Paket proteksi ekstra' },
];

const ICON_PRESETS: Array<{ value: string; label: string; emoji: string }> = [
    { value: 'baby', label: 'Kursi Bayi (Baby Seat)', emoji: '👶' },
    { value: 'box', label: 'Roof Box / Rak Atas', emoji: '📦' },
    { value: 'camera', label: 'Kamera Dashcam', emoji: '📷' },
    { value: 'card', label: 'E-Toll / Kartu', emoji: '💳' },
    { value: 'fuel', label: 'Prepaid BBM', emoji: '⛽' },
    { value: 'user', label: 'Sopir / Driver', emoji: '👨‍✈️' },
    { value: 'car', label: 'Valet / Mobil', emoji: '🚗' },
    { value: 'shield', label: 'Proteksi / Keamanan', emoji: '🛡️' },
    { value: 'wifi', label: 'Wi-Fi / Modem', emoji: '📶' },
    { value: 'phone', label: 'Holder / Charger HP', emoji: '📱' },
    { value: 'star', label: 'Fasilitas Spesial', emoji: '⭐' },
];

const ICON_OPTIONS: SelectOption[] = ICON_PRESETS.map((p) => ({
    value: p.value,
    label: `${p.emoji} ${p.label}`,
}));

const PRICE_TYPE_OPTIONS: SelectOption[] = [
    { value: 'daily', label: 'Per Hari (Daily)', description: 'Dikalikan dengan total durasi hari sewa kendaraan' },
    { value: 'flat', label: 'Flat (Sekali Sewa)', description: 'Biaya tetap satu kali per transaksi sewa' },
];

function addonEmoji(icon: string): string {
    const preset = ICON_PRESETS.find((p) => p.value === icon);
    return preset ? preset.emoji : '📦';
}

function formatMoney(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function AddonsPanel({
    addons = [],
}: {
    addons?: RentalAddonItem[];
}): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingAddon, setEditingAddon] = useState<RentalAddonItem | null>(null);
    const [deleteAddonItem, setDeleteAddonItem] = useState<RentalAddonItem | null>(null);

    const form = useForm({
        code: '',
        name: '',
        category: 'accessory',
        description: '',
        icon: 'box',
        price_type: 'daily',
        price: '0',
        max_quantity: 1,
        is_active: true,
        sort_order: 0,
    });

    const openCreateModal = () => {
        setEditingAddon(null);
        form.reset();
        form.clearErrors();
        form.setData({
            code: '',
            name: '',
            category: 'accessory',
            description: '',
            icon: 'box',
            price_type: 'daily',
            price: '50000',
            max_quantity: 1,
            is_active: true,
            sort_order: addons.length + 1,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: RentalAddonItem) => {
        setEditingAddon(item);
        form.clearErrors();
        form.setData({
            code: item.code,
            name: item.name,
            category: item.category,
            description: item.description ?? '',
            icon: item.icon || 'box',
            price_type: item.price_type,
            price: String(item.price),
            max_quantity: item.max_quantity,
            is_active: item.is_active,
            sort_order: item.sort_order,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAddon(null);
    };

    const handleFormSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingAddon) {
            form.patch(prefixedRoute('rental.settings.addons.update', { addon: editingAddon.id }), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        } else {
            form.post(prefixedRoute('rental.settings.addons.store'), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleToggleActive = (item: RentalAddonItem) => {
        router.patch(
            prefixedRoute('rental.settings.addons.toggle', { addon: item.id }),
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (!deleteAddonItem) return;
        router.delete(
            prefixedRoute('rental.settings.addons.destroy', { addon: deleteAddonItem.id }),
            {
                preserveScroll: true,
                onSuccess: () => setDeleteAddonItem(null),
            }
        );
    };

    const filteredAddons = addons.filter(
        (item) => selectedCategory === 'all' || item.category === selectedCategory
    );

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 shadow-xs">
                        📦
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            Katalog Add-on & Layanan Tambahan
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Kelola perlengkapan, fasilitas ekstra, dan tarif layanan opsional yang dapat dipesan pelanggan.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <PrimaryButton
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 shadow-sm transition dark:bg-amber-500 dark:text-slate-900 dark:hover:bg-amber-400"
                    >
                        <span>+</span>
                        <span>Tambah Add-on</span>
                    </PrimaryButton>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                        selectedCategory === 'all'
                            ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                >
                    Semua ({addons.length})
                </button>
                {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
                    const count = addons.filter((a) => a.category === key).length;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedCategory(key)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                selectedCategory === key
                                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label} ({count})</span>
                        </button>
                    );
                })}
            </div>

            {/* Addons Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3.5">Urutan</th>
                                <th className="px-5 py-3.5">Item & Deskripsi</th>
                                <th className="px-5 py-3.5">Kategori</th>
                                <th className="px-5 py-3.5">Skema Tarif</th>
                                <th className="px-5 py-3.5">Harga Satuan</th>
                                <th className="px-5 py-3.5 text-center">Max Qty</th>
                                <th className="px-5 py-3.5 text-center">Status</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredAddons.length > 0 ? (
                                filteredAddons.map((item) => {
                                    const catInfo = CATEGORY_MAP[item.category] || {
                                        label: item.category,
                                        icon: '📦',
                                        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
                                    };

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                                                !item.is_active ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
                                            }`}
                                        >
                                            <td className="px-5 py-4 font-mono font-bold text-slate-400">
                                                #{item.sort_order}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                                                        {addonEmoji(item.icon)}
                                                    </span>
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-black text-slate-900 dark:text-white">
                                                                {item.name}
                                                            </h4>
                                                            <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                {item.code}
                                                            </code>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm">
                                                            {item.description || 'Tidak ada deskripsi'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${catInfo.badgeClass}`}
                                                >
                                                    <span>{catInfo.icon}</span>
                                                    <span>{catInfo.label}</span>
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {item.price_type === 'daily' ? 'Per Hari' : 'Flat (Sekali Sewa)'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-black text-slate-900 tabular-nums dark:text-white">
                                                    {formatMoney(item.price)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {item.max_quantity} unit
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(item)}
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black transition cursor-pointer ${
                                                        item.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                            : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                    title="Klik untuk toggle status aktif"
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            item.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                                        }`}
                                                    />
                                                    <span>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                </button>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                                                        title="Edit item"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteAddonItem(item)}
                                                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 transition"
                                                        title="Hapus item"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                        <span className="text-3xl block mb-2">📦</span>
                                        <p className="font-bold">Belum ada item add-on pada kategori ini.</p>
                                        <p className="text-[11px] mt-1 text-slate-400">
                                            Klik tombol "+ Tambah Add-on" untuk menambahkan item baru.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah / Edit Add-on */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="xl">
                <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-base font-bold text-amber-600 border border-amber-200/60">
                                {editingAddon ? '✏️' : '✨'}
                            </span>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                {editingAddon ? `Edit Add-on: ${editingAddon.name}` : 'Tambah Add-on / Aksesoris Baru'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Kode Add-on */}
                        <div>
                            <InputLabel htmlFor="addon_code" value="Kode Add-on (Unik) *" />
                            <TextInput
                                id="addon_code"
                                type="text"
                                value={form.data.code}
                                onChange={(e) =>
                                    form.setData('code', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                                }
                                placeholder="contoh: baby_seat"
                                disabled={editingAddon !== null}
                                className="mt-1 w-full font-mono text-xs uppercase-none"
                                required
                            />
                            <p className="mt-0.5 text-[10px] text-slate-400">
                                Format huruf kecil & garis bawah (_).
                            </p>
                            <InputError message={form.errors.code} className="mt-1" />
                        </div>

                        {/* Nama Add-on */}
                        <div>
                            <InputLabel htmlFor="addon_name" value="Nama Add-on *" />
                            <TextInput
                                id="addon_name"
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="contoh: Kursi Bayi (Child Seat)"
                                className="mt-1 w-full text-xs"
                                required
                            />
                            <InputError message={form.errors.name} className="mt-1" />
                        </div>

                        {/* Kategori */}
                        <div>
                            <InputLabel htmlFor="addon_category" value="Kategori *" />
                            <Select
                                id="addon_category"
                                value={form.data.category}
                                onChange={(val) => form.setData('category', val)}
                                options={CATEGORY_OPTIONS}
                                className="mt-1 w-full text-xs"
                            />
                            <InputError message={form.errors.category} className="mt-1" />
                        </div>

                        {/* Icon Preset */}
                        <div>
                            <InputLabel htmlFor="addon_icon" value="Pilihan Icon *" />
                            <Select
                                id="addon_icon"
                                value={form.data.icon}
                                onChange={(val) => form.setData('icon', val)}
                                options={ICON_OPTIONS}
                                className="mt-1 w-full text-xs"
                            />
                            <InputError message={form.errors.icon} className="mt-1" />
                        </div>

                        {/* Tipe Tarif */}
                        <div>
                            <InputLabel htmlFor="addon_price_type" value="Skema Perhitungan Tarif *" />
                            <Select
                                id="addon_price_type"
                                value={form.data.price_type}
                                onChange={(val) => form.setData('price_type', val)}
                                options={PRICE_TYPE_OPTIONS}
                                className="mt-1 w-full text-xs"
                            />
                            <InputError message={form.errors.price_type} className="mt-1" />
                        </div>

                        {/* Harga Satuan */}
                        <div>
                            <InputLabel htmlFor="addon_price" value="Harga Satuan (Rp) *" />
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-400">
                                    Rp
                                </span>
                                <MoneyInput
                                    id="addon_price"
                                    value={form.data.price}
                                    onChange={(val) => form.setData('price', val)}
                                    className="w-full pl-10 text-xs font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <InputError message={form.errors.price} className="mt-1" />
                        </div>

                        {/* Maksimal Jumlah Pesanan */}
                        <div>
                            <InputLabel htmlFor="addon_max_qty" value="Maksimal Kuantitas per Booking *" />
                            <TextInput
                                id="addon_max_qty"
                                type="number"
                                min={1}
                                max={20}
                                value={form.data.max_quantity}
                                onChange={(e) => form.setData('max_quantity', parseInt(e.target.value) || 1)}
                                className="mt-1 w-full text-xs"
                                required
                            />
                            <p className="mt-0.5 text-[10px] text-slate-400">
                                Jumlah maksimal yang dapat dipilih pelanggan per mobil.
                            </p>
                            <InputError message={form.errors.max_quantity} className="mt-1" />
                        </div>

                        {/* Urutan Tampil */}
                        <div>
                            <InputLabel htmlFor="addon_sort_order" value="Nomor Urutan Tampil" />
                            <TextInput
                                id="addon_sort_order"
                                type="number"
                                min={0}
                                value={form.data.sort_order}
                                onChange={(e) => form.setData('sort_order', parseInt(e.target.value) || 0)}
                                className="mt-1 w-full text-xs"
                            />
                            <InputError message={form.errors.sort_order} className="mt-1" />
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <InputLabel htmlFor="addon_description" value="Deskripsi Fasilitas / Layanan" />
                        <textarea
                            id="addon_description"
                            rows={3}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="Deskripsi keunggulan atau fasilitas yang didapatkan pelanggan saat memesan item ini..."
                            className="mt-1 w-full rounded-xl border-slate-300 shadow-2xs text-xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <InputError message={form.errors.description} className="mt-1" />
                    </div>

                    {/* Checkbox Aktif */}
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            id="addon_is_active"
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="addon_is_active" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Aktifkan item ini (dapat langsung dipesan oleh pelanggan)
                        </label>
                    </div>

                    {/* Form Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            Batal
                        </button>
                        <PrimaryButton
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl px-5 py-2 text-xs font-black"
                        >
                            {form.processing ? 'Menyimpan...' : editingAddon ? 'Simpan Perubahan' : 'Tambah Add-on'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal show={deleteAddonItem !== null} onClose={() => setDeleteAddonItem(null)} maxWidth="sm">
                <div className="p-6 text-center space-y-4">
                    <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-600 border border-rose-200/80">
                        🗑️
                    </span>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Hapus Item Add-on?
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Apakah Anda yakin ingin menghapus <strong>{deleteAddonItem?.name}</strong>? Item ini tidak akan lagi muncul di katalog pemesanan.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeleteAddonItem(null)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 transition shadow-xs"
                        >
                            Hapus Sekarang
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
