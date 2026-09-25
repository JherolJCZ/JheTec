import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DriveCatalogData,
  ProductItem,
  CartItem,
  CarouselSlide,
} from './types/catalog';
import {
  fetchDriveFolderContents,
  DEFAULT_FOLDER_ID
} from './services/driveService';
import { GoogleAuthBanner } from './components/GoogleAuthBanner';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { CategoryNav } from './components/CategoryNav';
import { CategorySection } from './components/CategorySection';
import { CartDrawer } from './components/CartDrawer';
import { ProductModal } from './components/ProductModal';
import { FolderSettingsModal } from './components/FolderSettingsModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { WhatsAppSettingsModal } from './components/WhatsAppSettingsModal';
import { Footer } from './components/Footer';
import {
  FolderSearch,
  MessageCircle,
  FolderOpen,
  ArrowUp,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { getStoredWhatsappNumber, setStoredWhatsappNumber } from './utils/whatsapp';

export default function App() {
  // WhatsApp configuration state
  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    return getStoredWhatsappNumber();
  });
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState<boolean>(false);

  const handleSaveWhatsappNumber = (newNumber: string) => {
    const cleaned = setStoredWhatsappNumber(newNumber);
    setWhatsappNumber(cleaned);
  };

  // Admin Mode state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('drive_catalog_is_admin') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  const handleLoginAdminSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('drive_catalog_is_admin', 'true');
    setIsAdminLoginOpen(false);
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('drive_catalog_is_admin');
  };

  // Current Google Drive Folder ID
  const [folderId, setFolderId] = useState<string>(() => {
    return localStorage.getItem('drive_catalog_folder_id') || DEFAULT_FOLDER_ID;
  });

  // App UI & Data state
  const [catalog, setCatalog] = useState<DriveCatalogData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers state
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Shopping cart items state (persisted to localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('drive_catalog_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('drive_catalog_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Handle scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch catalog contents with cache busting
  const loadCatalogData = useCallback(
    async (targetFolderId: string, forceRefresh: boolean = false) => {
      setIsSyncing(true);
      setError(null);
      try {
        const data = await fetchDriveFolderContents(targetFolderId, forceRefresh);
        setCatalog(data);
        if (forceRefresh) {
          const catCount = data.categories?.length || 0;
          const prodCount = data.totalProducts || 0;
          setSyncToast(`¡Catálogo sincronizado! (${prodCount} productos en ${catCount} colecciones)`);
          setTimeout(() => setSyncToast(null), 4500);
        }
      } catch (err: any) {
        console.error('Error cargando catálogo:', err);
        setError(err.message || 'Error al conectar con Google Drive');
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    []
  );

  // Initialize and load catalog on start
  useEffect(() => {
    loadCatalogData(folderId, false);
  }, [folderId, loadCatalogData]);

  // Handle folder ID change
  const handleSaveFolderId = (newId: string) => {
    setFolderId(newId);
    localStorage.setItem('drive_catalog_folder_id', newId);
    loadCatalogData(newId, true);
  };

  // Cart operations
  const handleAddToCart = (product: ProductItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Calculate total items in cart
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Set of product IDs currently in cart for quick lookup
  const cartProductIds = useMemo(() => {
    return new Set(cartItems.map((item) => item.product.id));
  }, [cartItems]);

  // Filtered categories and products based on search and category tab
  const filteredCategories = useMemo(() => {
    if (!catalog) return [];

    let result = catalog.categories;

    // Filter by category tab
    if (selectedCategory !== 'all') {
      result = result.filter((cat) => cat.id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result
        .map((cat) => {
          const matchingItems = cat.items.filter(
            (item) =>
              item.displayName.toLowerCase().includes(q) ||
              item.code.toLowerCase().includes(q) ||
              item.categoryName.toLowerCase().includes(q)
          );
          return {
            ...cat,
            items: matchingItems,
          };
        })
        .filter((cat) => cat.items.length > 0);
    }

    return result;
  }, [catalog, selectedCategory, searchQuery]);

  // Total matching products count
  const matchingProductsCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredCategories]);

  // Extract all products for category nav count badge
  const allCategoryItemCount = useMemo(() => {
    if (!catalog) return 0;
    return catalog.categories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [catalog]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white relative">
      {/* Dynamic Deep Dark Tech Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="tech-dots-overlay" />
        <div className="tech-lines-overlay" />
      </div>

      {/* Top Admin Bar (Only visible after Admin login) */}
      <GoogleAuthBanner
        onRefresh={() => loadCatalogData(folderId, true)}
        isSyncing={isSyncing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAdmin={isAdmin}
        onLogoutAdmin={handleLogoutAdmin}
        whatsappNumber={whatsappNumber}
        onSaveWhatsapp={handleSaveWhatsappNumber}
      />

      {/* Main Sticky Navbar with Frosted Dark Glass Theme */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        folderName={catalog?.folderName || 'CATÁLOGO VIRTUAL'}
        onRefreshCatalog={() => loadCatalogData(folderId, true)}
        isSyncing={isSyncing}
      />

      {/* Floating Sync Feedback Toast */}
      {syncToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-fade-in bg-slate-900/95 text-emerald-300 border border-emerald-500/50 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Main Body Content */}
      <main className="flex-1 relative z-10">
        {/* Loading State */}
        {isLoading && (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-center px-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                <FolderSync className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 blur-sm animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Sincronizando con Google Drive
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Cargando colecciones de fotos y organizando el catálogo digital...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && !catalog && (
          <div className="max-w-xl mx-auto my-16 px-4">
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-rose-500/30 text-center space-y-4 shadow-2xl backdrop-blur-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FolderSearch className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No se pudo cargar la carpeta</h3>
                <p className="text-sm text-rose-300 mt-1">{error}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Asegúrate de que la carpeta de Google Drive esté configurada como{' '}
                  <strong className="text-slate-200">"Cualquier persona con el enlace puede ver"</strong>.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cambiar Carpeta
                </button>
                <button
                  onClick={() => loadCatalogData(folderId, true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loaded Catalog Content */}
        {!isLoading && catalog && (
          <>
            {/* Hero Carousel (Only shown when not searching and on 'all' category) */}
            {selectedCategory === 'all' && !searchQuery.trim() && catalog.carouselImages.length > 0 && (
              <HeroCarousel
                slides={catalog.carouselImages}
                onSelectSlide={(slide: CarouselSlide) => {
                  const productCandidate: ProductItem = {
                    id: slide.id,
                    name: slide.name,
                    displayName: slide.title,
                    imageUrl: slide.imageUrl,
                    highResUrl: slide.highResUrl,
                    webViewLink: slide.webViewLink,
                    categoryId: 'carousel',
                    categoryName: 'Destacados',
                    code: 'DEST-000',
                    description: slide.subtitle,
                  };
                  setSelectedProduct(productCandidate);
                }}
              />
            )}

            {/* Category Filter Pills & Search feedback */}
            <CategoryNav
              categories={catalog.categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              totalItemsCount={allCategoryItemCount}
            />

            {/* Catalog Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
              {/* Search Active Notification Bar */}
              {searchQuery.trim() && (
                <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-3.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>
                      Resultados para <strong className="text-white">"{searchQuery}"</strong>:{' '}
                      <span className="text-cyan-400 font-bold">{matchingProductsCount}</span> producto(s) encontrado(s)
                    </span>
                  </div>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Borrar búsqueda
                  </button>
                </div>
              )}

              {/* No items found state */}
              {filteredCategories.length === 0 ? (
                <div className="py-20 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No se encontraron productos</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery.trim()
                      ? `No hay fotos o productos que coincidan con "${searchQuery}". Intenta con otro término.`
                      : 'Esta categoría aún no contiene fotos en Google Drive.'}
                  </p>
                  {(searchQuery.trim() || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                    >
                      Ver todo el catálogo
                    </button>
                  )}
                </div>
              ) : (
                /* Category Sections with Product Grids */
                filteredCategories.map((category) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    onAddToCart={handleAddToCart}
                    onQuickView={setSelectedProduct}
                    cartProductIds={cartProductIds}
                    whatsappNumber={whatsappNumber}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        folderName={catalog?.folderName || 'CATÁLOGO VIRTUAL'}
        totalProducts={catalog?.totalProducts || 0}
        totalCategories={catalog?.categories?.length || 0}
        lastSynced={catalog?.lastSynced || new Date()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        whatsappNumber={whatsappNumber}
        onOpenWhatsappSettings={() => setIsWhatsappModalOpen(true)}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        catalogName={catalog?.folderName || 'Catálogo Virtual'}
        whatsappNumber={whatsappNumber}
      />

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        isInCart={selectedProduct ? cartProductIds.has(selectedProduct.id) : false}
        whatsappNumber={whatsappNumber}
      />

      {/* Folder Settings / Drive Config Modal */}
      <FolderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentFolderId={folderId}
        onSave={handleSaveFolderId}
        onRefresh={() => loadCatalogData(folderId, true)}
        isSyncing={isSyncing}
        lastSynced={catalog?.lastSynced || new Date()}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => {
          setIsSettingsOpen(false);
          setIsAdminLoginOpen(true);
        }}
        onLogoutAdmin={handleLogoutAdmin}
        whatsappNumber={whatsappNumber}
        onSaveWhatsapp={handleSaveWhatsappNumber}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginAdminSuccess}
      />

      {/* Dedicated WhatsApp Settings Modal */}
      <WhatsAppSettingsModal
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
        currentWhatsappNumber={whatsappNumber}
        onSave={handleSaveWhatsappNumber}
        onRefresh={() => loadCatalogData(folderId, true)}
      />

      {/* Floating Action Buttons (WhatsApp + Scroll To Top) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Volver arriba"
            className="w-11 h-11 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* WhatsApp Direct Inquiries Floating Button */}
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent('¡Hola! Estuve viendo el catálogo virtual y me gustaría hacer una consulta.')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full" />
          <MessageCircle className="w-4 h-4 fill-white shrink-0" />
          <span className="hidden sm:inline">¿Dudas? Escríbenos</span>
        </a>
      </div>
    </div>
  );
}

function FolderSync(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      <path d="m11 13 3 3 3-3"/>
      <path d="M14 16v-6"/>
    </svg>
  );
}
