import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import OrdersNav from '../../../OrdersNav';

interface Settings {
    auto_confirm_do_from_gin: boolean;
    require_pod_before_trip_complete: string;
}

interface Props {
    settings: Settings;
}

export default function Edit({ settings }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        auto_confirm_do_from_gin: settings.auto_confirm_do_from_gin,
        require_pod_before_trip_complete: settings.require_pod_before_trip_complete,
    });

    const podModeOptions = [
        { value: 'off', label: t('orders.settings.require_pod_off') },
        { value: 'from_gin', label: t('orders.settings.require_pod_from_gin') },
        { value: 'all', label: t('orders.settings.require_pod_all') },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('orders.settings.update'), { preserveScroll: true });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('orders.settings.head')} />}>
            <Head title={t('orders.settings.head')} />
            <OrdersNav />

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900">{t('orders.settings.section')}</h2>
                    <p className="mt-1 text-sm text-gray-500">{t('orders.settings.section_hint')}</p>

                    <div className="mt-4 space-y-4">
                        <label className="flex items-start gap-3">
                            <Checkbox
                                checked={data.auto_confirm_do_from_gin}
                                onChange={(e) => setData('auto_confirm_do_from_gin', e.target.checked)}
                            />
                            <span>
                                <span className="block text-sm font-medium text-gray-900">{t('orders.settings.auto_confirm_do_from_gin')}</span>
                                <span className="mt-0.5 block text-xs text-gray-500">{t('orders.settings.auto_confirm_do_from_gin_hint')}</span>
                            </span>
                        </label>

                        <div>
                            <InputLabel
                                htmlFor="require_pod_before_trip_complete"
                                value={t('orders.settings.require_pod_before_trip_complete')}
                            />
                            <Select
                                id="require_pod_before_trip_complete"
                                className="mt-1 w-full"
                                value={data.require_pod_before_trip_complete}
                                onChange={(value) => setData('require_pod_before_trip_complete', value)}
                                options={podModeOptions}
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('orders.settings.require_pod_hint')}</p>
                            <InputError message={errors.require_pod_before_trip_complete} className="mt-1" />
                        </div>
                    </div>
                </section>

                <div className="flex items-center gap-3">
                    <PrimaryButton disabled={processing}>{t('orders.settings.save')}</PrimaryButton>
                    {recentlySuccessful && (
                        <span className="text-sm text-green-600">{t('orders.messages.settings_updated')}</span>
                    )}
                </div>
            </form>
        </DynamicLayout>
    );
}
