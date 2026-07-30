import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ShuttleNav from '../ShuttleNav';

interface Corridor {
    id: number;
    code: string;
    name: string;
    origin_city: string;
    destination_city: string;
    base_fare: string | number;
    is_active: boolean;
}

interface Props {
    corridors: {
        data: Corridor[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { search: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

const money = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

export default function Index({ corridors, filters, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('shuttle.corridors.index'), { search }, { preserveState: true });
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.corridors.title')}</h2>}>
            <Head title={t('shuttle.corridors.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <ShuttleNav active="corridors" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <form onSubmit={submit} className="flex gap-2">
                            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
                            <PrimaryButton type="submit">Search</PrimaryButton>
                        </form>
                        {can.create && (
                            <Link href={prefixedRoute('shuttle.corridors.create')}>
                                <PrimaryButton type="button">{t('shuttle.corridors.create')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">{t('shuttle.corridors.code')}</th>
                                    <th className="px-4 py-2">{t('shuttle.corridors.name')}</th>
                                    <th className="px-4 py-2">{t('shuttle.corridors.base_fare')}</th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {corridors.data.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-4 py-2 font-medium">{c.code}</td>
                                        <td className="px-4 py-2">
                                            {c.name}
                                            <div className="text-xs text-gray-500">
                                                {c.origin_city} → {c.destination_city}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">{money(c.base_fare)}</td>
                                        <td className="px-4 py-2 text-right">
                                            {can.update && (
                                                <Link
                                                    href={prefixedRoute('shuttle.corridors.edit', c.id)}
                                                    className="text-sky-700 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
