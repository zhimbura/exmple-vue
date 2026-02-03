import type { AccountType } from '@/types/account'
import { ACCOUNT_LIMITS, ACCOUNT_TYPE } from '@/types/account'

export interface AccountFormErrors {
  label?: string
  login?: string
  password?: string
}

export interface AccountFormValues {
  labelString: string
  type: AccountType
  login: string
  password: string
}

/** Валидация одной учётной записи по ТЗ. Возвращает ошибки по полям (пустой объект = всё ок). */
export function validateAccountForm(values: AccountFormValues): AccountFormErrors {
  const errors: AccountFormErrors = {}

  if (values.labelString.length > ACCOUNT_LIMITS.LABEL_MAX_LENGTH) {
    errors.label = `Максимум ${ACCOUNT_LIMITS.LABEL_MAX_LENGTH} символов`
  }

  const loginTrimmed = values.login.trim()
  if (!loginTrimmed) {
    errors.login = 'Обязательное поле'
  } else if (values.login.length > ACCOUNT_LIMITS.LOGIN_MAX_LENGTH) {
    errors.login = `Максимум ${ACCOUNT_LIMITS.LOGIN_MAX_LENGTH} символов`
  }

  if (values.type === ACCOUNT_TYPE.LOCAL) {
    if (!values.password) {
      errors.password = 'Обязательное поле'
    } else if (values.password.length > ACCOUNT_LIMITS.PASSWORD_MAX_LENGTH) {
      errors.password = `Максимум ${ACCOUNT_LIMITS.PASSWORD_MAX_LENGTH} символов`
    }
  }

  return errors
}

/** Есть ли хотя бы одна ошибка валидации */
export function hasErrors(errors: AccountFormErrors): boolean {
  return Object.keys(errors).length > 0
}
