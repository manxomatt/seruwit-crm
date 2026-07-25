import DynamicLayout from '@/Layouts/DynamicLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useLocaleTag, useTrans } from '@/hooks/useTrans'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import { Head, Link } from '@inertiajs/react'
import InventoryNav from '../../../../InventoryNav'

interface StockMovement {
  id: number
  product: { id: number; name: string }
  warehouse: { id: number; name: string }
  location: { id: number; name: string; code: string } | null
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: string
  source_type: string
  reference_code?: string
  batch_number?: string | null
  expiry_date?: string | null
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
  const { t } = useTrans()
  const localeTag = useLocaleTag()
  const typeColors = {
    in: 'bg-green-100 text-green-800',
    out: 'bg-red-100 text-red-800',
    adjustment: 'bg-blue-100 text-blue-800',
    transfer: 'bg-gray-100 text-gray-800',
  }

  return (
    <DynamicLayout
      header={
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('inventory.title')}</h2>
          <div className="flex gap-2">
            <Link href={prefixedRoute('inventory.stock-movements.transfer.create')}>
              <SecondaryButton>{t('inventory.movements.transfer')}</SecondaryButton>
            </Link>
            <Link href={prefixedRoute('inventory.stock-movements.create')}>
              <PrimaryButton>{t('inventory.movements.record')}</PrimaryButton>
            </Link>
          </div>
        </div>
      }
    >
      <Head title={t('inventory.movements.head')} />

      <InventoryNav />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.product')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.warehouse')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.location')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.type')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.qty')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.source')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.reference')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.batch')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.by')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.movements.columns.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('inventory.movements.empty')}
                  </td>
                </tr>
              ) : (
                movements.data.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{movement.product.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{movement.warehouse.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">{movement.location?.code ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${typeColors[movement.type as keyof typeof typeColors]}`}>
                        {t(`inventory.movement_types.${movement.type}`)}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${movement.type === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                      {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{movement.source_type}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{movement.reference_code || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {movement.batch_number || '—'}
                      {movement.expiry_date ? (
                        <span className="block text-[10px] text-gray-400">
                          exp {new Date(movement.expiry_date).toLocaleDateString(localeTag)}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{movement.recorded_by?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{new Date(movement.recorded_at).toLocaleDateString(localeTag)}</td>
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
