import type { LabelItem } from '@/types/account'

const LABEL_SEPARATOR = ';'

/** По ТЗ: строка меток (разделитель ";") → массив [{ text: элемент }, ...]. Пустые после trim отбрасываются. */
export function parseLabelsString(value: string): LabelItem[] {
  if (!value.trim()) return []
  return value
    .split(LABEL_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text }))
}

/** Массив меток по ТЗ → строка для отображения в поле ввода */
export function formatLabelsToDisplay(labels: LabelItem[]): string {
  return labels.map((item) => item.text).join(` ${LABEL_SEPARATOR} `)
}
