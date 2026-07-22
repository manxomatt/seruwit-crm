import ModuleLayout from '@/Layouts/ModuleLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
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

interface Props {
  products: Product[]
  warehouses: Warehouse[]
}

export default function StockMovementCreate({ products, warehouses }: Props): JSX.Element {
  const { prefixedRoute } = useRoutePrefix()
  const { data, setData, post, processing, errors } = useForm({
    warehouse_id: warehouses[0]?.id ? String(warehouses[0].id) : '',
    product_id: '',
    type: 'in',
    quantity: '',
    reference_code: '',
    notes: '',
  })

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    post(prefixedRoute('inventory.stock-movements.store'))
  }

  return (
    <ModuleLayout title="Record Stock Movement">
      <Head title="Record Stock Movement" />

      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Record Stock Movement</h1>

        {warehouses.length === 0 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No active warehouse yet. Create a warehouse first.
          </div>
        )}

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <form onSubmit={submit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <InputLabel htmlFor="warehouse_id" value="Warehouse" />
                <Select
                  id="warehouse_id"
                  className="mt-1"
                  value={data.warehouse_id}
                  onChange={(value) => setData('warehouse_id', value)}
                  placeholder="Select a warehouse"
                  options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                />
                <InputError message={errors.warehouse_id} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="product_id" value="Product" />
                <Select
                  id="product_id"
                  className="mt-1"
                  value={data.product_id}
                  onChange={(value) => setData('product_id', value)}
                  placeholder="Select a product"
                  options={products.map((p) => ({
                    value: String(p.id),
                    label: `${p.name}${p.category === 'fleet_sparepart' ? ' (Sparepart)' : ''}`,
                  }))}
                />
                <InputError message={errors.product_id} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="type" value="Movement Type" />
                <Select
                  id="type"
                  className="mt-1"
                  value={data.type}
                  onChange={(value) => setData('type', value)}
                  options={[
                    { value: 'in', label: 'Stock In (add)' },
                    { value: 'out', label: 'Stock Out (remove)' },
                    { value: 'adjustment', label: 'Adjustment (set exact on-hand)' },
                  ]}
                />
                <InputError message={errors.type} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="quantity" value="Quantity" />
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
                    On-hand will be set to this exact value.
                  </p>
                )}
              </div>
            </div>

            <div>
              <InputLabel htmlFor="reference_code" value="Reference Code (optional)" />
              <TextInput
                id="reference_code"
                className="mt-1 block w-full"
                placeholder="e.g. PO-123, GRN-456"
                value={data.reference_code}
                onChange={(e) => setData('reference_code', e.target.value)}
              />
              <InputError message={errors.reference_code} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="notes" value="Notes (optional)" />
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
              <PrimaryButton disabled={processing}>Record Movement</PrimaryButton>
              <Link href={prefixedRoute('inventory.stock-movements.index')}>
                <SecondaryButton type="button">Cancel</SecondaryButton>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ModuleLayout>
  )
}
