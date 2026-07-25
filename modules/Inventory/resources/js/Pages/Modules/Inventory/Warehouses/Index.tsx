import DynamicLayout from '@/Layouts/DynamicLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTrans } from '@/hooks/useTrans'
import PrimaryButton from '@/Components/PrimaryButton'
import { Head, Link } from '@inertiajs/react'
import InventoryNav from '../../../../InventoryNav'

interface Warehouse {
  id: number
  name: string
  location: string
  status: 'active' | 'inactive'
  locations_count: number
  created_at: string
}

interface Props {
  warehouses: Warehouse[]
}

export default function WarehousesIndex({ warehouses }: Props) {
  const { prefixedRoute } = useRoutePrefix()
  const { t } = useTrans()

  return (
    <DynamicLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('inventory.title')}</h2>
          <Link href={prefixedRoute('inventory.warehouses.create')}>
            <PrimaryButton>{t('inventory.warehouses.add')}</PrimaryButton>
          </Link>
        </div>
      }
    >
      <Head title={t('inventory.warehouses.head')} />

      <InventoryNav />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          {warehouses.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-sm font-medium text-gray-900">{t('inventory.warehouses.empty_title')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('inventory.warehouses.empty_hint')}</p>
              <Link href={prefixedRoute('inventory.warehouses.create')} className="mt-4 inline-block">
                <PrimaryButton>{t('inventory.warehouses.add')}</PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.name')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.location')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.zones')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.status')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{warehouse.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{warehouse.location}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">{warehouse.locations_count}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            warehouse.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {t(`inventory.status.${warehouse.status}`)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Link
                          href={prefixedRoute('inventory.warehouses.show', warehouse.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('inventory.warehouses.view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DynamicLayout>
  )
}
