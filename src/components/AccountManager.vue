<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAccountForm } from '@/composables/useAccountForm'
import { ACCOUNT_TYPE_OPTIONS, ACCOUNT_TYPE, isAccountType } from '@/types/account'

const {
  accounts,
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
} = useAccountForm()

const UNLOAD_MESSAGE = 'Закрытие или обновление страницы приведёт к потере несохранённых данных. Продолжить?'

function onBeforeUnload(e: BeforeUnloadEvent): void {
  const hasInvalid = flushFormToStore()
  if (hasInvalid) {
    e.preventDefault()
    e.returnValue = UNLOAD_MESSAGE
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') flushFormToStore()
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

const hasLocalAccounts = computed(() =>
  accounts.value.some((acc) => getValues(acc.id).type === ACCOUNT_TYPE.LOCAL)
)

const pendingDeleteId = ref<number | null>(null)

function openDeleteConfirm(id: number): void {
  pendingDeleteId.value = id
}

function closeDeleteConfirm(): void {
  pendingDeleteId.value = null
}

function confirmDelete(): void {
  if (pendingDeleteId.value !== null) {
    removeAccount(pendingDeleteId.value)
    closeDeleteConfirm()
  }
}

const LABEL_TEXTAREA_MIN_HEIGHT_PX = 42

function resizeLabelTextarea(el: HTMLTextAreaElement | null): void {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.max(LABEL_TEXTAREA_MIN_HEIGHT_PX, el.scrollHeight)}px`
}

function onLabelInput(accountId: number, e: Event): void {
  const target = e.target as HTMLTextAreaElement
  setValues(accountId, { labelString: target.value })
  resizeLabelTextarea(target)
}

function onLabelRef(el: unknown): void {
  if (el instanceof HTMLTextAreaElement) {
    nextTick(() => resizeLabelTextarea(el))
  }
}

function onTypeSelect(accountId: number, rawValue: string): void {
  if (isAccountType(rawValue)) {
    setValues(accountId, { type: rawValue })
    onTypeChange(accountId)
  }
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto font-sans text-gray-800">
    <header class="flex items-center gap-4 mb-6">
      <h1 class="text-xl font-bold">Учетные записи</h1>
      <button
        type="button"
        aria-label="Добавить учетную запись"
        @click="addAccount"
        class="flex items-center justify-center w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </header>

    <div
      class="bg-blue-50 border border-blue-100 rounded-md p-3 mb-8 flex items-start gap-3"
      role="status"
    >
      <div class="mt-0.5 text-gray-500 shrink-0" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <p class="text-sm text-gray-700">
        Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;
      </p>
    </div>

    <div class="grid grid-cols-[1fr_160px_1fr_1fr_40px] gap-4 mb-2 px-1">
      <div class="text-xs font-medium text-gray-400">Метки</div>
      <div class="text-xs font-medium text-gray-400">Тип записи</div>
      <div class="text-xs font-medium text-gray-400">Логин</div>
      <div v-if="hasLocalAccounts" class="text-xs font-medium text-gray-400">Пароль</div>
      <div v-else class="text-xs font-medium text-gray-400"></div>
      <div />
    </div>

    <ul class="space-y-4 list-none p-0 m-0">
      <li
        v-for="account in accounts"
        :key="account.id"
        class="grid grid-cols-[1fr_160px_1fr_1fr_40px] gap-4 items-start"
      >
        <!-- Метка -->
        <div>
          <textarea
            :ref="onLabelRef"
            :value="getValues(account.id).labelString"
            @input="onLabelInput(account.id, $event)"
            @blur="validateAndSave(account.id)"
            :aria-invalid="!!formErrors[account.id]?.label"
            :aria-describedby="formErrors[account.id]?.label ? `err-label-${account.id}` : undefined"
            rows="1"
            :class="inputClass(account.id, 'label')"
            class="resize-none label-textarea min-h-[42px]"
            placeholder="Метка (необязательно)"
            maxlength="50"
          />
          <p
            v-if="formErrors[account.id]?.label"
            :id="`err-label-${account.id}`"
            class="mt-1 text-xs text-red-500"
            role="alert"
          >
            {{ formErrors[account.id]?.label }}
          </p>
        </div>

        <!-- Тип записи -->
        <div class="relative">
          <select
            :value="getValues(account.id).type"
            @change="onTypeSelect(account.id, ($event.target as HTMLSelectElement).value)"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[42px] appearance-none bg-white pr-8"
          >
            <option
              v-for="opt in ACCOUNT_TYPE_OPTIONS"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>
          <div
            class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <!-- Логин (при LDAP занимает место логина + пароля) -->
        <div :class="{ 'col-span-2': getValues(account.id).type === ACCOUNT_TYPE.LDAP }">
          <input
            type="text"
            :value="getValues(account.id).login"
            @input="setValues(account.id, { login: ($event.target as HTMLInputElement).value })"
            @blur="validateAndSave(account.id)"
            :aria-invalid="!!formErrors[account.id]?.login"
            :aria-required="true"
            :class="inputClass(account.id, 'login')"
            placeholder="Логин"
            maxlength="100"
          />
          <p
            v-if="formErrors[account.id]?.login"
            class="mt-1 text-xs text-red-500"
            role="alert"
          >
            {{ formErrors[account.id]?.login }}
          </p>
        </div>

        <!-- Пароль (только для Локальная; при LDAP колонка не показывается) -->
        <div v-if="getValues(account.id).type === ACCOUNT_TYPE.LOCAL">
          <div class="relative">
            <input
              :type="showPassword[account.id] ? 'text' : 'password'"
              :value="getValues(account.id).password"
              @input="setValues(account.id, { password: ($event.target as HTMLInputElement).value })"
              @blur="validateAndSave(account.id)"
              :aria-invalid="!!formErrors[account.id]?.password"
              :aria-required="true"
              :class="inputClass(account.id, 'password')"
              class="pr-10"
              placeholder="Пароль"
              maxlength="100"
            />
            <button
              type="button"
              :aria-label="showPassword[account.id] ? 'Скрыть пароль' : 'Показать пароль'"
              @click="togglePasswordVisibility(account.id)"
              class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <svg
                v-if="!showPassword[account.id]"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <p
            v-if="formErrors[account.id]?.password"
            class="mt-1 text-xs text-red-500"
            role="alert"
          >
            {{ formErrors[account.id]?.password }}
          </p>
        </div>

        <!-- Удаление -->
        <div class="flex items-center justify-center min-h-[42px]">
          <button
            type="button"
            aria-label="Удалить учетную запись"
            @click="openDeleteConfirm(account.id)"
            class="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </li>
    </ul>

    <!-- Диалог подтверждения удаления -->
    <Teleport to="body">
      <div
        v-if="pendingDeleteId !== null"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        @click="closeDeleteConfirm"
        @keydown.escape="closeDeleteConfirm"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6"
          @click.stop
        >
          <h2 id="delete-dialog-title" class="text-lg font-semibold text-gray-800 mb-2">
            Удалить запись?
          </h2>
          <p class="text-sm text-gray-600 mb-6">
            Учётная запись будет удалена. Это действие нельзя отменить.
          </p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
              @click="closeDeleteConfirm"
            >
              Отмена
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
              @click="confirmDelete"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.label-textarea {
  min-height: 42px;
  overflow-y: hidden;
  box-sizing: border-box;
}
input::placeholder,
textarea::placeholder {
  color: #9ca3af;
}
</style>
