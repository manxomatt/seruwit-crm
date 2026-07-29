export { DEFAULT_SITE_NAME } from '@/constants/brand';

export type ModuleTone = 'emerald' | 'cyan' | 'amber' | 'teal';

export const MODULE_TONE_CLASSES: Record<
    ModuleTone,
    {
        dot: string;
        soft: string;
        text: string;
        border: string;
        glow: string;
        icon: string;
    }
> = {
    emerald: {
        dot: 'bg-emerald-500',
        soft: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        glow: 'shadow-emerald-500/10',
        icon: 'text-emerald-600',
    },
    cyan: {
        dot: 'bg-cyan-500',
        soft: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
        glow: 'shadow-cyan-500/10',
        icon: 'text-cyan-600',
    },
    amber: {
        dot: 'bg-amber-500',
        soft: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        glow: 'shadow-amber-500/10',
        icon: 'text-amber-600',
    },
    teal: {
        dot: 'bg-teal-600',
        soft: 'bg-teal-50',
        text: 'text-teal-800',
        border: 'border-teal-200',
        glow: 'shadow-teal-500/10',
        icon: 'text-teal-700',
    },
};

export const MODULE_ITEM_KEYS = [
    'inventory',
    'purchasing',
    'outbound',
    'fleet',
    'transportation',
    'tracking',
    'orders',
    'sales',
    'pos',
    'canvassing',
    'promotions',
    'invoicing',
    'receivables',
    'accounting',
    'approvals',
] as const;

export const MODULE_GROUP_KEYS = ['supply', 'fleet', 'commerce', 'finance'] as const;

export const MODULE_ITEM_ICONS: Record<(typeof MODULE_ITEM_KEYS)[number], string> = {
    inventory: 'warehouse',
    purchasing: 'shopping_cart',
    outbound: 'outbox',
    fleet: 'local_shipping',
    transportation: 'route',
    tracking: 'my_location',
    orders: 'assignment',
    sales: 'sell',
    pos: 'point_of_sale',
    canvassing: 'map',
    promotions: 'campaign',
    invoicing: 'receipt_long',
    receivables: 'account_balance_wallet',
    accounting: 'account_balance',
    approvals: 'verified',
};

export const HOW_STEP_KEYS = ['register', 'modules', 'operate'] as const;
