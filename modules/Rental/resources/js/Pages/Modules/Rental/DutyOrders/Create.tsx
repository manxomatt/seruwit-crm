import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select, { type SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, FormEventHandler } from 'react';

interface DriverItem {
    id: number;
    name: string;
    phone: string | null;
    status: string;
}

interface VehicleItem {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
}

interface RentalItem {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    partner?: {
        id: number;
        name: string;
        phone: string | null;
    };
    vehicle?: {
        id: number;
        name: string;
        plate_number: string;
    };
    driver?: {
        id: number;
        name: string;
        phone: string | null;
    };
}

interface Props {
    suggestedNumber: string;
    activeRentals: RentalItem[];
    selectedRental: RentalItem | null;
    drivers: DriverItem[];
    vehicles: VehicleItem[];
}

export default function DutyOrderCreate({
    suggestedNumber,
    activeRentals,
    selectedRental,
    drivers,
    vehicles,
}: Props) {
    const { routePrefix } = useRoutePrefix();

    const { data, setData, post, processing, errors } = useForm({
        duty_order_number: suggestedNumber,
        rental_id: selectedRental ? String(selectedRental.id) : '',
        driver_id: selectedRental?.driver?.id ? String(selectedRental.driver.id) : '',
        vehicle_id: selectedRental?.vehicle?.id ? String(selectedRental.vehicle.id) : '',
        origin: 'Pool Rental',
        destination: '',
        departure_date: selectedRental?.start_date ? selectedRental.start_date.substring(0, 10) : new Date().toISOString().substring(0, 10),
        return_date: selectedRental?.end_date ? selectedRental.end_date.substring(0, 10) : new Date().toISOString().substring(0, 10),
        departure_time: '08:00',
        return_time: '20:00',
        passenger_name: selectedRental?.partner?.name || '',
        passenger_phone: selectedRental?.partner?.phone || '',
        cash_advance_amount: '',
        cash_advance_notes: '',
        standard_hours_per_day: 12,
        driver_overtime_rate_per_hour: '25000',
        customer_overtime_rate_per_hour: '50000',
        notes: '',
    });

    const handleRentalChange = (rentalIdStr: string) => {
        setData((prev) => {
            const next = { ...prev, rental_id: rentalIdStr };
            if (!rentalIdStr) return next;

            const r = activeRentals.find((item) => String(item.id) === rentalIdStr);
            if (r) {
                if (r.driver?.id) {
                    next.driver_id = String(r.driver.id);
                }
                if (r.vehicle?.id) {
                    next.vehicle_id = String(r.vehicle.id);
                }
                if (r.start_date) {
                    next.departure_date = r.start_date.substring(0, 10);
                }
                if (r.end_date) {
                    next.return_date = r.end_date.substring(0, 10);
                }
                if (r.partner?.name) {
                    next.passenger_name = r.partner.name;
                }
                if (r.partner?.phone) {
                    next.passenger_phone = r.partner.phone;
                }
            }
            return next;
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route(`${routePrefix}.rental.duty_orders.store`));
    };

    const rentalOptions: SelectOption[] = useMemo(() => [
        { value: '', label: '-- Tanpa Booking Rental (Surat Jalan Mandiri / Operasional) --' },
        ...activeRentals.map((r) => ({
            value: String(r.id),
            label: `${r.code} - ${r.partner?.name || 'Tamu'} (${r.vehicle?.plate_number || 'Unit'})`,
        })),
    ], [activeRentals]);

    const driverOptions: SelectOption[] = useMemo(() => [
        { value: '', label: '-- Pilih Pengemudi --' },
        ...drivers.map((d) => ({
            value: String(d.id),
            label: `${d.name} (${d.phone || 'No HP -'})`,
        })),
    ], [drivers]);

    const vehicleOptions: SelectOption[] = useMemo(() => [
        { value: '', label: '-- Pilih Kendaraan --' },
        ...vehicles.map((v) => ({
            value: String(v.id),
            label: `${v.plate_number} - ${v.name}`,
        })),
    ], [vehicles]);

    return (
        <DynamicLayout>
            <Head title="Buat Surat Jalan Operasional (SJO)" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href={route(`${routePrefix}.rental.duty_orders.index`)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                        <span>←</span> Kembali ke Daftar Surat Jalan
                    </Link>
                </div>

                <PageHeader
                    title="Terbitkan Surat Jalan Operasional (SJO)"
                    subtitle="Isi rincian penugasan pengemudi, estimasi kas jalan (UJO: BBM, e-toll, makan), dan batas jam kerja."
                />

                <form onSubmit={submit} className="space-y-6">
                    {/* Booking Connection */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>🔗</span> Hubungkan dengan Rental Booking (Opsional)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Pilih booking rental aktif untuk otomatis mengisi pengemudi, armada kendaraan, jadwal perjalanan, dan data penumpang.
                        </p>
                        <div>
                            <InputLabel htmlFor="rental_id" value="Pilih Booking Rental" />
                            <Select
                                value={data.rental_id}
                                options={rentalOptions}
                                onChange={handleRentalChange}
                            />
                            <InputError message={errors.rental_id} className="mt-1" />
                        </div>
                    </div>

                    {/* Penugasan Supir & Armada */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>👨‍✈️</span> Identitas Penugasan & Nomor Surat Jalan
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <InputLabel htmlFor="duty_order_number" value="Nomor Surat Jalan *" />
                                <TextInput
                                    id="duty_order_number"
                                    value={data.duty_order_number}
                                    onChange={(e) => setData('duty_order_number', e.target.value)}
                                    className="w-full font-mono text-sm"
                                    required
                                />
                                <InputError message={errors.duty_order_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="driver_id" value="Pengemudi yang Ditugaskan *" />
                                <Select
                                    value={data.driver_id}
                                    options={driverOptions}
                                    onChange={(val) => setData('driver_id', val)}
                                />
                                <InputError message={errors.driver_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="vehicle_id" value="Kendaraan Operasional *" />
                                <Select
                                    value={data.vehicle_id}
                                    options={vehicleOptions}
                                    onChange={(val) => setData('vehicle_id', val)}
                                />
                                <InputError message={errors.vehicle_id} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Rute & Jadwal Perjalanan */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>📍</span> Rute & Jadwal Perjalanan
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="origin" value="Titik Berangkat / Kota Asal *" />
                                <TextInput
                                    id="origin"
                                    placeholder="Contoh: Pool Rental / Bandara Radin Inten"
                                    value={data.origin}
                                    onChange={(e) => setData('origin', e.target.value)}
                                    className="w-full text-sm"
                                    required
                                />
                                <InputError message={errors.origin} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="destination" value="Titik Tujuan / Destinasi *" />
                                <TextInput
                                    id="destination"
                                    placeholder="Contoh: Krui Pesisir Barat / Bakauheni / Jakarta"
                                    value={data.destination}
                                    onChange={(e) => setData('destination', e.target.value)}
                                    className="w-full text-sm"
                                    required
                                />
                                <InputError message={errors.destination} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <InputLabel htmlFor="departure_date" value="Tgl Berangkat *" />
                                    <TextInput
                                        id="departure_date"
                                        type="date"
                                        value={data.departure_date}
                                        onChange={(e) => setData('departure_date', e.target.value)}
                                        className="w-full text-sm"
                                        required
                                    />
                                    <InputError message={errors.departure_date} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="departure_time" value="Jam Berangkat" />
                                    <TextInput
                                        id="departure_time"
                                        type="time"
                                        value={data.departure_time}
                                        onChange={(e) => setData('departure_time', e.target.value)}
                                        className="w-full text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <InputLabel htmlFor="return_date" value="Tgl Rencana Pulang *" />
                                    <TextInput
                                        id="return_date"
                                        type="date"
                                        value={data.return_date}
                                        onChange={(e) => setData('return_date', e.target.value)}
                                        className="w-full text-sm"
                                        required
                                    />
                                    <InputError message={errors.return_date} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="return_time" value="Jam Pulang" />
                                    <TextInput
                                        id="return_time"
                                        type="time"
                                        value={data.return_time}
                                        onChange={(e) => setData('return_time', e.target.value)}
                                        className="w-full text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="passenger_name" value="Nama Tamu / Penumpang Utama" />
                                <TextInput
                                    id="passenger_name"
                                    placeholder="Contoh: Bpk. Ahmad Dahlan"
                                    value={data.passenger_name}
                                    onChange={(e) => setData('passenger_name', e.target.value)}
                                    className="w-full text-sm"
                                />
                                <InputError message={errors.passenger_name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="passenger_phone" value="No. Telepon / WhatsApp Tamu" />
                                <TextInput
                                    id="passenger_phone"
                                    placeholder="Contoh: 0812-xxxx-xxxx"
                                    value={data.passenger_phone}
                                    onChange={(e) => setData('passenger_phone', e.target.value)}
                                    className="w-full text-sm"
                                />
                                <InputError message={errors.passenger_phone} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Uang Jalan (Cash Advance) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>💵</span> Kas Jalan Operasional (UJO / Cash Advance)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Dana tunai / transfer yang diberikan kasir kepada supir sebelum berangkat untuk keperluan BBM, E-Toll, uang makan, dan parkir.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="cash_advance_amount" value="Nominal Kas Jalan (Rp)" />
                                <TextInput
                                    id="cash_advance_amount"
                                    type="number"
                                    placeholder="Contoh: 750000"
                                    value={data.cash_advance_amount}
                                    onChange={(e) => setData('cash_advance_amount', e.target.value)}
                                    className="w-full font-semibold text-emerald-600 dark:text-emerald-400 text-sm"
                                />
                                <InputError message={errors.cash_advance_amount} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="cash_advance_notes" value="Rincian Alokasi Kas Jalan" />
                                <TextInput
                                    id="cash_advance_notes"
                                    placeholder="Contoh: BBM Rp 400rb, Tol Rp 250rb, Uang Makan Rp 100rb"
                                    value={data.cash_advance_notes}
                                    onChange={(e) => setData('cash_advance_notes', e.target.value)}
                                    className="w-full text-sm"
                                />
                                <InputError message={errors.cash_advance_notes} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Lembur & Ketentuan */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>⏱️</span> Pengaturan Jam Kerja & Tarif Lembur
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <InputLabel htmlFor="standard_hours_per_day" value="Batas Jam Kerja Harian (Jam)" />
                                <TextInput
                                    id="standard_hours_per_day"
                                    type="number"
                                    value={data.standard_hours_per_day}
                                    onChange={(e) => setData('standard_hours_per_day', Number(e.target.value))}
                                    className="w-full text-sm"
                                />
                                <div className="text-[11px] text-slate-400 mt-1">Standar rental umumnya 12 jam/hari</div>
                            </div>

                            <div>
                                <InputLabel htmlFor="driver_overtime_rate_per_hour" value="Upah Lembur Supir / Jam (Rp)" />
                                <TextInput
                                    id="driver_overtime_rate_per_hour"
                                    type="number"
                                    value={data.driver_overtime_rate_per_hour}
                                    onChange={(e) => setData('driver_overtime_rate_per_hour', e.target.value)}
                                    className="w-full text-sm"
                                />
                                <div className="text-[11px] text-slate-400 mt-1">Hak yang dibayarkan ke supir</div>
                            </div>

                            <div>
                                <InputLabel htmlFor="customer_overtime_rate_per_hour" value="Tarif Lembur ke Tamu / Jam (Rp)" />
                                <TextInput
                                    id="customer_overtime_rate_per_hour"
                                    type="number"
                                    value={data.customer_overtime_rate_per_hour}
                                    onChange={(e) => setData('customer_overtime_rate_per_hour', e.target.value)}
                                    className="w-full text-sm"
                                />
                                <div className="text-[11px] text-slate-400 mt-1">Biaya yang ditagihkan ke penyewa</div>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Catatan Tambahan & Instruksi Khusus" />
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Tulis instruksi khusus seperti: pakaian rapi berkerah, bawa payung, supir stand by di lobi..."
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Link href={route(`${routePrefix}.rental.duty_orders.index`)}>
                            <SecondaryButton disabled={processing}>Batal</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" disabled={processing} className="px-6">
                            {processing ? 'Menyimpan...' : 'Terbitkan Surat Jalan & Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
