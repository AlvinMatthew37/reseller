import { useMemo, useState } from 'react'

import { VENDOR_TYPE_OPTIONS } from '../../shared/domain'
import type { Vendor } from '../../shared/domain'
import type { VendorInput } from '../../shared/desktop-api'
import { useLanguage } from '../lib/language'

export interface VendorFormValues extends VendorInput {}

interface VendorFormProps {
  initialValues?: VendorFormValues
  submitLabel: string
  title: string
  description: string
  onSubmit: (values: VendorFormValues) => Promise<void> | void
  onCancel?: () => void
}

const emptyValues: VendorFormValues = {
  name: '',
  type: '',
  location: '',
  phoneNumber: '',
}

function normalize(values: VendorFormValues): VendorFormValues {
  return {
    name: values.name.trim(),
    type: values.type.trim(),
    location: values.location.trim(),
    phoneNumber: values.phoneNumber.trim(),
  }
}

function hasBlankRequiredField(values: VendorFormValues) {
  return Object.values(normalize(values)).some((value) => value.length === 0)
}

export function vendorToFormValues(vendor: Vendor): VendorFormValues {
  return {
    name: vendor.name,
    type: vendor.type,
    location: vendor.location,
    phoneNumber: vendor.phoneNumber,
  }
}

export function VendorForm({
  initialValues,
  submitLabel,
  title,
  description,
  onSubmit,
  onCancel,
}: VendorFormProps) {
  const { t } = useLanguage()
  const [values, setValues] = useState<VendorFormValues>(initialValues ?? emptyValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isInvalid = useMemo(() => hasBlankRequiredField(values), [values])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isInvalid || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await onSubmit(normalize(values))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('saveVendorError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t('vendorName')}
            <input
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder={t('exampleSate')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            {t('vendorType')}
            <select
              value={values.type}
              onChange={(event) => setValues((current) => ({ ...current, type: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            >
              <option value="" disabled>
                {t('selectVendorType')}
              </option>
              {VENDOR_TYPE_OPTIONS.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            {t('location')}
            <input
              value={values.location}
              onChange={(event) =>
                setValues((current) => ({ ...current, location: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder={t('exampleLocation')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            {t('phoneNumber')}
            <input
              value={values.phoneNumber}
              onChange={(event) =>
                setValues((current) => ({ ...current, phoneNumber: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder={t('examplePhone')}
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isInvalid || isSubmitting}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? t('saving') : submitLabel}
          </button>

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}
