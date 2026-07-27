import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PlanRoutesMap from '@/Components/Map/PlanRoutesMap';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import { Head, Link, router, useForm } from '@inertiajs/react';

interface Stop {
    id: number;
    sequence: number;
    address: string;
    lat: string | number;
    lng: string | number;
    demand_kg: string | number;
    distance_from_previous_km: string | number;
    delivery_order: { id: number; code: string; partner: { name: string } | null } | null;
}

interface RouteRow {
    id: number;
    sequence: number;
    vehicle_id: number | null;
    driver_id: number | null;
    trip_id: number | null;
    load_kg: string | number;
    estimated_distance_km: string | number;
    estimated_cost: string | number;
    vehicle: { id: number; name: string; plate_number: string; capacity_kg: string | number | null; cost_per_km: string | number | null } | null;
    driver: { id: number; name: string } | null;
    stops: Stop[];
}

interface Plan {
    id: number;
    code: string;
    status: string;
    objective: string;
    planned_date: string;
    depot_address: string | null;
    depot_lat: string | number;
    depot_lng: string | number;
    total_distance_km: string | number;
    total_cost: string | number;
    unassigned_count: number;
    routes: RouteRow[];
}

interface Option {
    id: number;
    name: string;
    plate_number?: string;
}

interface Props {
    plan: Plan;
    vehicles: Option[];
    drivers: Option[];
    can: { optimize: boolean; apply: boolean; update: boolean; delete: boolean };
}

