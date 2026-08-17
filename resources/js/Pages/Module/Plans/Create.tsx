import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PlanForm from './Form';
import { useTrans } from '@/hooks/useTrans';
import { Head } from '@inertiajs/react';

type ModuleTier = 'vertical' | 'foundation' | 'content';

interface AvailableModule {
    key: string;
    label: string;
    description: string;
    tier: ModuleTier;
    is_enabled: boolean;
}

interface Props {
    nextSortOrder: number;
    availableModules: AvailableModule[];
}

export default function Create({ nextSortOrder, availableModules }: Props): JSX.Element {
    const { t } = useTrans();

    const initialData = {
        key: '',
        name: '',
        description: '',
        modules: [],
        sort_order: nextSortOrder,
        is_default: false,
        price: '',
        original_price: '',
        annual_price: '',
        annual_original_price: '',
        currency: 'IDR',
    };

    return (
        <DynamicLayout header={<PageHeader title={t('plans.pages.index.modal_create_title')} />}>
            <Head title={t('plans.pages.index.modal_create_title')} />

            <div className="space-y-6">
                <PlanForm
                    initialData={initialData}
                    availableModules={availableModules}
                    isEdit={false}
                />
            </div>
        </DynamicLayout>
    );
}
