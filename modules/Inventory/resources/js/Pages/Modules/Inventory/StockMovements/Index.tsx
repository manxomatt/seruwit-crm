import DynamicLayout from '@/Layouts/DynamicLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import PrimaryButton from '@/Components/PrimaryButton'
import { Head, Link } from '@inertiajs/react'
import InventoryNav from '../../../../InventoryNav'

interface StockMovement {
  id: number
  product: { id: number; name: string }
  warehouse: { id: number; name: string }
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: string
  source_type: string
  reference_code?: string
  notes?: string
  recorded_by?: { id: number; name: string } | null
  recorded_at: string
}

interface Props {
  movements: {
    data: StockMovement[]
    links: any[]
    current_page: number
    last_page: number
  }
}

export default function StockMovementsIndex({ movements }: Props) {
  const { prefixedRoute } = useRoutePrefix()
  const typeColors = {
    in: 'bg-green-100 text-green-800',
    out: 'bg-red-100 text-red-800',
    adjustment: 'bg-blue-100 text-blue-800',
    transfer: 'bg-gray-100 text-gray-800',
  }

  return (
    <DynamicLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory</h2>
          <Link href={prefixedRoute('inventory.stock-movements.create')}>
            <PrimaryButton>Record Movement</PrimaryButton>
          </Link>
        </div>
      }
    >
      <Head title="Stock Movements" />

      <InventoryNav />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">By</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    No movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.data.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{movement.product.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{movement.warehouse.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${typeColors[movement.type as keyof typeof typeColors]}`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${movement.type === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                      {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{movement.source_type}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{movement.reference_code || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{movement.recorded_by?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{new Date(movement.recorded_at).toLocaleDateString('id-ID')}</td>
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
