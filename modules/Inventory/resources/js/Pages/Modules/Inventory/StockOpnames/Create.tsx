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

interface Warehouse {
  id: number
  name: string
}

interface Props {
  warehouses: Warehouse[]
}

export default function StockOpnameCreate({ warehouses }: Props): JSX.Element {
  const { prefixedRoute } = useRoutePrefix()
  const today = new Date().toISOString().slice(0, 10)
  const { data, setData, post, processing, errors } = useForm({
    warehouse_id: warehouses[0]?.id ? String(warehouses[0].id) : '',
    opname_date: today,
  })

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    post(prefixedRoute('inventory.stock-opnames.store'))
  }

  return (
    <ModuleLayout title="New Stock Opname">
      <Head title="New Stock Opname" />

      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">New Stock Opname</h1>
        <p className="text-sm text-gray-600">
          A count sheet will be generated for every product, snapshotting current system quantities
          for the selected warehouse.
        </p>

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
                <InputLabel htmlFor="opname_date" value="Opname Date" />
                <TextInput
                  id="opname_date"
                  type="date"
                  className="mt-1 block w-full"
                  value={data.opname_date}
                  onChange={(e) => setData('opname_date', e.target.value)}
                  required
                />
                <InputError message={errors.opname_date} className="mt-2" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <PrimaryButton disabled={processing}>Create Opname</PrimaryButton>
              <Link href={prefixedRoute('inventory.stock-opnames.index')}>
                <SecondaryButton type="button">Cancel</SecondaryButton>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ModuleLayout>
  )
}
