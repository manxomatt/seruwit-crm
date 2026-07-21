import ModuleLayout from '@/Layouts/ModuleLayout'

interface StockMovement {
  id: number
  product: { id: number; name: string }
  warehouse: { id: number; name: string }
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: string
  source_type: string
  reference_code?: string
  notes?: string
  recordedBy: { id: number; name: string }
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
  const typeColors = {
    in: 'bg-green-100 text-green-800',
    out: 'bg-red-100 text-red-800',
    adjustment: 'bg-blue-100 text-blue-800',
    transfer: 'bg-gray-100 text-gray-800',
  }

  return (
    <ModuleLayout title="Stock Movements">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Stock Movement Ledger</h1>

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">Warehouse</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-left font-semibold">Source</th>
                <th className="px-4 py-3 text-left font-semibold">Reference</th>
                <th className="px-4 py-3 text-left font-semibold">By</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.data.map((movement) => (
                <tr key={movement.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{movement.product.name}</td>
                  <td className="px-4 py-3">{movement.warehouse.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${typeColors[movement.type as keyof typeof typeColors]}`}>
                      {movement.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${movement.type === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                    {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{movement.source_type}</td>
                  <td className="px-4 py-3 text-xs">{movement.reference_code || '—'}</td>
                  <td className="px-4 py-3 text-sm">{movement.recordedBy.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(movement.recorded_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleLayout>
  )
}
