import { Link } from '@inertiajs/react'
import ModuleLayout from '@/Layouts/ModuleLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'

interface StockLevel {
  id: number
  on_hand: number
  reserved: number
  product: {
    id: number
    name: string
    category: 'merchandise' | 'fleet_sparepart'
  }
}

interface StockMovement {
  id: number
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  reference_code: string | null
  notes: string | null
  recorded_at: string | null
}

interface Warehouse {
  id: number
  name: string
  location: string
  status: 'active' | 'inactive'
  stock_levels: StockLevel[]
  stock_movements: StockMovement[]
}

interface Props {
  warehouse: Warehouse
}

const typeColors: Record<string, string> = {
  in: 'bg-green-100 text-green-800',
  out: 'bg-red-100 text-red-800',
  adjustment: 'bg-amber-100 text-amber-800',
  transfer: 'bg-blue-100 text-blue-800',
}

export default function WarehouseShow({ warehouse }: Props) {
  const { prefixedRoute } = useRoutePrefix()

  return (
    <ModuleLayout title={warehouse.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{warehouse.name}</h1>
            <p className="text-sm text-gray-600">{warehouse.location}</p>
          </div>
          <Link
            href={prefixedRoute('inventory.warehouses.index')}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Back to List
          </Link>
        </div>

        <div>
          <span
            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
              warehouse.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {warehouse.status}
          </span>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Stock Levels</h2>
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">On Hand</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Reserved</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Available</th>
                </tr>
              </thead>
              <tbody>
                {warehouse.stock_levels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                      No stock recorded yet.
                    </td>
                  </tr>
                ) : (
                  warehouse.stock_levels.map((level) => (
                    <tr key={level.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{level.product.name}</td>
                      <td className="px-6 py-3 text-xs">
                        <span
                          className={`inline-block rounded px-2 py-1 ${
                            level.product.category === 'merchandise'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {level.product.category === 'merchandise' ? 'Merchandise' : 'Sparepart'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">{level.on_hand}</td>
                      <td className="px-6 py-3 text-right text-gray-600">{level.reserved}</td>
                      <td className="px-6 py-3 text-right font-semibold">
                        {level.on_hand - level.reserved}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Recent Movements</h2>
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reference</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Notes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {warehouse.stock_movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                      No movements yet.
                    </td>
                  </tr>
                ) : (
                  warehouse.stock_movements.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            typeColors[movement.type] ?? 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {movement.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">{movement.quantity}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {movement.reference_code ?? '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{movement.notes ?? '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {movement.recorded_at
                          ? new Date(movement.recorded_at).toLocaleString('id-ID')
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModuleLayout>
  )
}
