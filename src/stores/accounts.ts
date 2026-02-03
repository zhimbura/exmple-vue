import { defineStore } from 'pinia'
import type { Account, AccountType } from '@/types/account'
import { ACCOUNT_TYPE } from '@/types/account'
import { parseLabelsString } from '@/utils/labels'

export const useAccountsStore = defineStore('accounts', {
  state: (): { accounts: Account[]; nextId: number } => ({
    accounts: [],
    nextId: 1,
  }),

  actions: {
    /** По ТЗ: при отсутствии записей — одна пустая запись по умолчанию */
    ensureDefaultAccount(): void {
      if (this.accounts.length === 0) this.addAccount()
    },

    addAccount(): void {
      this.accounts.push({
        id: this.nextId++,
        labels: [],
        type: ACCOUNT_TYPE.LOCAL,
        login: '',
        password: '',
      })
    },

    removeAccount(id: number): void {
      this.accounts = this.accounts.filter((a) => a.id !== id)
    },

    /** По ТЗ: обновление записи; метку принимает строкой, сохраняет массивом { text } */
    updateAccount(
      id: number,
      payload: {
        labelString: string
        type: AccountType
        login: string
        password: string | null
      }
    ): void {
      const account = this.accounts.find((a) => a.id === id)
      if (!account) return
      account.labels = parseLabelsString(payload.labelString)
      account.type = payload.type
      account.login = payload.login
      account.password = payload.password
    },
  },
  persist: true,
})
