import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface OrderRow {
    id: number;
    code: string;
    delivery_address: string;
    delivery_lat: string | number | null;
    delivery_lng: string | number | null;
    demand_kg: string | number | null;
    partner: { id: number; name: string } | null;
}

interface Props {
    defaults: {
        planned_date: string;
        objective: string;
        depot_address: string;
        depot_lat: number;
        depot_lng: number;
    };
    orders: OrderRow[];
    eligible_counts: {
        geocoded: number;
        missing_coords: number;
        vehicles: number;
        drivers: number;
    };
}

const OBJECTIVES = ['fuel_cost', 'distance'] as const;

export default function Create({ defaults, orders, eligible_counts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const geocodedIds = orders.filter((o) => o.delivery_lat !== null && o.delivery_lng !== null).map((o) => o.id);

    const { data, setData, post, processing, errors } = useForm({
        planned_date: defaults.planned_date,
        objective: defaults.objective,
        depot_address: defaults.depot_address,
        depot_lat: String(defaults.depot_lat),
        depot_lng: String(defaults.depot_lng),
        delivery_order_ids: geocodedIds as number[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('routing.plans.store'));
    };

    const reloadOrders = (date: string): void => {
        setData('planned_date', date);
        router.get(
            prefixedRoute('routing.plans.create'),
            { planned_date: date },
            { preserveState: true, only: ['orders', 'eligible_counts', 'defaults'] },
        );
    };

    const toggleOrder = (id: number): void => {
        if (data.delivery_order_ids.includes(id)) {
            setData(
                'delivery_order_ids',
                data.delivery_order_ids.filter((x) => x !== id),
            );
        } else {
            setData('delivery_order_ids', [...data.delivery_order_ids, id]);
        }
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('routing.pages.create.title')}</h2>}>
            <Head title={t('routing.pages.create.title')} />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.geocoded_dos')}</div>
                            <div className="text-lg font-semibold text-gray-900">{eligible_counts.geocoded}</div>
                        </div>
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.missing_coords')}</div>
                            <div className="text-lg font-semibold text-amber-700">{eligible_counts.missing_coords}</div>
                        </div>
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.active_vehicles')}</div>
                            <div className="text-lg font-semibold text-gray-900">{eligible_counts.vehicles}</div>
                        </div>
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.available_drivers')}</div>
                            <div className="text-lg font-semibold text-gray-900">{eligible_counts.drivers}</div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-6 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="planned_date" value={t('routing.fields.plan_date')} />
                                <TextInput
                                    id="planned_date"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.planned_date}
                                    onChange={(e) => reloadOrders(e.target.value)}
                                    required
                                />
                                <InputError message={errors.planned_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="objective" value={t('routing.fields.objective')} />
                                <Select
                                    id="objective"
                                    className="mt-1"
                                    value={data.objective}
                                    onChange={(value) => setData('objective', value)}
                                    options={OBJECTIVES.map((objective) => ({
                                        value: objective,
                                        label: t(`routing.objective.${objective}`),
                                    }))}
                                />
                                <InputError message={errors.objective} className="mt-2" />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="depot_address" value={t('routing.fields.depot_address')} />
                                <TextInput
                                    id="depot_address"
                                    className="mt-1 block w-full"
                                    value={data.depot_address}
                                    onChange={(e) => setData('depot_address', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="depot_lat" value={t('routing.fields.depot_lat')} />
                                <TextInput
                                    id="depot_lat"
                                    className="mt-1 block w-full"
                                    value={data.depot_lat}
                                    onChange={(e) => setData('depot_lat', e.target.value)}
                                    required
                                />
                                <InputError message={errors.depot_lat} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="depot_lng" value={t('routing.fields.depot_lng')} />
                                <TextInput
                                    id="depot_lng"
                                    className="mt-1 block w-full"
                                    value={data.depot_lng}
                                    onChange={(e) => setData('depot_lng', e.target.value)}
                                    required
                                />
                                <InputError message={errors.depot_lng} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-medium text-gray-900">{t('routing.pages.create.orders_section')}</h3>
                            <p className="mb-3 text-xs text-gray-500">{t('routing.pages.create.orders_hint')}</p>
                            <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200">
                                {orders.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-gray-500">{t('routing.pages.create.orders_empty')}</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {orders.map((order) => {
                                            const hasCoords = order.delivery_lat !== null && order.delivery_lng !== null;
                                            return (
                                                <li key={order.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1"
                                                        disabled={!hasCoords}
                                                        checked={data.delivery_order_ids.includes(order.id)}
                                                        onChange={() => toggleOrder(order.id)}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {order.code}
                                                            {order.partner ? ` · ${order.partner.name}` : ''}
                                                        </div>
                                                        <div className="truncate text-gray-600">{order.delivery_address}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {hasCoords
                                                                ? `${order.delivery_lat}, ${order.delivery_lng} · ${order.demand_kg ?? 1} kg`
                                                                : t('routing.pages.create.missing_coordinates')}
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                            <InputError message={errors.delivery_order_ids} className="mt-2" />
                        </div>

                        <div className="flex gap-3">
                            <PrimaryButton disabled={processing || data.delivery_order_ids.length === 0}>
                                {t('routing.actions.optimize_routes')}
                            </PrimaryButton>
                            <Link href={prefixedRoute('routing.plans.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
        </DynamicLayout>
    );
}
