/** ユーザー権限 */
export type UserRole = "member" | "manager" | "admin";

/** ログインユーザー情報 */
export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  managerId: number | null;
}

/** 権限に基づくメニュー表示判定 */
export function canAccessMenu(
  menuId: string,
  role: UserRole
): boolean {
  const menuPermissions: Record<string, UserRole[]> = {
    dashboard: ["member", "manager", "admin"],
    reports: ["member", "manager", "admin"],
    customers: ["member", "manager", "admin"],
    "sales-persons": ["admin"],
  };

  const allowedRoles = menuPermissions[menuId];
  if (!allowedRoles) {return false;}

  return allowedRoles.includes(role);
}

/** 権限に基づく操作判定 */
export function canPerformAction(
  action: string,
  role: UserRole
): boolean {
  const actionPermissions: Record<string, UserRole[]> = {
    "report:create": ["member", "manager", "admin"],
    "report:edit-own": ["member", "manager", "admin"],
    "report:confirm": ["manager", "admin"],
    "report:view-subordinates": ["manager", "admin"],
    "customer:view": ["member", "manager", "admin"],
    "customer:edit": ["admin"],
    "sales-person:view": ["admin"],
    "sales-person:edit": ["admin"],
  };

  const allowedRoles = actionPermissions[action];
  if (!allowedRoles) {return false;}

  return allowedRoles.includes(role);
}
