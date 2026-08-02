import DynamicLayout from '@/Layouts/DynamicLayout'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTrans } from '@/hooks/useTrans'
import PageHeader from '@/Components/PageHeader'
import PrimaryButton from '@/Components/PrimaryButton'
import Select from '@/Components/Select'
import { Head, Link, router } from '@inertiajs/react'
import InventoryNav from '../../../../InventoryNav'

type WarehouseKind = 'warehouse' | 'store' | 'showroom'

interface Warehouse {
  id: number
  name: string
  location: string
  kind: WarehouseKind
  status: 'active' | 'inactive'
  locations_count: number
  created_at: string
}

interface Props {
  warehouses: Warehouse[]
  filters: { kind: string | null }
  kinds: WarehouseKind[]
}

const KIND_BADGE: Record<WarehouseKind, string> = {
  warehouse: 'bg-slate-100 text-slate-800',
  store: 'bg-indigo-100 text-indigo-800',
  showroom: 'bg-amber-100 text-amber-800',
}

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

export default function WarehousesIndex({ warehouses, filters, kinds }: Props) {
  const { prefixedRoute } = useRoutePrefix()
  const { t } = useTrans()

  const filterKind = (kind: string) => {
    router.get(
      prefixedRoute('inventory.warehouses.index'),
      { kind: kind || undefined },
      { preserveState: true, replace: true },
    )
  }

  return (
    <DynamicLayout
      header={
          <PageHeader
              title={t('inventory.title')}
              actions={<Link href={prefixedRoute('inventory.warehouses.create')}>
            <PrimaryButton>{t('inventory.warehouses.add')}</PrimaryButton>
          </Link>}
          />
      }
    >
      <Head title={t('inventory.warehouses.head')} />

      <InventoryNav />

      <div className="mb-4 max-w-xs">
        <Select
          className="w-full"
          value={filters.kind || ''}
          onChange={filterKind}
          placeholder={t('inventory.warehouses.all_kinds')}
          options={[
            { value: '', label: t('inventory.warehouses.all_kinds') },
            ...kinds.map((kind) => ({
              value: kind,
              label: t(`inventory.warehouse_kinds.${kind}`),
            })),
          ]}
        />
      </div>

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          {warehouses.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-sm font-medium text-gray-900">{t('inventory.warehouses.empty_title')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('inventory.warehouses.empty_hint')}</p>
              <Link href={prefixedRoute('inventory.warehouses.create')} className="mt-4 inline-block">
                <PrimaryButton>{t('inventory.warehouses.add')}</PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.name')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.kind')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.location')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.zones')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('inventory.warehouses.columns.status')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{warehouse.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${KIND_BADGE[warehouse.kind] ?? KIND_BADGE.warehouse}`}>
                          {t(`inventory.warehouse_kinds.${warehouse.kind}`)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{warehouse.location}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">{warehouse.locations_count}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            warehouse.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {t(`inventory.status.${warehouse.status}`)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={prefixedRoute('inventory.warehouses.show', warehouse.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title={t('common.view')}
                          >
                            <EyeIcon />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DynamicLayout>
  )
}
