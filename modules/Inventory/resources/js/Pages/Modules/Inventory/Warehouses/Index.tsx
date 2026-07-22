import DynamicLayout from '@/Layouts/DynamicLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
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

  return (
    <DynamicLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory</h2>
          <Link href={prefixedRoute('inventory.warehouses.create')}>
            <PrimaryButton>Add Warehouse</PrimaryButton>
          </Link>
        </div>
      }
    >
      <Head title="Warehouses" />

      <InventoryNav />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          {warehouses.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-sm font-medium text-gray-900">No warehouses found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first warehouse.</p>
              <Link href={prefixedRoute('inventory.warehouses.create')} className="mt-4 inline-block">
                <PrimaryButton>Add Warehouse</PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Zones</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
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
                          {warehouse.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Link
                          href={prefixedRoute('inventory.warehouses.show', warehouse.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
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
