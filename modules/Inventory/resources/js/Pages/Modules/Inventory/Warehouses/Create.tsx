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

export default function WarehouseCreate(): JSX.Element {
  const { prefixedRoute } = useRoutePrefix()
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    location: '',
    status: 'active',
  })

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    post(prefixedRoute('inventory.warehouses.store'))
  }

  return (
    <ModuleLayout title="Add Warehouse">
      <Head title="Add Warehouse" />

      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Add Warehouse</h1>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <form onSubmit={submit} className="space-y-6 p-6">
            <div>
              <InputLabel htmlFor="name" value="Name" />
              <TextInput
                id="name"
                className="mt-1 block w-full"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
                autoFocus
              />
              <InputError message={errors.name} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="location" value="Location" />
              <TextInput
                id="location"
                className="mt-1 block w-full"
                value={data.location}
                onChange={(e) => setData('location', e.target.value)}
                required
              />
              <InputError message={errors.location} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="status" value="Status" />
              <Select
                id="status"
                className="mt-1"
                value={data.status}
                onChange={(value) => setData('status', value)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
              <InputError message={errors.status} className="mt-2" />
            </div>

            <div className="flex items-center gap-4">
              <PrimaryButton disabled={processing}>Save Warehouse</PrimaryButton>
              <Link href={prefixedRoute('inventory.warehouses.index')}>
                <SecondaryButton type="button">Cancel</SecondaryButton>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ModuleLayout>
  )
}
