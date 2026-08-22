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
    requires?: string[];
}

interface SubscriptionTier {
    id: number;
    name: string;
    min_vehicles: number;
    max_vehicles: number;
    price_per_vehicle: number;
}

interface Props {
    nextSortOrder: number;
    availableModules: AvailableModule[];
    subscriptionTiers: SubscriptionTier[];
}

export default function Create({ nextSortOrder, availableModules, subscriptionTiers }: Props): JSX.Element {
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
        trial_days: 0,
        pricing_model: 'fixed',
        subscription_tier_id: null,
        allow_payg_upgrade: true,
        include_trial: true,
        trial_duration_days: 30,
    };

    return (
        <DynamicLayout header={<PageHeader title={t('plans.pages.index.modal_create_title')} />}>
            <Head title={t('plans.pages.index.modal_create_title')} />

            <div className="space-y-6">
                <PlanForm
                    initialData={initialData}
                    availableModules={availableModules}
                    subscriptionTiers={subscriptionTiers}
                    isEdit={false}
                />
            </div>
        </DynamicLayout>
    );
}
