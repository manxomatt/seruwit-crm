import ModuleLayout from '@/Layouts/ModuleLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTrans } from '@/hooks/useTrans'
import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import Select from '@/Components/Select'
import TextInput from '@/Components/TextInput'
import { Head, Link, useForm } from '@inertiajs/react'
import { FormEventHandler } from 'react'

interface Product {
  id: number
  name: string
  category: 'merchandise' | 'fleet_sparepart'
  unit: string | null
}

interface Warehouse {
  id: number
  name: string
}

interface Location {
  id: number
  warehouse_id: number
  name: string
  code: string
  type: string
}

interface Props {
  products: Product[]
  warehouses: Warehouse[]
  locations: Location[]
}

export default function StockMovementCreate({ products, warehouses, locations }: Props): JSX.Element {
  const { prefixedRoute } = useRoutePrefix()
  const { t } = useTrans()
  const { data, setData, post, processing, errors } = useForm({
    warehouse_id: warehouses[0]?.id ? String(warehouses[0].id) : '',
    location_id: '',
    product_id: '',
    type: 'in',
    quantity: '',
    batch_number: '',
    expiry_date: '',
    reference_code: '',
    notes: '',
  })

  const filteredLocations = locations.filter(
    (l) => String(l.warehouse_id) === data.warehouse_id
  )

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    post(prefixedRoute('inventory.stock-movements.store'))
  }

  return (
    <ModuleLayout title={t('inventory.movements.record_title')}>
      <Head title={t('inventory.movements.record_title')} />

      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">{t('inventory.movements.record_title')}</h1>

        {warehouses.length === 0 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            {t('inventory.movements.no_warehouse')}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <form onSubmit={submit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <InputLabel htmlFor="warehouse_id" value={t('inventory.movements.warehouse')} />
                <Select
                  id="warehouse_id"
                  className="mt-1"
                  value={data.warehouse_id}
                  onChange={(value) => { setData('warehouse_id', value); setData('location_id', ''); }}
                  placeholder={t('inventory.movements.select_warehouse')}
                  options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                />
                <InputError message={errors.warehouse_id} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="location_id" value={t('inventory.movements.location_optional')} />
                <Select
                  id="location_id"
                  className="mt-1"
                  value={data.location_id}
                  onChange={(value) => setData('location_id', value)}
                  placeholder={t('inventory.movements.all_locations')}
                  options={[
                    { value: '', label: t('inventory.movements.all_locations') },
                    ...filteredLocations.map((l) => ({
                      value: String(l.id),
                      label: `${l.code} — ${l.name}`,
                    })),
                  ]}
                />
                <InputError message={errors.location_id} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="product_id" value={t('inventory.movements.product')} />
                <Select
                  id="product_id"
                  className="mt-1"
                  value={data.product_id}
                  onChange={(value) => setData('product_id', value)}
                  placeholder={t('inventory.movements.select_product')}
                  options={products.map((p) => ({
                    value: String(p.id),
                    label: `${p.name}${p.category === 'fleet_sparepart' ? ` ${t('inventory.categories.sparepart_suffix')}` : ''}`,
                  }))}
                />
                <InputError message={errors.product_id} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="type" value={t('inventory.movements.type')} />
                <Select
                  id="type"
                  className="mt-1"
                  value={data.type}
                  onChange={(value) => setData('type', value)}
                  options={[
                    { value: 'in', label: t('inventory.movement_types.in_add') },
                    { value: 'out', label: t('inventory.movement_types.out_remove') },
                    { value: 'adjustment', label: t('inventory.movement_types.adjustment_set') },
                  ]}
                />
                <InputError message={errors.type} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="quantity" value={t('inventory.movements.quantity')} />
                <TextInput
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full"
                  value={data.quantity}
                  onChange={(e) => setData('quantity', e.target.value)}
                  required
                />
                <InputError message={errors.quantity} className="mt-2" />
                {data.type === 'adjustment' && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('inventory.movements.adjustment_hint')}
                  </p>
                )}
                {data.type === 'out' && !data.batch_number && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('inventory.movements.fefo_hint')}
                  </p>
                )}
              </div>

              <div>
                <InputLabel htmlFor="batch_number" value={t('inventory.movements.batch_optional')} />
                <TextInput
                  id="batch_number"
                  className="mt-1 block w-full"
                  placeholder={t('inventory.movements.batch_placeholder')}
                  value={data.batch_number}
                  onChange={(e) => setData('batch_number', e.target.value)}
                />
                <InputError message={errors.batch_number} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="expiry_date" value={t('inventory.movements.expiry_optional')} />
                <TextInput
                  id="expiry_date"
                  type="date"
                  className="mt-1 block w-full"
                  value={data.expiry_date}
                  onChange={(e) => setData('expiry_date', e.target.value)}
                />
                <InputError message={errors.expiry_date} className="mt-2" />
              </div>
            </div>

            <div>
              <InputLabel htmlFor="reference_code" value={t('inventory.movements.reference_optional')} />
              <TextInput
                id="reference_code"
                className="mt-1 block w-full"
                placeholder={t('inventory.movements.reference_placeholder')}
                value={data.reference_code}
                onChange={(e) => setData('reference_code', e.target.value)}
              />
              <InputError message={errors.reference_code} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="notes" value={t('inventory.movements.notes_optional')} />
              <textarea
                id="notes"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
              />
              <InputError message={errors.notes} className="mt-2" />
            </div>

            <div className="flex items-center gap-4">
              <PrimaryButton disabled={processing}>{t('inventory.movements.record')}</PrimaryButton>
              <Link href={prefixedRoute('inventory.stock-movements.index')}>
                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ModuleLayout>
  )
}
