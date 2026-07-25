import DynamicLayout from '@/Layouts/DynamicLayout'
import { useLocaleTag, useTrans } from '@/hooks/useTrans'
import { Head } from '@inertiajs/react'
import { Fragment, useState } from 'react'
import InventoryNav from '../../../../InventoryNav'

interface Warehouse {
  id: number
  name: string
}

interface BatchRow {
  batch_number: string | null
  expiry_date: string | null
  location: { id: number; name: string; code: string } | null
  on_hand: number
  reserved: number
}

interface StockLevel {
  warehouse_id: number
  on_hand: number
  reserved: number
  available: number
  is_low_stock: boolean
  batches: BatchRow[]
}

interface MatrixRow {
  product: {
    id: number
    name: string
    category: 'merchandise' | 'fleet_sparepart'
    stock_unit: string
    reorder_threshold: number
    tracking: string | null
  }
  levels: StockLevel[]
}

interface Props {
  warehouses: Warehouse[]
  matrix: MatrixRow[]
}

export default function StockLevelsIndex({ warehouses, matrix }: Props) {
  const { t } = useTrans()
  const localeTag = useLocaleTag()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <DynamicLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('inventory.title')}</h2>}
    >
      <Head title={t('inventory.stock_levels.head')} />

      <InventoryNav />

      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-left text-sm font-semibold">{t('inventory.stock_levels.product')}</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t('inventory.stock_levels.category')}</th>
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
                      <span>{t('inventory.stock_levels.available')}</span>
                      <span>{t('inventory.stock_levels.on_hand')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <Fragment key={row.product.id}>
                  <tr
                    className="cursor-pointer border-b hover:bg-gray-50"
                    onClick={() => setExpanded(expanded === row.product.id ? null : row.product.id)}
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium">
                      {row.product.name}
                      {row.product.tracking === 'lot' && (
                        <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{t('inventory.stock_levels.lot')}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className={`inline-block rounded px-2 py-1 ${row.product.category === 'merchandise' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {t(`inventory.categories.${row.product.category}`)}
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
                  {expanded === row.product.id && (
                    <tr className="border-b bg-slate-50">
                      <td colSpan={2 + warehouses.length * 2} className="px-4 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('inventory.stock_levels.batch_title')}</p>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {row.levels.flatMap((level) =>
                            level.batches.map((batch, i) => (
                              <div key={`${level.warehouse_id}-${i}`} className="rounded border border-gray-200 bg-white px-3 py-2 text-xs">
                                <div className="font-semibold text-gray-900">
                                  {batch.batch_number || t('inventory.stock_levels.no_batch')}
                                </div>
                                <div className="mt-1 text-gray-500">
                                  {t('inventory.stock_levels.exp')} {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString(localeTag) : '—'}
                                  {batch.location ? ` · ${batch.location.code}` : ''}
                                </div>
                                <div className="mt-1 tabular-nums text-gray-700">
                                  {t('inventory.stock_levels.on_hand_label')} {batch.on_hand}
                                </div>
                              </div>
                            ))
                          )}
                          {row.levels.every((l) => l.batches.length === 0) && (
                            <p className="text-sm text-gray-500">{t('inventory.stock_levels.batch_empty')}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-600">
          <p>{t('inventory.stock_levels.legend')}</p>
          <p className="text-red-600">{t('inventory.stock_levels.legend_red')}</p>
        </div>
      </div>
    </DynamicLayout>
  )
}
