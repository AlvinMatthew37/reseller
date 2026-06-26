import { useEffect, useMemo, useState } from 'react'

import type { MenuItemInput } from '../../shared/desktop-api'
import { useLanguage } from '../lib/language'

interface MenuItemFormProps {
  initialValues?: MenuItemInput
  title: string
  description: string
  submitLabel: string
  onSubmit: (values: MenuItemInput) => Promise<void> | void
  onCancel?: () => void
}

const emptyValues: MenuItemInput = {
  name: '',
  description: '',
  price: 0,
  imagePath: null,
}

function normalize(values: MenuItemInput): MenuItemInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    imagePath: values.imagePath?.trim() ? values.imagePath.trim() : null,
  }
}

export function MenuItemForm({
  initialValues,
  title,
  description,
  submitLabel,
  onSubmit,
  onCancel,
}: MenuItemFormProps) {
  const { t } = useLanguage()
  const [values, setValues] = useState<MenuItemInput>(initialValues ?? emptyValues)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelectingImage, setIsSelectingImage] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isInvalid = useMemo(() => {
    const normalized = normalize(values)
    return normalized.name.length === 0 || Number.isNaN(normalized.price) || normalized.price <= 0
  }, [values])

  useEffect(() => {
    if (!values.imagePath) {
      setPreviewUrl(null)
      return
    }

    let isActive = true

    window.reseller.menus
      .getImagePreviewUrl(values.imagePath)
      .then((url) => {
        if (isActive) {
          setPreviewUrl(url)
        }
      })
      .catch(() => {
        if (isActive) {
          setPreviewUrl(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [values.imagePath])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isInvalid || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await onSubmit(normalize(values))
      if (!initialValues) {
        setValues(emptyValues)
        setPreviewUrl(null)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('saveMenuError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSelectImage() {
    setIsSelectingImage(true)
    setErrorMessage(null)

    try {
      const selectedImagePath = await window.reseller.menus.selectImage()
      if (selectedImagePath) {
        setValues((current) => ({ ...current, imagePath: selectedImagePath }))
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to select menu image.')
    } finally {
      setIsSelectingImage(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t('menuName')}
            <input
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder={t('exampleMenuName')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            {t('latestPrice')}
            <input
              type="number"
              min="0"
              step="500"
              value={values.price || ''}
              onChange={(event) =>
                setValues((current) => ({ ...current, price: Number(event.target.value) }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder={t('examplePrice')}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Menu description (optional)
          <textarea
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            rows={3}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            placeholder="Example: Crispy rice, spicy sambal, and a fried egg"
          />
        </label>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSelectImage()}
              disabled={isSelectingImage}
              className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-200"
            >
              {isSelectingImage ? t('selectingImage') : t('uploadImage')}
            </button>

            {values.imagePath ? (
              <button
                type="button"
                onClick={() => {
                  setValues((current) => ({ ...current, imagePath: null }))
                  setPreviewUrl(null)
                }}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                {t('removeImage')}
              </button>
            ) : null}
          </div>

          {values.imagePath ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">{t('selectedImage')}</p>
              {previewUrl ? (
                <div className="mt-3">
                  <img
                    src={previewUrl}
                    alt="Selected menu preview"
                    className="aspect-square w-full rounded-2xl object-cover"
                  />
                </div>
              ) : (
                <div className="mt-3 flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">
                  {t('previewUnavailable')}
                </div>
              )}
              <p className="mt-3 break-all text-xs leading-6 text-slate-500">{values.imagePath}</p>
            </div>
          ) : (
            <p className="text-xs leading-6 text-slate-500">
              {t('noImageSelected')}
            </p>
          )}
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
