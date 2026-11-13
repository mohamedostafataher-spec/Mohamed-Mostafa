import { TeamMemberRole } from '../types';

export type CanonicalAdminRole =
  | 'owner'
  | 'manager'
  | 'sales'
  | 'warehouse'
  | 'accountant'
  | 'support';

export type DashboardTabId =
  | 'overview'
  | 'growth'
  | 'finances'
  | 'orders'
  | 'returns'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'coupons'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'audit-logs'
  | 'pixel-diagnostics'
  | 'system-health';

export const CANONICAL_ROLES: CanonicalAdminRole[] = [
  'owner',
  'manager',
  'sales',
  'warehouse',
  'accountant',
  'support'
];

export const ROLE_LABELS_AR: Record<CanonicalAdminRole, string> = {
  owner: 'مالك المتجر',
  manager: 'مدير العمليات',
  sales: 'موظف مبيعات',
  warehouse: 'مسؤول المخزن',
  accountant: 'محاسب مالي',
  support: 'خدمة العملاء والدعم'
};

export const ROLE_DESCRIPTIONS_AR: Record<CanonicalAdminRole, string> = {
  owner: 'صلاحيات كاملة لإدارة المتجر، المالية، الفريق، والإعدادات.',
  manager: 'إدارة الطلبات والمنتجات والتسعير والمرتجعات والنمو بدون حذف أو إدارة الفريق.',
  sales: 'متابعة الطلبات وتأكيدها والعميلات والكوبونات دون الاطلاع على التكلفة أو الأرباح.',
  warehouse: 'إدارة المخزون، تجهيز الشحنات، وفحص المرتجعات دون رؤية التكلفة أو الأرباح.',
  accountant: 'مراجعة التقارير المالية، المصروفات، سعر التكلفة، المرتجعات، وسجل التدقيق.',
  support: 'متابعة تذاكر الدعم، حالات الطلبات، والمرتجعات لخدمة العميلات.'
};

/**
 * Normalizes legacy role strings to the 6 canonical RBAC roles.
 */
export function normalizeAdminRole(role?: string | null): CanonicalAdminRole {
  const clean = (role || '').trim().toLowerCase();
  if (clean === 'owner' || clean === 'super_admin') return 'owner';
  if (clean === 'manager') return 'manager';
  if (clean === 'sales' || clean === 'orders' || clean === 'orders_agent' || clean === 'marketing') {
    return 'sales';
  }
  if (clean === 'warehouse' || clean === 'inventory') return 'warehouse';
  if (clean === 'accountant' || clean === 'finance') return 'accountant';
  return 'support';
}

const TAB_ACCESS_MATRIX: Record<DashboardTabId, CanonicalAdminRole[]> = {
  overview: ['owner', 'manager', 'sales', 'warehouse', 'accountant', 'support'],
  orders: ['owner', 'manager', 'sales', 'warehouse', 'accountant', 'support'],
  returns: ['owner', 'manager', 'sales', 'warehouse', 'accountant', 'support'],
  products: ['owner', 'manager', 'sales', 'warehouse', 'accountant'],
  inventory: ['owner', 'manager', 'warehouse', 'accountant', 'sales'],
  customers: ['owner', 'manager', 'sales', 'accountant', 'support'],
  coupons: ['owner', 'manager', 'sales', 'support'],
  finances: ['owner', 'manager', 'accountant'],
  analytics: ['owner', 'manager', 'sales', 'accountant'],
  growth: ['owner', 'manager'],
  'audit-logs': ['owner', 'manager', 'accountant'],
  'system-health': ['owner', 'manager'],
  'pixel-diagnostics': ['owner', 'manager'],
  team: ['owner', 'manager'],
  settings: ['owner', 'manager']
};

export function canAccessTab(role: TeamMemberRole | string | undefined | null, tab: DashboardTabId): boolean {
  const canonical = normalizeAdminRole(role);
  return TAB_ACCESS_MATRIX[tab]?.includes(canonical) ?? false;
}

export function getAllowedTabs(role: TeamMemberRole | string | undefined | null): DashboardTabId[] {
  const canonical = normalizeAdminRole(role);
  return (Object.keys(TAB_ACCESS_MATRIX) as DashboardTabId[]).filter((tab) =>
    TAB_ACCESS_MATRIX[tab].includes(canonical)
  );
}

export function canViewCostPrice(role: TeamMemberRole | string | undefined | null): boolean {
  const canonical = normalizeAdminRole(role);
  return canonical === 'owner' || canonical === 'manager' || canonical === 'accountant';
}

export function canEditCostPrice(role: TeamMemberRole | string | undefined | null): boolean {
  const canonical = normalizeAdminRole(role);
  return canonical === 'owner' || canonical === 'manager';
}

export function canEditProducts(role: TeamMemberRole | string | undefined | null): boolean {
  const canonical = normalizeAdminRole(role);
  return canonical === 'owner' || canonical === 'manager';
}

export function canUpdateStock(role: TeamMemberRole | string | undefined | null): boolean {
  const canonical = normalizeAdminRole(role);
  return canonical === 'owner' || canonical === 'manager' || canonical === 'warehouse';
}

export function canDeleteProduct(role: TeamMemberRole | string | undefined | null): boolean {
  return normalizeAdminRole(role) === 'owner';
}

export function canDeleteOrder(role: TeamMemberRole | string | undefined | null): boolean {
  return normalizeAdminRole(role) === 'owner';
}

export function canManageCoupons(role: TeamMemberRole | string | undefined | null): boolean {
  const canonical = normalizeAdminRole(role);
  return canonical === 'owner' || canonical === 'manager';
}

export function canManageTeam(role: TeamMemberRole | string | undefined | null): boolean {
  return normalizeAdminRole(role) === 'owner';
}

export function canManageSettings(role: TeamMemberRole | string | undefined | null): boolean {
  return normalizeAdminRole(role) === 'owner';
}

export function canUpdateOrderStatus(role: TeamMemberRole | string | undefined | null): boolean {
  const canonical = normalizeAdminRole(role);
  return canonical === 'owner' || canonical === 'manager' || canonical === 'sales' || canonical === 'warehouse' || canonical === 'support';
}
