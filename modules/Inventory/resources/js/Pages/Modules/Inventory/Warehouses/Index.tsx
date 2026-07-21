import { Link } from '@inertiajs/react'
import ModuleLayout from '@/Layouts/ModuleLayout'

interface Warehouse {
  id: number
  name: string
  location: string
  status: 'active' | 'inactive'
  created_at: string
}

interface Props {
  warehouses: Warehouse[]
}

export default function WarehousesIndex({ warehouses }: Props) {
  return (
    <ModuleLayout title="Warehouses">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <Link href={route('inventory.warehouses.create')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add Warehouse
          </Link>
        </div>

        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{warehouse.name}</td>
                  <td className="px-6 py-3">{warehouse.location}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      warehouse.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {warehouse.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 space-x-2">
                    <Link href={route('inventory.warehouses.show', warehouse.id)} className="text-blue-600 hover:underline">View</Link>
                    <Link href={route('inventory.warehouses.edit', warehouse.id)} className="text-blue-600 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleLayout>
  )
}
