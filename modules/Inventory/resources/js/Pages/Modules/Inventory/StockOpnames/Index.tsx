import DynamicLayout from '@/Layouts/DynamicLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useLocaleTag, useTrans } from '@/hooks/useTrans'
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

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

export default function StockOpnamesIndex({ opnames }: Props) {
  const { prefixedRoute } = useRoutePrefix()
  const { t } = useTrans()
  const localeTag = useLocaleTag()
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }

  return (
    <DynamicLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('inventory.title')}</h2>
          <Link href={prefixedRoute('inventory.stock-opnames.create')}>
            <PrimaryButton>{t('inventory.opnames.new')}</PrimaryButton>
          </Link>
        </div>
      }
    >
      <Head title={t('inventory.opnames.head')} />

      <InventoryNav />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.opnames.columns.warehouse')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.opnames.columns.date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.opnames.columns.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.opnames.columns.created_by')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {opnames.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('inventory.opnames.empty')}
                  </td>
                </tr>
              ) : (
                opnames.data.map((opname) => (
                  <tr key={opname.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{opname.warehouse.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{new Date(opname.opname_date).toLocaleDateString(localeTag)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[opname.status as keyof typeof statusColors]}`}>
                        {t(`inventory.status.${opname.status}`)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{opname.created_by?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={prefixedRoute('inventory.stock-opnames.show', opname.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title={t('common.view')}
                        >
                          <EyeIcon />
                        </Link>
                      </div>
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
