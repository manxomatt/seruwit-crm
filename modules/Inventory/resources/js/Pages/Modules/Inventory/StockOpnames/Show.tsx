import { Link } from '@inertiajs/react'
import ModuleLayout from '@/Layouts/ModuleLayout'

interface StockOpnameItem {
  id: number
  product: { id: number; name: string }
  system_qty: number
  actual_qty: number
  variance?: number
  notes?: string
}

interface StockOpname {
  id: number
  warehouse: { id: number; name: string }
  opname_date: string
  status: 'draft' | 'in_progress' | 'completed'
  completed_at?: string
  createdBy: { id: number; name: string }
  items: StockOpnameItem[]
}

interface Props {
  opname: StockOpname
}

export default function StockOpnameShow({ opname }: Props) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }

  const totalVariance = opname.items.reduce((sum, item) => sum + (item.variance || 0), 0)

  return (
    <ModuleLayout title={`Opname #${opname.id}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Opname</h1>
            <p className="text-sm text-gray-600">{opname.warehouse.name}</p>
          </div>
          <Link href={route('inventory.stock-opnames.index')} className="px-4 py-2 border rounded hover:bg-gray-50">
            Back to List
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-600">STATUS</p>
                <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${statusColors[opname.status as keyof typeof statusColors]}`}>
                  {opname.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">OPNAME DATE</p>
                <p>{new Date(opname.opname_date).toLocaleDateString('id-ID')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">CREATED BY</p>
                <p>{opname.createdBy.name}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-600">TOTAL ITEMS</p>
                <p className="text-2xl font-bold">{opname.items.length}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">TOTAL VARIANCE</p>
                <p className={`text-lg font-bold ${totalVariance > 0 ? 'text-green-600' : totalVariance < 0 ? 'text-red-600' : ''}`}>
                  {totalVariance > 0 ? '+' : ''}{totalVariance}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Product</th>
                <th className="px-6 py-3 text-right font-semibold">System Qty</th>
                <th className="px-6 py-3 text-right font-semibold">Actual Qty</th>
                <th className="px-6 py-3 text-right font-semibold">Variance</th>
                <th className="px-6 py-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {opname.items.map((item) => {
                const variance = item.variance || 0
                return (
                  <tr key={item.id} className={`border-b ${variance !== 0 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-3 font-medium">{item.product.name}</td>
                    <td className="px-6 py-3 text-right">{item.system_qty}</td>
                    <td className="px-6 py-3 text-right">{item.actual_qty}</td>
                    <td className={`px-6 py-3 text-right font-medium ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''}`}>
                      {variance > 0 ? '+' : ''}{variance}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600">{item.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleLayout>
  )
}
