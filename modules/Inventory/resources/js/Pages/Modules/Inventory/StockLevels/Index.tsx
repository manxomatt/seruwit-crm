import ModuleLayout from '@/Layouts/ModuleLayout'

interface Warehouse {
  id: number
  name: string
}

interface StockLevel {
  warehouse_id: number
  on_hand: number
  reserved: number
  available: number
  is_low_stock: boolean
}

interface MatrixRow {
  product: {
    id: number
    name: string
    category: 'merchandise' | 'fleet_sparepart'
    stock_unit: string
    reorder_threshold: number
  }
  levels: StockLevel[]
}

interface Props {
  warehouses: Warehouse[]
  matrix: MatrixRow[]
}

export default function StockLevelsIndex({ warehouses, matrix }: Props) {
  return (
    <ModuleLayout title="Stock Levels">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Stock Levels Matrix</h1>

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-left text-sm font-semibold">Product</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Category</th>
                {warehouses.map((w) => (
                  <th key={w.id} colSpan={2} className="px-4 py-2 text-center text-xs font-semibold">
                    {w.name}
                  </th>
                ))}
              </tr>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
                {warehouses.map((w) => (
                  <th key={w.id + '-sub'} colSpan={2} className="px-4 py-2 text-center text-xs text-gray-600">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span>Available</span>
                      <span>On Hand</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.product.id} className="border-b hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium">{row.product.name}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`inline-block px-2 py-1 rounded ${row.product.category === 'merchandise' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {row.product.category === 'merchandise' ? 'Merchandise' : 'Sparepart'}
                    </span>
                  </td>
                  {row.levels.map((level, idx) => (
                    <td
                      key={idx}
                      colSpan={2}
                      className={`px-4 py-2 text-center text-sm ${level.is_low_stock ? 'bg-red-50' : ''}`}
                    >
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className={level.is_low_stock ? 'font-bold text-red-600' : ''}>{level.available}</span>
                        <span className="text-gray-600">{level.on_hand}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-600">
          <p>
            <strong>Available</strong> = On Hand - Reserved
          </p>
          <p className="text-red-600">Red rows indicate low stock (below reorder threshold)</p>
        </div>
      </div>
    </ModuleLayout>
  )
}
