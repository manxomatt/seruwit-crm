import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PlanForm, { PlanFormData } from './Form';
import { useTrans } from '@/hooks/useTrans';
import { Head } from '@inertiajs/react';

type ModuleTier = 'vertical' | 'foundation' | 'content';

interface AvailableModule {
    key: string;
    label: string;
    description: string;
    tier: ModuleTier;
    is_enabled: boolean;
    requires?: string[];
}

interface Props {
    plan: PlanFormData;
    availableModules: AvailableModule[];
}

export default function Edit({ plan, availableModules }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <DynamicLayout header={<PageHeader title={t('plans.pages.index.modal_edit_title', { name: plan.name })} />}>
            <Head title={t('plans.pages.index.modal_edit_title', { name: plan.name })} />

            <div className="space-y-6">
                <PlanForm
                    initialData={plan}
                    availableModules={availableModules}
                    isEdit={true}
                />
            </div>
        </DynamicLayout>
    );
}
