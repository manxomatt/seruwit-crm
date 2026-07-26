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

export default function WarehouseCreate(): JSX.Element {
  const { prefixedRoute } = useRoutePrefix()
  const { t } = useTrans()
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    status: 'active',
  })

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    post(prefixedRoute('inventory.warehouses.store'))
  }

  return (
    <ModuleLayout title={t('inventory.warehouses.add_title')}>
      <Head title={t('inventory.warehouses.add_title')} />

      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">{t('inventory.warehouses.add_title')}</h1>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <form onSubmit={submit} className="space-y-6 p-6">
            <div>
              <InputLabel htmlFor="name" value={t('inventory.warehouses.name')} />
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
              <InputLabel htmlFor="location" value={t('inventory.warehouses.location')} />
              <TextInput
                id="location"
                className="mt-1 block w-full"
                value={data.location}
                onChange={(e) => setData('location', e.target.value)}
                required
              />
              <InputError message={errors.location} className="mt-2" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <InputLabel htmlFor="latitude" value={t('inventory.warehouses.latitude')} />
                <TextInput
                  id="latitude"
                  type="number"
                  step="0.0000001"
                  className="mt-1 block w-full"
                  value={data.latitude}
                  onChange={(e) => setData('latitude', e.target.value)}
                />
                <InputError message={errors.latitude} className="mt-2" />
              </div>
              <div>
                <InputLabel htmlFor="longitude" value={t('inventory.warehouses.longitude')} />
                <TextInput
                  id="longitude"
                  type="number"
                  step="0.0000001"
                  className="mt-1 block w-full"
                  value={data.longitude}
                  onChange={(e) => setData('longitude', e.target.value)}
                />
                <InputError message={errors.longitude} className="mt-2" />
              </div>
            </div>

            <div>
              <InputLabel htmlFor="status" value={t('inventory.warehouses.status')} />
              <Select
                id="status"
                className="mt-1"
                value={data.status}
                onChange={(value) => setData('status', value)}
                options={[
                  { value: 'active', label: t('inventory.status.active') },
                  { value: 'inactive', label: t('inventory.status.inactive') },
                ]}
              />
              <InputError message={errors.status} className="mt-2" />
            </div>

            <div className="flex items-center gap-4">
              <PrimaryButton disabled={processing}>{t('inventory.warehouses.save')}</PrimaryButton>
              <Link href={prefixedRoute('inventory.warehouses.index')}>
                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ModuleLayout>
  )
}
