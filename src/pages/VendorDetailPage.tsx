import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import type { MenuItem, Vendor } from '../../shared/domain'
import type { MenuItemInput, VendorInput } from '../../shared/desktop-api'
import { MenuItemForm } from '../components/MenuItemForm'
import { VendorForm, vendorToFormValues } from '../components/VendorForm'

interface MenuModalProps {
  children: React.ReactNode
  title: string
  onClose: () => void
}

interface MenuCardImageProps {
  imagePath: string
  alt: string
}

function MenuModal({ children, title, onClose }: MenuModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 px-4 py-10">
      <div className="max-h-[calc(100vh-5rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function MenuCardImage({ imagePath, alt }: MenuCardImageProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    window.reseller.menus
      .getImagePreviewUrl(imagePath)
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
  }, [imagePath])

  if (!previewUrl) {
    return (
      <div className="flex aspect-square w-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-[10px] text-slate-500">
        Preview unavailable
      </div>
    )
  }

  return (
    <img
      src={previewUrl}
      alt={alt}
      className="aspect-square w-14 shrink-0 rounded-2xl object-cover"
    />
  )
}

export function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuLoading, setIsMenuLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)

  useEffect(() => {
    if (!vendorId) {
      setErrorMessage('Vendor id is missing.')
      setIsLoading(false)
      setIsMenuLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    window.reseller.vendors
      .getById(vendorId)
      .then((response) => {
        setVendor(response)
        if (!response) {
          setErrorMessage('Vendor not found.')
        }
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load vendor.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [vendorId])

  async function loadMenuItems() {
    if (!vendorId) {
      return
    }

    setIsMenuLoading(true)

    try {
      const response = await window.reseller.menus.listByVendor(vendorId)
      setMenuItems(response)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load menu items.')
    } finally {
      setIsMenuLoading(false)
    }
  }

  useEffect(() => {
    void loadMenuItems()
  }, [vendorId])

  async function handleSaveVendor(values: VendorInput) {
    if (!vendorId) {
      return
    }

    const updatedVendor = await window.reseller.vendors.update(vendorId, values)
    setVendor(updatedVendor)
  }

  async function handleCreateMenuItem(values: MenuItemInput) {
    if (!vendorId) {
      return
    }

    await window.reseller.menus.create(vendorId, values)
    setIsCreateMenuOpen(false)
    await loadMenuItems()
  }

  async function handleUpdateMenuItem(menuItemId: string, values: MenuItemInput) {
    await window.reseller.menus.update(menuItemId, values)
    setEditingMenuItemId(null)
    await loadMenuItems()
  }

  async function handleToggleMenuStatus(menuItem: MenuItem) {
    const nextStatus = menuItem.status === 'active' ? 'archived' : 'active'
    await window.reseller.menus.setStatus(menuItem.id, nextStatus)
    await loadMenuItems()
  }

  const editingMenuItem = useMemo(
    () => menuItems.find((menuItem) => menuItem.id === editingMenuItemId) ?? null,
    [editingMenuItemId, menuItems],
  )

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">Loading vendor details...</p>
      </section>
    )
  }

  if (!vendor) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">{errorMessage ?? 'Vendor not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to vendors
        </button>
      </section>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Link to="/vendors" className="font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to vendors
          </Link>
          <span>•</span>
          <span>Vendor detail</span>
        </div>

        {errorMessage ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
        ) : null}

        <VendorForm
          key={vendor.id}
          title={vendor.name}
          description="Edit the core vendor information."
          submitLabel="Save changes"
          initialValues={vendorToFormValues(vendor)}
          onSubmit={handleSaveVendor}
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Menu items</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {menuItems.length} item{menuItems.length === 1 ? '' : 's'} for this vendor
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateMenuOpen(true)}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Add menu item
              </button>
            </div>

            {isMenuLoading ? <p className="mt-6 text-sm text-slate-600">Loading menu items...</p> : null}

            {!isMenuLoading && menuItems.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
                No menu items yet. Add the first one using the button above.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              {menuItems.map((menuItem) => (
                <article
                  key={menuItem.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-emerald-300"
                >
                  <div className="flex items-center gap-3">
                    {menuItem.imagePath ? (
                      <MenuCardImage imagePath={menuItem.imagePath} alt={menuItem.name} />
                    ) : (
                      <div className="flex aspect-square w-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-[10px] text-slate-500">
                        No image
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-0.5 self-center">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold leading-none">{menuItem.name}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                            menuItem.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {menuItem.status}
                        </span>
                      </div>
                      <p className="text-[1.05rem] leading-none text-slate-600">
                        Rp {menuItem.price.toLocaleString('id-ID')}
                      </p>
                      {menuItem.description ? (
                        <p className="max-w-2xl text-sm leading-6 text-slate-600">
                          {menuItem.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="ml-auto flex w-24 shrink-0 flex-col items-stretch gap-1.5 self-center">
                      <button
                        type="button"
                        onClick={() => setEditingMenuItemId(menuItem.id)}
                        className="w-full rounded-full bg-white px-4 py-1.5 text-center text-sm font-medium leading-none text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleMenuStatus(menuItem)}
                        className="w-full rounded-full bg-slate-900 px-4 py-1.5 text-center text-sm font-medium leading-none text-white transition hover:bg-slate-700"
                      >
                        {menuItem.status === 'active' ? 'Archive' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Future schedule flag</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              `Baru jual` should not be set manually. We will calculate it automatically from the
              last scheduled day once the schedule feature is built. If a vendor is scheduled for
              tomorrow, it should stay marked for one week after that scheduled date.
            </p>
          </section>
        </div>
      </div>

      {isCreateMenuOpen ? (
        <MenuModal title="Add menu item" onClose={() => setIsCreateMenuOpen(false)}>
          <MenuItemForm
            title="Add menu item"
            description="Create menu entries with the latest price and description for this vendor."
            submitLabel="Add menu item"
            onSubmit={handleCreateMenuItem}
            onCancel={() => setIsCreateMenuOpen(false)}
          />
        </MenuModal>
      ) : null}

      {editingMenuItem ? (
        <MenuModal
          title={`Edit ${editingMenuItem.name}`}
          onClose={() => setEditingMenuItemId(null)}
        >
          <MenuItemForm
            key={editingMenuItem.id}
            title={`Edit ${editingMenuItem.name}`}
            description="Update the latest price, description, or image for this menu item."
            submitLabel="Save menu changes"
            initialValues={{
              name: editingMenuItem.name,
              description: editingMenuItem.description,
              price: editingMenuItem.price,
              imagePath: editingMenuItem.imagePath,
            }}
            onSubmit={(values) => handleUpdateMenuItem(editingMenuItem.id, values)}
            onCancel={() => setEditingMenuItemId(null)}
          />
        </MenuModal>
      ) : null}
    </>
  )
}
