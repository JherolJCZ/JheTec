import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  DriveCatalogData,
  ProductItem,
  CartItem,
  CarouselSlide,
} from './types/catalog';
import { initAuth, getAccessToken } from './services/firebase';
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
  Sparkles
} from 'lucide-react';
import { getStoredWhatsappNumber, setStoredWhatsappNumber } from './utils/whatsapp';

export default function App() {
  // Authentication & Drive token state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // WhatsApp configuration state
  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    return getStoredWhatsappNumber();
  });
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState<boolean>(false);

  const handleSaveWhatsappNumber = (newNumber: string) => {
    const cleaned = setStoredWhatsappNumber(newNumber);
    setWhatsappNumber(cleaned);
  };

  // Drive Folder configuration
  const [folderId, setFolderId] = useState<string>(() => {
    return localStorage.getItem('drive_catalog_folder_id') || DEFAULT_FOLDER_ID;
  });

  // Catalog data state
  const [catalog, setCatalog] = useState<DriveCatalogData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Shopping Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('drive_catalog_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modal / Lightbox state
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('catalog_is_admin') === 'true';
  });

  const handleLoginAdminSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('catalog_is_admin', 'true');
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('catalog_is_admin');
  };

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Persist cart
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

  // Fetch catalog contents
  const loadCatalogData = useCallback(
    async (targetFolderId: string, currentToken?: string | null) => {
      setIsSyncing(true);
      setError(null);
      try {
        const effectiveToken = currentToken !== undefined ? currentToken : getAccessToken();
        const data = await fetchDriveFolderContents(targetFolderId, effectiveToken);
        setCatalog(data);
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

  // Initialize Auth listener and load catalog
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        loadCatalogData(folderId, authToken);
      },
      () => {
        setUser(null);
        setToken(null);
        loadCatalogData(folderId, null);
      }
    );

    return () => unsubscribe();
  }, [folderId, loadCatalogData]);

  // Handle folder ID change
  const handleSaveFolderId = (newId: string) => {
    setFolderId(newId);
    localStorage.setItem('drive_catalog_folder_id', newId);
    loadCatalogData(newId, token);
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

  const cartProductIds = useMemo(() => {
    return new Set(cartItems.map((item) => item.product.id));
  }, [cartItems]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Filter categories and products based on search query and active category filter
  const filteredCategories = useMemo(() => {
    if (!catalog) return [];
    const query = searchQuery.trim().toLowerCase();

    return catalog.categories
      .filter((cat) => {
        if (activeCategoryId && cat.id !== activeCategoryId) {
          return false;
        }
        return true;
      })
      .map((cat) => {
        if (!query) return cat;

        const filteredItems = cat.items.filter((item) => {
          const matchName = item.displayName.toLowerCase().includes(query);
          const matchCode = item.code?.toLowerCase().includes(query);
          const matchCat = item.categoryName.toLowerCase().includes(query);
          const matchDesc = item.description?.toLowerCase().includes(query);
          return matchName || matchCode || matchCat || matchDesc;
        });

        return {
          ...cat,
          items: filteredItems,
        };
      })
      .filter((cat) => {
        if (!query) return true;
        return cat.items.length > 0 || cat.name.toLowerCase().includes(query);
      });
  }, [catalog, searchQuery, activeCategoryId]);

  const totalFilteredProducts = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  }, [filteredCategories]);

  // Handle slide click to open modal
  const handleOpenSlideModal = (slide: CarouselSlide) => {
    setSelectedProduct({
      id: slide.id,
      name: slide.name,
      displayName: slide.title,
      imageUrl: slide.imageUrl,
      highResUrl: slide.highResUrl,
      webViewLink: slide.webViewLink,
      categoryId: 'root-carousel',
      categoryName: 'Destacados',
      description: slide.subtitle,
    });
  };

  const handleScrollToCategories = () => {
    const el = document.getElementById('catalog-sections-start');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-100 bg-[#060813]">
      {/* Dynamic Luminous Dark Canvas: Morphing aurora blobs + fine cyber overlays */}
      <div className="fluid-canvas-container">
        <div className="liquid-blob-1" />
        <div className="liquid-blob-2" />
        <div className="liquid-blob-3" />
        <div className="liquid-blob-accent" />
        <div className="tech-dots-overlay" />
        <div className="tech-lines-overlay" />
      </div>

      {/* Top Contact & Sync Bar (Only visible after Admin login) */}
      <GoogleAuthBanner
        user={user}
        hasToken={!!token}
        onRefresh={() => loadCatalogData(folderId, token)}
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
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Loading State Skeleton */}
        {isLoading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="aspect-[21/9] frosted-card animate-pulse rounded-3xl" />
            <div className="h-10 frosted-card animate-pulse rounded-2xl w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square frosted-card animate-pulse rounded-3xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Hero Carousel with root loose images */}
            {catalog && catalog.carouselImages.length > 0 && !searchQuery && (
              <HeroCarousel
                slides={catalog.carouselImages}
                onOpenImage={handleOpenSlideModal}
                onExploreClick={handleScrollToCategories}
                whatsappNumber={whatsappNumber}
              />
            )}

            {/* Anchor point for smooth scrolling */}
            <div id="catalog-sections-start" />

            {/* Category Navigation Pills */}
            {catalog && catalog.categories.length > 0 && (
              <CategoryNav
                categories={catalog.categories}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
                totalProducts={catalog.totalProducts}
              />
            )}

            {/* Catalog Grid Section Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
              {/* Search results indicator */}
              {searchQuery && (
                <div className="mb-6 p-4 frosted-card rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200">
                    <FolderSearch className="w-4 h-4 text-cyan-400" />
                    <span>
                      Resultados para <strong className="text-cyan-300">"{searchQuery}"</strong>: {totalFilteredProducts} producto(s) encontrado(s)
                    </span>
                  </div>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}

              {/* Category Sections (Subfolders from Google Drive) */}
              {filteredCategories.length > 0 ? (
                <div className="space-y-6">
                  {filteredCategories.map((category) => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      onAddToCart={handleAddToCart}
                      onOpenModal={setSelectedProduct}
                      cartProductIds={cartProductIds}
                      whatsappNumber={whatsappNumber}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 frosted-card rounded-3xl my-8">
                  <FolderOpen className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">
                    No se encontraron productos
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                    {searchQuery
                      ? `No hay coincidencias para "${searchQuery}". Intenta con otro término o limpia los filtros.`
                      : 'Esta carpeta de Google Drive aún no tiene imágenes o subcarpetas.'}
                  </p>
                  <div className="flex justify-center gap-3">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/60 transition-all border border-cyan-400/30 active:scale-95"
                      >
                        Ver todos los productos
                      </button>
                    )}
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cambiar Carpeta Compartida
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        folderName={catalog?.folderName || 'CATÁLOGO VIRTUAL'}
        totalProducts={catalog?.totalProducts || 0}
        whatsappNumber={whatsappNumber}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        whatsappNumber={whatsappNumber}
      />

      {/* Product Detail Lightbox Modal */}
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
        onRefresh={() => loadCatalogData(folderId, token)}
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
        onRefresh={() => loadCatalogData(folderId, token)}
      />

      {/* Floating Action Buttons (WhatsApp + Scroll To Top) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Volver arriba"
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-white/20 backdrop-blur-md shadow-lg shadow-black/50 transition-all active:scale-90"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        {/* Floating WhatsApp Quick Contact Button */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            '¡Hola! 👋 Estoy viendo su catálogo web y deseo hacer una consulta.'
          )}`}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-2xl shadow-xl shadow-emerald-950/80 hover:scale-105 active:scale-95 transition-all border border-emerald-400/40"
        >
          <MessageCircle className="w-5 h-5 fill-white shrink-0 animate-bounce" />
          <span className="text-xs sm:text-sm font-bold tracking-tight pr-1">
            WhatsApp Directo
          </span>
        </a>
      </div>
    </div>
  );
}
