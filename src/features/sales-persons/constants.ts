/**
 * 営業担当者マスタ画面の定数
 */

/**
 * 部署の選択肢
 */
export const DEPARTMENTS = [
  { value: "営業1課", label: "営業1課" },
  { value: "営業2課", label: "営業2課" },
  { value: "営業3課", label: "営業3課" },
  { value: "管理部", label: "管理部" },
] as const;

/**
 * 部署の値の型
 */
export type DepartmentValue = (typeof DEPARTMENTS)[number]["value"];

/**
 * 権限の選択肢
 * - 一般: is_manager = false
 * - 上長: is_manager = true
 */
export const ROLES = [
  { value: "general", label: "一般", isManager: false },
  { value: "manager", label: "上長", isManager: true },
] as const;

/**
 * 権限値の型
 */
export type RoleValue = (typeof ROLES)[number]["value"];

/**
 * is_managerから権限値に変換
 */
export function isManagerToRoleValue(isManager: boolean): RoleValue {
  return isManager ? "manager" : "general";
}

/**
 * 権限値からis_managerに変換
 */
export function roleValueToIsManager(roleValue: RoleValue): boolean {
  return roleValue === "manager";
}

/**
 * 権限値から表示ラベルを取得
 */
export function getRoleLabel(isManager: boolean): string {
  return isManager ? "上長" : "一般";
}

/**
 * APIエンドポイント
 */
export const SALES_PERSONS_API_BASE = "/api/v1/sales-persons";

/**
 * 1ページあたりの表示件数
 */
export const DEFAULT_PER_PAGE = 20;
