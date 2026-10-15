import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

interface ExpenseItem {
    id: number;
    category: string;
    amount: number;
    date: string;
    receipt_number: string | null;
    description: string | null;
}

interface Props {
    dutyOrder: {
        id: number;
        duty_order_number: string;
        origin: string;
        destination: string;
        departure_date: string;
        return_date: string;
        departure_time: string | null;
        return_time: string | null;
        passenger_name: string | null;
        passenger_phone: string | null;
        status: string;
        cash_advance_amount: number;
        cash_advance_notes: string | null;
        actual_expense_total: number;
        net_balance: number;
        standard_hours_per_day: number;
        actual_hours_worked: number;
        overtime_hours: number;
        notes: string | null;
        driver?: {
            name: string;
            phone: string | null;
            license_number: string | null;
            license_type: string | null;
        };
        vehicle?: {
            name: string;
            plate_number: string;
            type: string | null;
            brand: string | null;
            model: string | null;
        };
        rental?: {
            code: string;
            partner?: {
                name: string;
                phone: string | null;
            };
        };
        creator?: {
            name: string;
        };
        cashAdvancePayer?: {
            name: string;
        };
        expenses: ExpenseItem[];
    };
    company: {
        name: string;
        address: string;
        phone: string;
        email: string;
    };
}