function RouteEditor({
    planId,
    route,
    vehicles,
    drivers,
    canUpdate,
}: {
    planId: number;
    route: RouteRow;
    vehicles: Option[];
    drivers: Option[];
    canUpdate: boolean;
}): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing } = useForm({
        vehicle_id: route.vehicle_id ? String(route.vehicle_id) : '',
        driver_id: route.driver_id ? String(route.driver_id) : '',
    });

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div>
                    <h3 className="font-medium text-gray-900">
                        {t('routing.pages.show.route_heading', { sequence: route.sequence })}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {t('routing.pages.show.route_meta', {
                            distance: route.estimated_distance_km,
                            cost: route.estimated_cost,
                            load: route.load_kg,
                        })}
                        {route.trip_id ? t('routing.pages.show.route_trip', { id: route.trip_id }) : ''}
                    </p>
                </div>
                {canUpdate && (
                    <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            patch(prefixedRoute('routing.plans.routes.update', [planId, route.id]));
                        }}
                    >
                        <div>
                            <label className="block text-xs text-gray-500">{t('routing.fields.vehicle')}</label>
                            <Select
                                className="mt-0.5 min-w-[10rem]"
                                value={data.vehicle_id}
                                onChange={(value) => setData('vehicle_id', value)}
                                options={vehicles.map((v) => ({
                                    value: String(v.id),
                                    label: `${v.name}${v.plate_number ? ` (${v.plate_number})` : ''}`,
                                }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">{t('routing.fields.driver')}</label>
                            <Select
                                className="mt-0.5 min-w-[10rem]"
                                value={data.driver_id}
                                onChange={(value) => setData('driver_id', value)}
                                options={drivers.map((d) => ({ value: String(d.id), label: d.name }))}
                            />
                        </div>
                        <SecondaryButton type="submit" disabled={processing}>
                            {t('common.save')}
                        </SecondaryButton>
                    </form>
                )}
            </div>
            <ol className="divide-y divide-gray-100">
                {route.stops.map((stop) => (
                    <li key={stop.id} className="flex gap-3 px-4 py-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                            {stop.sequence}
                        </span>
                        <div className="min-w-0">
                            <div className="font-medium text-gray-900">
                                {stop.delivery_order?.code ?? t('routing.pages.show.stop_fallback')}
                                {stop.delivery_order?.partner ? ` · ${stop.delivery_order.partner.name}` : ''}
                            </div>
                            <div className="text-gray-600">{stop.address}</div>
                            <div className="text-xs text-gray-500">
                                {t('routing.pages.show.stop_meta', {
                                    distance: stop.distance_from_previous_km,
                                    demand: stop.demand_kg,
                                    lat: stop.lat,
                                    lng: stop.lng,
                                })}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export default function Show({ plan, vehicles, drivers, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{plan.code}</h2>
                        <p className="text-sm text-gray-500">
                            {plan.planned_date} · {t(`routing.objective.${plan.objective}`, undefined, plan.objective)} ·{' '}
                            {t(`routing.status.${plan.status}`, undefined, plan.status)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can.optimize && plan.status !== 'applied' && plan.status !== 'cancelled' && (
                            <PrimaryButton
                                onClick={() => router.post(prefixedRoute('routing.plans.optimize', plan.id))}
                            >
                                {t('routing.actions.re_optimize')}
                            </PrimaryButton>
                        )}
                        {can.apply && plan.status === 'optimized' && (
                            <PrimaryButton onClick={() => router.post(prefixedRoute('routing.plans.apply', plan.id))}>
                                {t('routing.actions.apply_create_trips')}
                            </PrimaryButton>
                        )}
                        {can.delete && plan.status !== 'applied' && plan.status !== 'cancelled' && (
                            <SecondaryButton onClick={() => router.post(prefixedRoute('routing.plans.cancel', plan.id))}>
                                {t('routing.actions.cancel_plan')}
                            </SecondaryButton>
                        )}
                        <Link href={prefixedRoute('routing.plans.index')}>
                            <SecondaryButton type="button">{t('routing.actions.back')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={plan.code} />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.total_distance')}</div>
                            <div className="text-lg font-semibold">{plan.total_distance_km} km</div>
                        </div>
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.estimated_cost')}</div>
                            <div className="text-lg font-semibold">{plan.total_cost}</div>
                        </div>
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.routes')}</div>
                            <div className="text-lg font-semibold">{plan.routes.length}</div>
                        </div>
                        <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                            <div className="text-xs text-gray-500">{t('routing.fields.unassigned')}</div>
                            <div className="text-lg font-semibold text-amber-700">{plan.unassigned_count}</div>
                        </div>
                    </div>

                    <p className="mb-6 text-sm text-gray-600">
                        {t('routing.pages.show.depot', {
                            address: plan.depot_address || '—',
                            lat: plan.depot_lat,
                            lng: plan.depot_lng,
                        })}
                    </p>

                    {plan.routes.length > 0 && (
                        <div className="mb-6">
                        <PlanRoutesMap
                            depot={{
                                lat: plan.depot_lat,
                                lng: plan.depot_lng,
                                address: plan.depot_address,
                            }}
                            routes={plan.routes.map((route) => ({
                                id: route.id,
                                sequence: route.sequence,
                                vehicleLabel: route.vehicle
                                    ? `${route.vehicle.name}${route.vehicle.plate_number ? ` (${route.vehicle.plate_number})` : ''}`
                                    : undefined,
                                stops: route.stops.map((stop) => ({
                                    id: stop.id,
                                    sequence: stop.sequence,
                                    address: stop.address,
                                    lat: stop.lat,
                                    lng: stop.lng,
                                    label: stop.delivery_order
                                        ? `${stop.delivery_order.code}${stop.delivery_order.partner ? ` · ${stop.delivery_order.partner.name}` : ''}`
                                        : stop.address,
                                })),
                            }))}
                        />
                        </div>
                    )}

                    <div className="space-y-4">
                        {plan.routes.length === 0 ? (
                            <div className="bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm sm:rounded-lg">
                                {t('routing.pages.show.routes_empty')}
                            </div>
                        ) : (
                            plan.routes.map((route) => (
                                <RouteEditor
                                    key={route.id}
                                    planId={plan.id}
                                    route={route}
                                    vehicles={vehicles}
                                    drivers={drivers}
                                    canUpdate={can.update && plan.status === 'optimized'}
                                />
                            ))
                        )}
                    </div>
        </DynamicLayout>
    );
}
