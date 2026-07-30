import PrimaryButton from '@/Components/PrimaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TextInput from '@/Components/TextInput';
import ShuttleNav from '../ShuttleNav';

interface Schedule {
    id: number;
    code: string;
    days_of_week: number[];
    departure_time: string;
    seat_capacity: number;
    is_active: boolean;
    corridor?: { name: string; code: string } | null;
    vehicle?: { name: string; plate_number: string } | null;
}

interface Props {
    schedules: { data: Schedule[] };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ schedules, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [generateId, setGenerateId] = useState<number | null>(null);
    const generateForm = useForm({ from: '', to: '' });

    const submitGenerate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!generateId) return;
        generateForm.post(prefixedRoute('shuttle.schedules.generate', generateId), {
            onSuccess: () => setGenerateId(null),
        });
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.schedules.title')}</h2>}>
            <Head title={t('shuttle.schedules.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <ShuttleNav active="schedules" />
                    <div className="flex justify-end">
                        {can.create && (
                            <Link href={prefixedRoute('shuttle.schedules.create')}>
                                <PrimaryButton type="button">{t('shuttle.schedules.create')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">{t('shuttle.schedules.code')}</th>
                                    <th className="px-4 py-2">{t('shuttle.schedules.corridor')}</th>
                                    <th className="px-4 py-2">{t('shuttle.schedules.days')}</th>
                                    <th className="px-4 py-2">{t('shuttle.schedules.departure_time')}</th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {schedules.data.map((s) => (
                                    <tr key={s.id}>
                                        <td className="px-4 py-2 font-medium">{s.code}</td>
                                        <td className="px-4 py-2">{s.corridor?.name}</td>
                                        <td className="px-4 py-2">
                                            {(s.days_of_week ?? []).map((d) => t(`shuttle.days.${d}`)).join(', ')}
                                        </td>
                                        <td className="px-4 py-2">{String(s.departure_time).slice(0, 5)}</td>
                                        <td className="space-x-3 px-4 py-2 text-right">
                                            {can.create && (
                                                <button
                                                    type="button"
                                                    className="text-sky-700 hover:underline"
                                                    onClick={() => setGenerateId(s.id)}
                                                >
                                                    {t('shuttle.schedules.generate')}
                                                </button>
                                            )}
                                            {can.update && (
                                                <Link
                                                    href={prefixedRoute('shuttle.schedules.edit', s.id)}
                                                    className="text-sky-700 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                            {can.delete && (
                                                <button
                                                    type="button"
                                                    className="text-red-600 hover:underline"
                                                    onClick={() => {
                                                        if (confirm('Delete schedule?')) {
                                                            router.delete(prefixedRoute('shuttle.schedules.destroy', s.id));
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {generateId && (
                        <form onSubmit={submitGenerate} className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
                            <div>
                                <div className="text-sm text-gray-600">{t('shuttle.schedules.from')}</div>
                                <TextInput type="date" value={generateForm.data.from} onChange={(e) => generateForm.setData('from', e.target.value)} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">{t('shuttle.schedules.to')}</div>
                                <TextInput type="date" value={generateForm.data.to} onChange={(e) => generateForm.setData('to', e.target.value)} />
                            </div>
                            <PrimaryButton disabled={generateForm.processing}>{t('shuttle.schedules.generate')}</PrimaryButton>
                            <button type="button" className="text-sm text-gray-500" onClick={() => setGenerateId(null)}>
                                Cancel
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
