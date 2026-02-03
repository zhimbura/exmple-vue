import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountsStore } from '@/stores/accounts'
import { formatLabelsToDisplay } from '@/utils/labels'
import {
  validateAccountForm,
  hasErrors,
  type AccountFormErrors,
  type AccountFormValues,
} from '@/utils/validation'
import { ACCOUNT_TYPE } from '@/types/account'

export function useAccountForm() {
  const store = useAccountsStore()
  store.ensureDefaultAccount()
  const { accounts } = storeToRefs(store)

  const formValues = ref<Record<number, AccountFormValues>>({})
  const formErrors = ref<Record<number, AccountFormErrors>>({})
  const showPassword = ref<Record<number, boolean>>({})

  function getFormValuesFromStore(accountId: number): AccountFormValues {
    const acc = accounts.value.find((a) => a.id === accountId)
    if (!acc) return { labelString: '', type: ACCOUNT_TYPE.LOCAL, login: '', password: '' }
    return {
      labelString: formatLabelsToDisplay(acc.labels),
      type: acc.type,
      login: acc.login,
      password: acc.password ?? '',
    }
  }

  function ensureFormState(): void {
    const nextValues: Record<number, AccountFormValues> = {}
    const nextErrors: Record<number, AccountFormErrors> = {}
    const nextShow: Record<number, boolean> = {}
    for (const acc of accounts.value) {
      nextValues[acc.id] = formValues.value[acc.id] ?? getFormValuesFromStore(acc.id)
      nextErrors[acc.id] = formErrors.value[acc.id] ?? {}
      nextShow[acc.id] = showPassword.value[acc.id] ?? false
    }
    formValues.value = nextValues
    formErrors.value = nextErrors
    showPassword.value = nextShow
  }

  watch(
    () => accounts.value.map((a) => a.id).join(','),
    ensureFormState,
    { immediate: true }
  )

  function getValues(id: number): AccountFormValues {
    return formValues.value[id] ?? getFormValuesFromStore(id)
  }

  function setValues(id: number, values: Partial<AccountFormValues>): void {
    const current = getValues(id)
    const next = { ...current, ...values }
    formValues.value = { ...formValues.value, [id]: next }
  }

  function validateAndSave(id: number): void {
    const values = getValues(id)
    const errors = validateAccountForm(values)
    formErrors.value[id] = errors
    if (!hasErrors(errors)) {
      store.updateAccount(id, {
        labelString: values.labelString,
        type: values.type,
        login: values.login.trim(),
        password: values.type === ACCOUNT_TYPE.LOCAL ? values.password : null,
      })
    }
  }

  function onTypeChange(id: number): void {
    const values = getValues(id)
    if (values.type === ACCOUNT_TYPE.LDAP) setValues(id, { password: '' })
    validateAndSave(id)
  }

  function addAccount(): void {
    store.addAccount()
    const last = accounts.value[accounts.value.length - 1]
    if (last) {
      formValues.value = {
        ...formValues.value,
        [last.id]: {
          labelString: '',
          type: ACCOUNT_TYPE.LOCAL,
          login: '',
          password: '',
        },
      }
      formErrors.value = { ...formErrors.value, [last.id]: {} }
      showPassword.value = { ...showPassword.value, [last.id]: false }
    }
  }

  function removeAccount(id: number): void {
    store.removeAccount(id)
    const next = { ...formValues.value }
    const nextErr = { ...formErrors.value }
    const nextShow = { ...showPassword.value }
    delete next[id]
    delete nextErr[id]
    delete nextShow[id]
    formValues.value = next
    formErrors.value = nextErr
    showPassword.value = nextShow
  }

  function togglePasswordVisibility(id: number): void {
    showPassword.value[id] = !showPassword.value[id]
  }

  function inputClass(id: number, field: keyof AccountFormErrors): string {
    const base =
      'w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[42px] transition-colors'
    const hasError = formErrors.value[id]?.[field]
    return hasError ? `${base} border-red-500 focus:ring-red-400` : `${base} border-gray-300`
  }

  function hasMeaningfulInput(values: AccountFormValues): boolean {
    if (values.labelString.trim()) return true
    if (values.login.trim()) return true
    if (values.type === ACCOUNT_TYPE.LOCAL && values.password) return true
    return false
  }

  /** По ТЗ п. 2: сохраняет в store только записи, прошедшие валидацию. true = есть невалидные с данными (потеря при уходе). */
  function flushFormToStore(): boolean {
    let hasInvalidWithData = false
    for (const acc of accounts.value) {
      const values = getValues(acc.id)
      const errors = validateAccountForm(values)
      if (hasErrors(errors)) {
        if (hasMeaningfulInput(values)) hasInvalidWithData = true
        continue
      }
      store.updateAccount(acc.id, {
        labelString: values.labelString,
        type: values.type,
        login: values.login.trim(),
        password: values.type === ACCOUNT_TYPE.LOCAL ? values.password : null,
      })
    }
    return hasInvalidWithData
  }

  return {
    accounts,
    formValues,
    formErrors,
    showPassword,
    getValues,
    setValues,
    validateAndSave,
    onTypeChange,
    addAccount,
    removeAccount,
    togglePasswordVisibility,
    inputClass,
    flushFormToStore,
  }
}
