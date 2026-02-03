/**
 * Допустимые значения типа учётной записи (ТЗ).
 * LDAP — пароль скрыт и хранится как null.
 * Локальная — пароль отображается и сохраняется.
 */
export const ACCOUNT_TYPE = {
  LDAP: 'LDAP',
  LOCAL: 'Локальная',
} as const

/** Типизированный тип с двумя возможными значениями (ТЗ) */
export type AccountType = (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE]

/** Элемент метки по ТЗ: массив объектов с полем text */
export interface LabelItem {
  text: string
}

/**
 * Учётная запись в хранилище (ТЗ, нормализованный вид).
 * Метка хранится как массив { text: элемент }.
 */
export interface Account {
  id: number
  /** Метки в виде массива объектов по ТЗ */
  labels: LabelItem[]
  type: AccountType
  login: string
  /** null для LDAP, строка для Локальная (ТЗ) */
  password: string | null
}

/** Ограничения полей по ТЗ */

export const ACCOUNT_LIMITS = {
  LABEL_MAX_LENGTH: 50,
  LOGIN_MAX_LENGTH: 100,
  PASSWORD_MAX_LENGTH: 100,
} as const

/** Варианты для выбора в UI по ТЗ (порядок: Локальная, LDAP) */
export const ACCOUNT_TYPE_OPTIONS: readonly AccountType[] = [
  ACCOUNT_TYPE.LOCAL,
  ACCOUNT_TYPE.LDAP,
] as const

/** Проверка, что строка — допустимое значение типа записи (ТЗ) */
export function isAccountType(value: string): value is AccountType {
  return value === ACCOUNT_TYPE.LDAP || value === ACCOUNT_TYPE.LOCAL
}
