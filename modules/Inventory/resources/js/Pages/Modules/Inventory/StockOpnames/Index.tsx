import { Link } from '@inertiajs/react'
import ModuleLayout from '@/Layouts/ModuleLayout'

interface StockOpname {
  id: number
  warehouse: { id: number; name: string }
  opname_date: string
  status: 'draft' | 'in_progress' | 'completed'
  completed_at?: string
  createdBy: { id: number; name: string }
  created_at: string
}

interface Props {
  opnames: {
    data: StockOpname[]
    links: any[]
    current_page: number
    last_page: number
  }
}

export default function StockOpnamesIndex({ opnames }: Props) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }

  return (
    <ModuleLayout title="Stock Opnames">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Stock Opnames</h1>
          <Link href={route('inventory.stock-opnames.create')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            New Opname
          </Link>
        </div>

        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Warehouse</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Created By</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opnames.data.map((opname) => (
                <tr key={opname.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{opname.warehouse.name}</td>
                  <td className="px-6 py-3">{new Date(opname.opname_date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[opname.status as keyof typeof statusColors]}`}>
                      {opname.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{opname.createdBy.name}</td>
                  <td className="px-6 py-3">
                    <Link href={route('inventory.stock-opnames.show', opname.id)} className="text-blue-600 hover:underline">View</Link>
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
