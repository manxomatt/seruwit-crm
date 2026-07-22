import { Link, router, useForm } from '@inertiajs/react'
import ModuleLayout from '@/Layouts/ModuleLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import Modal from '@/Components/Modal'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import { FormEventHandler, useState } from 'react'

interface StockOpnameItem {
  id: number
  product: { id: number; name: string; category: 'merchandise' | 'fleet_sparepart' }
  system_qty: string
  actual_qty: string
  notes?: string
}

interface StockOpname {
  id: number
  warehouse: { id: number; name: string }
  opname_date: string
  status: 'draft' | 'in_progress' | 'completed'
  completed_at?: string
  created_by?: { id: number; name: string } | null
  items: StockOpnameItem[]
}

interface Props {
  opname: StockOpname
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

export default function StockOpnameShow({ opname }: Props) {
  const { prefixedRoute } = useRoutePrefix()
  const editable = opname.status !== 'completed'

  const { data, setData, patch, processing } = useForm<{
    items: { id: number; actual_qty: string }[]
  }>({
    items: opname.items.map((item) => ({ id: item.id, actual_qty: item.actual_qty })),
  })

  const setActual = (id: number, value: string) => {
    setData(
      'items',
      data.items.map((row) => (row.id === id ? { ...row, actual_qty: value } : row)),
    )
  }

  const actualFor = (id: number): string =>
    data.items.find((row) => row.id === id)?.actual_qty ?? '0'

  const varianceFor = (item: StockOpnameItem): number =>
    Number(actualFor(item.id) || 0) - Number(item.system_qty || 0)

  const totalVariance = opname.items.reduce((sum, item) => sum + varianceFor(item), 0)

  const [showFinalize, setShowFinalize] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const variances = opname.items.map(varianceFor)
  const itemsWithVariance = variances.filter((v) => v !== 0).length
  const increases = variances.filter((v) => v > 0).length
  const decreases = variances.filter((v) => v < 0).length

  const saveCounts: FormEventHandler = (e) => {
    e.preventDefault()
    patch(prefixedRoute('inventory.stock-opnames.counts', opname.id), { preserveScroll: true })
  }

  const confirmFinalize = () => {
    router.post(prefixedRoute('inventory.stock-opnames.finalize', opname.id), {}, {
      preserveScroll: true,
      onStart: () => setFinalizing(true),
      onFinish: () => {
        setFinalizing(false)
        setShowFinalize(false)
      },
    })
  }

  return (
    <ModuleLayout title={`Opname #${opname.id}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Opname #{opname.id}</h1>
            <p className="text-sm text-gray-600">{opname.warehouse.name}</p>
          </div>
          <Link
            href={prefixedRoute('inventory.stock-opnames.index')}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Back to List
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600">STATUS</p>
                <span
                  className={`inline-block rounded px-2 py-1 text-sm font-semibold ${statusColors[opname.status]}`}
                >
                  {opname.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">OPNAME DATE</p>
                <p>{new Date(opname.opname_date).toLocaleDateString('id-ID')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">CREATED BY</p>
                <p>{opname.created_by?.name ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600">TOTAL ITEMS</p>
                <p className="text-2xl font-bold">{opname.items.length}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">TOTAL VARIANCE</p>
                <p
                  className={`text-lg font-bold ${
                    totalVariance > 0 ? 'text-green-600' : totalVariance < 0 ? 'text-red-600' : ''
                  }`}
                >
                  {totalVariance > 0 ? '+' : ''}
                  {totalVariance}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={saveCounts} className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Product</th>
                  <th className="px-6 py-3 text-right font-semibold">System Qty</th>
                  <th className="px-6 py-3 text-right font-semibold">Actual Qty</th>
                  <th className="px-6 py-3 text-right font-semibold">Variance</th>
                </tr>
              </thead>
              <tbody>
                {opname.items.map((item) => {
                  const variance = varianceFor(item)
                  return (
                    <tr key={item.id} className={`border-b ${variance !== 0 ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-3 font-medium">
                        {item.product?.name ?? '—'}
                        {item.product?.category === 'fleet_sparepart' && (
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                            Sparepart
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">{item.system_qty}</td>
                      <td className="px-6 py-3 text-right">
                        {editable ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={actualFor(item.id)}
                            onChange={(e) => setActual(item.id, e.target.value)}
                            className="w-28 rounded border-gray-300 text-right shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        ) : (
                          item.actual_qty
                        )}
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-medium ${
                          variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''
                        }`}
                      >
                        {variance > 0 ? '+' : ''}
                        {variance}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {editable && (
            <div className="flex items-center gap-4">
              <PrimaryButton disabled={processing}>Save Counts</PrimaryButton>
              {opname.status === 'in_progress' && (
                <SecondaryButton type="button" onClick={() => setShowFinalize(true)}>
                  Finalize & Record Adjustments
                </SecondaryButton>
              )}
              <p className="text-xs text-gray-500">
                Save your counts first, then finalize to post the variances as stock adjustments.
              </p>
            </div>
          )}
        </form>
      </div>

      <Modal show={showFinalize} onClose={() => !finalizing && setShowFinalize(false)} maxWidth="lg">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Finalize stock opname?</h3>
              <p className="mt-1 text-sm text-gray-500">
                The variances below will be posted to the ledger as stock adjustments. This closes the
                opname and <span className="font-medium text-gray-700">cannot be undone</span>.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {itemsWithVariance === 0 ? (
              <p className="text-sm text-gray-600">
                No variances detected — no adjustments will be recorded. The opname will simply be
                marked as completed.
              </p>
            ) : (
              <dl className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Adjustments</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">{itemsWithVariance}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Stock In</dt>
                  <dd className="mt-1 text-2xl font-bold text-green-600">+{increases}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Stock Out</dt>
                  <dd className="mt-1 text-2xl font-bold text-red-600">−{decreases}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setShowFinalize(false)} disabled={finalizing}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={confirmFinalize} disabled={finalizing}>
              {finalizing ? 'Finalizing…' : 'Finalize'}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </ModuleLayout>
  )
}
