import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { VENDOR_TYPE_OPTIONS } from '../../shared/domain'
import type { Vendor } from '../../shared/domain'
import type { VendorInput } from '../../shared/desktop-api'
import { VendorForm } from '../components/VendorForm'
import { useLanguage } from '../lib/language'

type SortOption = 'name-asc' | 'name-desc'

export function VendorsPage() {
  const { t } = useLanguage()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOption, setSortOption] = useState<SortOption>('name-asc')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function loadVendors() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const nextVendors = await window.reseller.vendors.list()
      setVendors(nextVendors)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('loadingVendors'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadVendors()
  }, [])

  const filteredVendors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const visibleVendors = vendors.filter((vendor) => {
      const matchesSearch =
        normalizedSearch.length === 0 || vendor.name.toLowerCase().includes(normalizedSearch)
      const matchesType = typeFilter === 'all' || vendor.type === typeFilter

      return matchesSearch && matchesType
    })

    visibleVendors.sort((left, right) => {
      const comparison = left.name.localeCompare(right.name)
      return sortOption === 'name-asc' ? comparison : -comparison
    })

    return visibleVendors
  }, [searchTerm, sortOption, typeFilter, vendors])

  async function handleCreateVendor(values: VendorInput) {
    await window.reseller.vendors.create(values)
    setShowCreateForm(false)
    await loadVendors()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
      <div className="space-y-6">
        {showCreateForm ? (
          <VendorForm
            title="Add vendor"
            description="Create the vendor master data your schedule will depend on later."
            submitLabel="Create vendor"
            onSubmit={handleCreateVendor}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{t('vendorMasterData')}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t('vendorMasterDescription')}</p>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="mt-4 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              {t('addVendor')}
            </button>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{t('filters')}</h2>

          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium">
              {t('searchVendorName')}
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                placeholder={t('typeVendorName')}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              {t('filterByVendorType')}
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="all">{t('allVendorTypes')}</option>
                {VENDOR_TYPE_OPTIONS.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              {t('sortVendors')}
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="name-asc">{t('nameAZ')}</option>
                <option value="name-desc">{t('nameZA')}</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('vendorList')}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {filteredVendors.length} {t('vendors')} {t('shown')}
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
        ) : null}

        {isLoading ? <p className="mt-6 text-sm text-slate-600">{t('loadingVendors')}</p> : null}

        {!isLoading && filteredVendors.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            {t('noVendorsMatch')}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {filteredVendors.map((vendor) => (
            <article
              key={vendor.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{vendor.name}</h3>
                  <p className="text-sm text-slate-600">{vendor.type}</p>
                  <p className="text-sm text-slate-600">{vendor.location}</p>
                  <p className="text-sm text-slate-600">{vendor.phoneNumber}</p>
                  <p className="text-xs text-slate-500">
                    `Baru jual` will be calculated automatically from the schedule in a later step.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/vendors/${vendor.id}`}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
