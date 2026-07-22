import DynamicLayout from '@/Layouts/DynamicLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import PrimaryButton from '@/Components/PrimaryButton'
import { Head, Link } from '@inertiajs/react'
import InventoryNav from '../../../../InventoryNav'

interface StockOpname {
  id: number
  warehouse: { id: number; name: string }
  opname_date: string
  status: 'draft' | 'in_progress' | 'completed'
  completed_at?: string
  created_by?: { id: number; name: string } | null
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
  const { prefixedRoute } = useRoutePrefix()
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }

  return (
    <DynamicLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory</h2>
          <Link href={prefixedRoute('inventory.stock-opnames.create')}>
            <PrimaryButton>New Opname</PrimaryButton>
          </Link>
        </div>
      }
    >
      <Head title="Stock Opnames" />

      <InventoryNav />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created By</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {opnames.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    No stock opnames yet.
                  </td>
                </tr>
              ) : (
                opnames.data.map((opname) => (
                  <tr key={opname.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{opname.warehouse.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{new Date(opname.opname_date).toLocaleDateString('id-ID')}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[opname.status as keyof typeof statusColors]}`}>
                        {opname.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{opname.created_by?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link href={prefixedRoute('inventory.stock-opnames.show', opname.id)} className="text-indigo-600 hover:text-indigo-900">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DynamicLayout>
  )
}