export default function DutyOrderPrint({ dutyOrder, company }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    return (
        <div className="bg-white text-black min-h-screen p-8 print:p-0 font-sans text-sm">
            <Head title={`SPPD ${dutyOrder.duty_order_number}`} />

            {/* Print Controls (Hidden on Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden bg-slate-100 p-4 rounded-lg border border-slate-200">
                <div className="text-sm text-slate-700">
                    Dokumen siap dicetak. Gunakan orientasi <strong>Portrait</strong> dan kertas <strong>A4</strong>.
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
                    >
                        🖨️ Cetak SPPD Sekarang
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="px-4 py-2 bg-slate-300 text-slate-800 rounded font-medium hover:bg-slate-400 transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Document Body (A4 Style) */}
            <div className="max-w-4xl mx-auto border border-slate-300 print:border-none p-8 print:p-0">
                {/* Kop Surat / Letterhead */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                    <div>
                        <h1 className="text-xl font-bold tracking-wider uppercase text-black">
                            {company.name || 'SERUWIT RENTAL CAR'}
                        </h1>
                        <p className="text-xs text-slate-700 mt-1 max-w-md">
                            {company.address || 'Layanan Rental Mobil & Perjalanan Dinas Profesional'}
                        </p>
                        <p className="text-xs text-slate-700">
                            {company.phone && `Telp/WA: ${company.phone}`} {company.email && `• Email: ${company.email}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase text-slate-500 font-semibold">Nomor SPPD:</div>
                        <div className="text-base font-bold font-mono text-black">{dutyOrder.duty_order_number}</div>
                        {dutyOrder.rental && (
                            <div className="text-xs text-slate-600 mt-0.5 font-mono">Ref Booking: {dutyOrder.rental.code}</div>
                        )}
                    </div>
                </div>

                {/* Judul Dokumen */}
                <div className="text-center my-6">
                    <h2 className="text-lg font-bold uppercase tracking-wider underline">
                        SURAT PERINTAH PERJALANAN DINAS (SPPD)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                        Surat Penugasan Pengemudi & Pencairan Uang Muka Operasional
                    </p>
                </div>

                {/* Bagian 1: Pejabat & Pengemudi */}
                <div className="space-y-4">
                    <table className="w-full text-xs border border-collapse border-black">
                        <tbody>
                            <tr>
                                <td className="w-1/3 p-2 font-semibold bg-slate-100 border border-black">1. Yang Menugaskan / Pemberi Perintah</td>
                                <td className="p-2 border border-black">{dutyOrder.creator?.name || 'Bagian Operasional / Dispatch'}</td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">2. Nama Pengemudi yang Ditugaskan</td>
                                <td className="p-2 border border-black font-bold text-sm">{dutyOrder.driver?.name}</td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">3. Nomor SIM & HP Pengemudi</td>
                                <td className="p-2 border border-black">
                                    SIM {dutyOrder.driver?.license_type || 'A'}: {dutyOrder.driver?.license_number || '-'} • HP: {dutyOrder.driver?.phone || '-'}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">4. Kendaraan & Nomor Polisi</td>
                                <td className="p-2 border border-black font-semibold">
                                    {dutyOrder.vehicle?.plate_number} — {dutyOrder.vehicle?.name} ({dutyOrder.vehicle?.type || 'Mobil'})
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">5. Tempat Berangkat & Tempat Tujuan</td>
                                <td className="p-2 border border-black font-semibold">
                                    Dari: <span className="underline">{dutyOrder.origin}</span> ➔ Ke: <span className="underline">{dutyOrder.destination}</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">6. Jadwal Penugasan Perjalanan</td>
                                <td className="p-2 border border-black">
                                    Berangkat: <strong>{dutyOrder.departure_date}</strong> ({dutyOrder.departure_time || '08:00'}) s/d Pulang: <strong>{dutyOrder.return_date}</strong> ({dutyOrder.return_time || '20:00'})
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">7. Tamu / Penumpang yang Diantar</td>
                                <td className="p-2 border border-black">
                                    {dutyOrder.passenger_name || dutyOrder.rental?.partner?.name || '-'} {dutyOrder.passenger_phone ? `(${dutyOrder.passenger_phone})` : ''}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">8. Uang Muka Operasional (Uang Jalan)</td>
                                <td className="p-2 border border-black">
                                    <div className="font-bold text-sm">{formatCurrency(dutyOrder.cash_advance_amount)}</div>
                                    <div className="text-[11px] text-slate-600 mt-0.5">Alokasi: {dutyOrder.cash_advance_notes || 'BBM, E-Toll, Uang Makan, Parkir'}</div>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-slate-100 border border-black">9. Ketentuan Lembur & Jam Kerja</td>
                                <td className="p-2 border border-black">
                                    Standar {dutyOrder.standard_hours_per_day} Jam/Hari. Kelebihan jam diperhitungkan sesuai SOP rental.
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Instruksi Khusus */}
                    {dutyOrder.notes && (
                        <div className="border border-black p-3 text-xs">
                            <span className="font-semibold block mb-1">Instruksi Khusus & Catatan Perjalanan:</span>
                            <p className="whitespace-pre-line text-slate-800">{dutyOrder.notes}</p>
                        </div>
                    )}

                    {/* Kewajiban Pengemudi */}
                    <div className="text-[11px] text-slate-700 space-y-1 bg-slate-50 p-3 border border-slate-300">
                        <div className="font-semibold text-black">PERHATIAN BAGI PENGEMUDI:</div>
                        <ol className="list-decimal pl-4 space-y-0.5">
                            <li>Wajib memeriksa kelengkapan kendaraan (oli, air radiator, tekanan ban, STNK) sebelum jalan.</li>
                            <li>Wajib meminta dan menyimpan semua nota / struk resmi untuk setiap pengeluaran BBM, E-Toll, parkir.</li>
                            <li>Wajib mengembalikan sisa uang jalan ke kasir segera setelah penugasan selesai dan melakukan settlement nota.</li>
                            <li>Mengutamakan keselamatan berkendara (Safety Driving) dan kenyamanan tamu pengguna jasa.</li>
                        </ol>
                    </div>

                    {/* Lembar Tanda Tangan */}
                    <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs">
                        <div>
                            <p className="text-slate-600">Disetujui Oleh,</p>
                            <p className="font-semibold text-black mt-0.5">Pimpinan / Dispatcher</p>
                            <div className="h-16"></div>
                            <p className="font-semibold underline">({dutyOrder.creator?.name || 'Bagian Operasional'})</p>
                        </div>

                        <div>
                            <p className="text-slate-600">Dikeluarkan Oleh,</p>
                            <p className="font-semibold text-black mt-0.5">Kasir / Keuangan</p>
                            <div className="h-16"></div>
                            <p className="font-semibold underline">({dutyOrder.cashAdvancePayer?.name || 'Kasir Keuangan'})</p>
                        </div>

                        <div>
                            <p className="text-slate-600">Diterima Oleh,</p>
                            <p className="font-semibold text-black mt-0.5">Pengemudi Bertugas</p>
                            <div className="h-16"></div>
                            <p className="font-semibold underline">({dutyOrder.driver?.name || 'Pengemudi'})</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
