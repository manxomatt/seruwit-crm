import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import SalesNav from '../../../../SalesNav';
import PageHeader from '@/Components/PageHeader';

interface Props {
    priceLists: {
        data: Array<{
            id: number;
            name: string;
            code: string | null;
            is_active: boolean;
            items_count: number;
        }>;
    };
    can: { create: boolean; update: boolean };
}

export default function Index({ priceLists, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('sales.price_lists.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('sales.price-lists.create')}>
                            <PrimaryButton>{t('sales.price_lists.new')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('sales.price_lists.title')} />
            <SalesNav />
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('sales.fields.name')}</th>
                            <th className="px-4 py-3">{t('sales.fields.code')}</th>
                            <th className="px-4 py-3">{t('sales.fields.status')}</th>
                            <th className="px-4 py-3 text-right">{t('sales.price_lists.items')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {priceLists.data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    {t('sales.price_lists.empty')}
                                </td>
                            </tr>
                        )}
                        {priceLists.data.map((list) => (
                            <tr key={list.id} className="border-b">
                                <td className="px-4 py-3">
                                    <Link
                                        href={prefixedRoute('sales.price-lists.show', list.id)}
                                        className="font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        {list.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{list.code ?? '—'}</td>
                                <td className="px-4 py-3">
                                    {list.is_active
                                        ? t('sales.price_lists.active')
                                        : t('sales.price_lists.inactive')}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">{list.items_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}
