import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Star, ShoppingBag, Eye, ArrowRight, ArrowLeft, Mail, Phone, Check, Box, ShieldCheck, Instagram, Home, Package, User, X } from 'lucide-react';
import { ToastProvider, useToast } from './components/Toast';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import StoreView from './components/StoreView';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import AccountView from './components/AccountView';
import Dashboard from './components/Dashboard';
import Faq from './components/Faq';
import ReturnsExchanges from './components/ReturnsExchanges';
import DatabaseTest from './components/DatabaseTest';

import { dbService, supabase } from './services/db';
import { Product, CartItem, Country, DiscountCoupon, Order, Review, NewsletterSubscription, Collection } from './types';
import { recordView, recordCartAddition } from './utils/analytics';

// @ts-ignore
import sultaBoxClosed from './assets/images/sulta_box_closed_1780609086750.png';
// @ts-ignore
import sultaBoxOpen from './assets/images/sulta_box_open_1780609104306.png';
// @ts-ignore
import sultaBoxesStack from './assets/images/sulta_boxes_stack_1780609121411.png';

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const { toast } = useToast();
  // Global States
  const [currentTab, setTab] = useState<string>('home');
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [activeBoxImg, setActiveBoxImg] = useState<number>(0);

  const boxImages = [
    { url: sultaBoxClosed, title: 'الصندوق الملكي المغلق' },
    { url: sultaBoxOpen, title: 'الفخامة من الداخل' },
    { url: sultaBoxesStack, title: 'تشكيلة صناديق الهدايا' }
  ];

  // Optimized Splash Loading Timer
  useEffect(() => {
    if (!showSplash) return;
    
    // Safety exit: if we get stuck for more than 4 seconds, force hide splash
    const safetyTimer = setTimeout(() => {
      setShowSplash(false);
    }, 4500);

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 120);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [showSplash]);

  useEffect(() => {
    if (loadingProgress >= 100 && showSplash) {
      const timer = setTimeout(() => setShowSplash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loadingProgress, showSplash]);

  const [country, setCountry] = useState<Country>('SA'); // Default to SA
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // Clean slate
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [homepageSections, setHomepageSections] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Auto-open product detail page when deep-linked with ?product=ID or ?p=ID
  useEffect(() => {
    if (products.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const prId = urlParams.get('product') || urlParams.get('p');
      if (prId) {
        const found = products.find(p => p.id === prId || p.id.toLowerCase() === prId.toLowerCase() || p.id.replace('prod_', '') === prId);
        if (found) {
          setSelectedProduct(found);
        }
      }
    }
  }, [products]);

  // Live database synchronization via dbService
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let unsubProducts: any = null;
    let unsubCoupons: any = null;
    let unsubReviews: any = null;
    let unsubOrders: any = null;
    let unsubCategories: any = null;
    let unsubCollections: any = null;
    let unsubCMS: any = null;

    const initData = async () => {
      try {
        // Auth Session Sync
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setAuthLoading(false);

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
        subscription = data.subscription;

        // Fetch settings - ensure this doesn't block the splash
        dbService.getSettings().then(setSettings).catch(err => console.error("Settings error:", err));
        
        // 1. Live Sync Products
        unsubProducts = dbService.subscribeProducts(
          (list) => setProducts(list),
          (error) => console.error("Products error:", error)
        );

        // 2. Live Sync Coupons
        unsubCoupons = dbService.subscribeCoupons(
          (list) => setCoupons(list),
          (error) => console.error("Coupons error:", error)
        );

        // 3. Live Sync Reviews
        unsubReviews = dbService.subscribeReviews(
          (list) => setReviews(list),
          (error) => console.error("Reviews error:", error)
        );

        // 4. Live Sync Orders
        unsubOrders = dbService.subscribeOrders(
          (list) => setOrders(list),
          (error) => console.error("Orders error:", error)
        );

        // 5. Live Sync Categories
        unsubCategories = dbService.subscribeCategories(
          (list) => setCategories(list),
          (error) => console.error("Categories error:", error)
        );

        // 6. Live Sync Collections
        unsubCollections = dbService.subscribeCollections(
          (list) => setCollections(list),
          (error) => console.error("Collections error:", error)
        );

        // 7. Live Sync Homepage CMS sections
        unsubCMS = dbService.subscribeHomepageSections(
          (list) => setHomepageSections(list),
          (error) => console.error("CMS sections sync error:", error)
        );
      } catch (err) {
        console.error("Critical initialization error:", err);
        setAuthLoading(false);
        // Force hide splash on critical error after 1s
        setTimeout(() => setShowSplash(false), 1000);
      }
    };

    initData();

    return () => {
      if (subscription) subscription.unsubscribe();
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubCoupons === 'function') unsubCoupons();
      if (typeof unsubReviews === 'function') unsubReviews();
      if (typeof unsubOrders === 'function') unsubOrders();
      if (typeof unsubCategories === 'function') unsubCategories();
      if (typeof unsubCollections === 'function') unsubCollections();
      if (typeof unsubCMS === 'function') unsubCMS();
    };
  }, []);

  // UI Theme & Overlay States
  const [isMidnightVelvet, setIsMidnightVelvet] = useState<boolean>(false);
  
  // UI overlays states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);


  // Subscription email / phone state
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribePhone, setSubscribePhone] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  // Handle Favorites toggle
  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    // Elegant silent console notifier
    console.log(`Updated Wishlist item: ${productId}`);
  };

  // Add Item to Shopping Cart Bag
  const handleAddToCart = (product: Product, color: { name: string; hex: string }, size: string, qty: number = 1) => {
    recordCartAddition(product.id);
    setCart(prev => {
      const existingIdx = prev.findIndex(
        i => i.product.id === product.id && i.selectedColor.name === color.name && i.selectedSize === size
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + qty;
        copy[existingIdx].quantity = newQty > product.stock ? product.stock : newQty;
        return copy;
      }

      return [...prev, { product, selectedColor: color, selectedSize: size, quantity: qty }];
    });

    setIsCartOpen(true);
  };

  // Immediate checkout buy-now trigger
  const handleBuyNow = (product: Product, color: { name: string; hex: string }, size: string, qty: number = 1) => {
    recordCartAddition(product.id);
    // Clear cart or add item directly
    setCart([{ product, selectedColor: color, selectedSize: size, quantity: qty }]);
    setAppliedCoupon(null);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleReorder = (order: Order) => {
    const cartItemsToAdd: CartItem[] = [];
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        cartItemsToAdd.push({
          product,
          selectedColor: product.colors?.find(c => c.name === item.color) || { name: item.color, hex: '#000000' },
          selectedSize: item.size,
          quantity: item.quantity
        });
      }
    }
    
    if (cartItemsToAdd.length > 0) {
      setCart(prev => {
        const newCart = [...prev];
        cartItemsToAdd.forEach(newItem => {
           const existingIdx = newCart.findIndex(
            i => i.product.id === newItem.product.id && i.selectedColor.name === newItem.selectedColor.name && i.selectedSize === newItem.selectedSize
           );
           if (existingIdx > -1) {
             newCart[existingIdx].quantity += newItem.quantity;
           } else {
             newCart.push(newItem);
           }
        });
        return newCart;
      });
      setIsCartOpen(true);
      if (currentTab === 'account') {
         setTab('store');
      }
    } else {
      toast("عذراً، بعض المنتجات لم تعد متوفرة في المتجر.", 'error');
    }
  };

  // Delete Cart item
  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update Cart quantities
  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        const stockLimit = item.product.stock;
        return { ...item, quantity: newQty > stockLimit ? stockLimit : newQty };
      }
      return item;
    }));
  };

  // Proceed Order Checkout
  const handleCheckoutInitiate = (coupon: DiscountCoupon | null) => {
    setAppliedCoupon(coupon);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Final Checkout booking success
  const handleOrderSuccess = (newOrder: Order) => {
    // Reset shopping state
    setCart([]);
    setAppliedCoupon(null);
    setIsCheckoutOpen(false);

    // Switch view to customer cabinet to track orders instantly
    setTab('account');
    toast(`تهانينا! 🎉 تم حجز طلبك الفاخر بنجاح برقم الاستعلام: ${newOrder.id}. يمكنك تتبعه الآن من حسابك الشخصي.`, 'success');
  };

  // Select Product Handler (updates customer history)
  const handleSelectProduct = (product: Product) => {
    recordView(product.id);
    setSelectedProduct(product);
    setRecentlyViewed(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return [product, ...prev.filter(p => p.id !== product.id)];
      }
      return [product, ...prev].slice(0, 4); // max 4 items
    });
  };

  // Newsletter Subscription Form Trigger
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    
    try {
      const newSub: NewsletterSubscription = {
        id: `SUB-${Date.now()}`,
        email: subscribeEmail,
        phone: subscribePhone || undefined,
        date: new Date().toISOString()
      };
      
      await dbService.saveNewsletterSubscription(newSub);
      setSubscribeSuccess(true);
      setTimeout(() => {
        setSubscribeEmail('');
        setSubscribePhone('');
        setSubscribeSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Newsletter error:", err);
      toast('نعتذر، حدث تعذر فني عند الاشتراك. يرجى المحاولة لاحقاً.', 'error');
    }
  };

  // Custom Intercepting Setters to automatically write mutations to database via dbService
  const syncProducts = React.useCallback(async (value: React.SetStateAction<Product[]>) => {
    const nextArr = typeof value === 'function' ? value(products) : value;
    setProducts(nextArr);
    for (const p of nextArr) {
      await dbService.saveProduct(p);
    }
  }, [products]);

  const syncCoupons = React.useCallback(async (value: React.SetStateAction<DiscountCoupon[]>) => {
    const nextArr = typeof value === 'function' ? value(coupons) : value;
    setCoupons(nextArr);
    for (const c of nextArr) {
      await dbService.saveCoupon(c);
    }
  }, [coupons]);

  const syncOrders = React.useCallback(async (value: React.SetStateAction<Order[]>) => {
    const nextArr = typeof value === 'function' ? value(orders) : value;
    setOrders(nextArr);
    for (const o of nextArr) {
      await dbService.updateOrder(o);
    }
  }, [orders]);

  // Select home categories shortcut
  const handleSelectCategoryHome = (categoryId: string) => {
    setTab('store');
    // We can simulate an active selection by leaving it to StoreView filter
  };

  // Best sellers filter list on home
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);

  return (
      <div className={`min-h-screen bg-[#FAF4F5] font-sans text-gray-900 pb-16 md:pb-0 transition-all duration-1000 ${isMidnightVelvet ? 'midnight-velvet-active bg-[#0B0B0B] text-white' : ''}`}>
      
      {/* SCREEN 1: BRAND SPLASH SCREEN OVERLAY */}
      {showSplash && (
        <div className="fixed inset-0 bg-[#0B0B0B] z-[100] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
          <div className="max-w-md w-full space-y-6 relative">
            <div className="space-y-3">
              <span className="text-[10px] text-[#F4B6C2] font-semibold tracking-[0.3em] uppercase block animate-pulse font-sans">
                ✦ BIENVENUE DANS L'ATELIER SULTA ✦
              </span>
              <h1 className="font-serif text-5xl md:text-7xl font-extralight text-white tracking-[0.2em] translate-x-[4px] uppercase">
                SULTA
              </h1>
              <div className="w-12 h-[1px] bg-white/20 mx-auto my-3" />
              <span className="text-[10.5px] font-serif italic text-[#F6E7A6] tracking-wider block">
                Where Comfort Meets Elegance
              </span>
            </div>

            {/* Custom high quality loading percentage bar */}
            <div className="space-y-2 max-w-[240px] mx-auto pt-3">
              <div className="w-full bg-white/10 h-[2px] rounded-full overflow-hidden relative">
                <div 
                  className="bg-gradient-to-r from-[#F4B6C2] via-pink-400 to-[#F6E7A6] h-full rounded-full transition-all duration-150" 
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] font-sans text-gray-500 font-bold">
                <span>{loadingProgress}%</span>
                <span>يجري تجهيز البكج الفاخر لكي...</span>
              </div>
            </div>

            <button
              onClick={() => setShowSplash(false)}
              type="button"
              className="text-[10px] text-gray-500 hover:text-[#F4B6C2] underline cursor-pointer pt-6 block mx-auto transition-all"
            >
              تخطي العرض والولوج للبوتيك مباشرة
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL HEADER BAR */}
      <Header
        session={session}
        currentTab={currentTab}
        setTab={setTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        country={country}
        setCountry={setCountry}
        cart={cart}
        favorites={favorites}
        settings={settings}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFavorites={() => setTab('account')} // wishlist is in Account screen tab
        onSearch={(query) => {
          setSearchQuery(query);
          setTab('store');
        }}
      />

      {/* CORE DYNAMIC LAYOUT BASED ON ACTIVE TAB */}
      <main className="animate-fade-in-rapid">
        
        {/* VIEW: DATABASE TEST (تشخيص القاعدة) */}
        {currentTab === 'dbtest' && <DatabaseTest />}

        {/* VIEW 1: HOME PAGE (الرئيسية) */}
        {currentTab === 'home' && (
          <div className="space-y-0">
            {/* HERO PROMOTIONS BOX */}
            <Hero
              settings={settings}
              homepageSections={homepageSections}
              onExplore={() => setTab('store')}
              onDiscoverNew={() => {
                setTab('store');
              }}
            />

            {/* BRAND LUXURY CATEGORIES GRID */}
            <section className="py-20 bg-[#FAF5F0]">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-5xl mx-auto">
                  {(categories.length > 0 ? categories : [
                    { id: 'sleepwear', name: 'SLEEPWEAR', imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=800' },
                    { id: 'loungewear', name: 'LOUNGEWEAR', imageUrl: 'https://images.unsplash.com/photo-1515347619152-16e50e163c46?auto=format&fit=crop&q=80&w=800' },
                    { id: 'homewear', name: 'HOMEWEAR', imageUrl: 'https://images.unsplash.com/photo-1542488856-11f62b083b8b?auto=format&fit=crop&q=80&w=800' },
                    { id: 'collections', name: 'COLLECTIONS', imageUrl: 'https://images.unsplash.com/photo-1583391733958-69259253cb48?auto=format&fit=crop&q=80&w=800' }
                  ]).slice(0, 4).map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleSelectCategoryHome(category.id)}
                      className="group flex flex-col items-center cursor-pointer text-center"
                    >
                      <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-transparent group-hover:border-[#DF8A9D]/30 transition-all duration-500 mb-4 bg-[#DF8A9D]/10">
                        {category.imageUrl && (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 Mix-blend-multiply opacity-90"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <h4 className="text-[#0B0B0B] font-serif tracking-widest text-sm uppercase">
                        {category.name}
                      </h4>
                      <span className="text-[#A44C5C] text-xs font-sans mt-1 group-hover:underline underline-offset-4">Shop Now</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FULL WIDTH LUXURIOUS BANNER */}
            <section className="relative py-24 md:py-32 overflow-hidden bg-[#DF8A9D]/20">
              <div className="absolute inset-0 z-0 opacity-50">
                <img src="https://images.unsplash.com/photo-1583391733958-69259253cb48?auto=format&fit=crop&w=2000" className="w-full h-full object-cover grayscale mix-blend-overlay opacity-30" alt="luxury background"/>
              </div>

              <div className="relative z-20 max-w-4xl mx-auto px-4 text-center space-y-6">
                <span className="font-sans text-sm tracking-widest text-[#A44C5C] uppercase flex items-center justify-center gap-2">
                  <Sparkles size={14} />
                  Because You Deserve
                </span>
                <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-[#A44C5C] tracking-wide leading-tight">
                  THE SOFTEST LIFE
                </h3>
                <div className="pt-8">
                  <button
                    onClick={() => setTab('store')}
                    className="bg-[#A44C5C] text-[#FAF5F0] hover:bg-[#DF8A9D] px-10 py-4 rounded-full text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:scale-105"
                  >
                    SHOP THE COLLECTION
                  </button>
                </div>
              </div>
            </section>

            {/* BEST SELLERS */}
            <section className="py-20 bg-[#FAF5F0]">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                
                <div className="text-center max-w-xl mx-auto mb-16 flex items-center justify-center gap-4">
                  <svg width="24" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DF8A9D] opacity-60">
                     <path d="M16 12C16 16.4183 12.4183 20 8 20C3.58172 20 0 16.4183 0 12C0 7.58172 3.58172 4 8 4C12.4183 4 16 7.58172 16 12Z" fill="currentColor"/>
                     <path d="M40 12C40 16.4183 36.4183 20 32 20C27.5817 20 24 16.4183 24 12C24 7.58172 27.5817 4 32 4C36.4183 4 40 7.58172 40 12Z" fill="currentColor"/>
                  </svg>
                  <h3 className="font-serif text-3xl md:text-4xl text-[#0B0B0B] font-medium tracking-widest uppercase">
                    BEST SELLERS
                  </h3>
                  <svg width="24" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DF8A9D] opacity-60">
                     <path d="M16 12C16 16.4183 12.4183 20 8 20C3.58172 20 0 16.4183 0 12C0 7.58172 3.58172 4 8 4C12.4183 4 16 7.58172 16 12Z" fill="currentColor"/>
                     <path d="M40 12C40 16.4183 36.4183 20 32 20C27.5817 20 24 16.4183 24 12C24 7.58172 27.5817 4 32 4C36.4183 4 40 7.58172 40 12Z" fill="currentColor"/>
                  </svg>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {bestSellers.length > 0 ? bestSellers.slice(0, 5).map((prod) => {
                    const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
                    const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

                    return (
                      <div
                        key={prod.id}
                        className="group flex flex-col h-full cursor-pointer relative"
                        onClick={() => handleSelectProduct(prod)}
                      >
                        <div className="absolute top-3 right-3 z-10">
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }} className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors text-gray-400 hover:text-[#DF8A9D]">
                            <Heart size={16} className={favorites.includes(prod.id) ? "fill-[#DF8A9D] text-[#DF8A9D]" : ""} />
                          </button>
                        </div>

                        {/* Top click photo */}
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF5F0] rounded-lg mb-4">
                          <img
                            src={prod.images[0]}
                            alt={prod.nameEn || prod.nameAr}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 mix-blend-multiply"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Text details bottom */}
                        <div className="space-y-1 text-center">
                          <h4 className="text-sm font-semibold text-[#0B0B0B] line-clamp-1 font-serif">
                            {prod.nameEn || prod.nameAr}
                          </h4>
                          <span className="font-sans font-medium text-[#A44C5C]">${priceVal.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full text-center text-gray-500 py-10 font-serif">
                      Products are currently being curated.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* TRUST BUILDING BADGES */}
            <section className="py-12 bg-[#FAF5F0] border-t border-[#A44C5C]/10 border-b">
              <div className="max-w-7xl mx-auto px-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-[#A44C5C]/10">
                    <div className="px-4 flex items-center justify-center gap-4">
                       <ShieldCheck className="text-[#A44C5C] shrink-0" size={32} strokeWidth={1} />
                       <div className="text-left">
                          <h5 className="font-serif text-sm text-[#0B0B0B] uppercase tracking-wider">Secure Checkout</h5>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-sans mt-0.5">Your data is protected</p>
                       </div>
                    </div>
                    <div className="px-4 flex items-center justify-center gap-4">
                       <Globe className="text-[#A44C5C] shrink-0" size={32} strokeWidth={1} />
                       <div className="text-left">
                          <h5 className="font-serif text-sm text-[#0B0B0B] uppercase tracking-wider">Worldwide Shipping</h5>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-sans mt-0.5">Fast & reliable delivery</p>
                       </div>
                    </div>
                    <div className="px-4 flex items-center justify-center gap-4">
                       <Star className="text-[#A44C5C] shrink-0" size={32} strokeWidth={1} />
                       <div className="text-left">
                          <h5 className="font-serif text-sm text-[#0B0B0B] uppercase tracking-wider">Premium Quality</h5>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-sans mt-0.5">Designed for comfort</p>
                       </div>
                    </div>
                    <div className="px-4 flex items-center justify-center gap-4">
                       <Heart className="text-[#A44C5C] shrink-0" size={32} strokeWidth={1} />
                       <div className="text-left">
                          <h5 className="font-serif text-sm text-[#0B0B0B] uppercase tracking-wider">Made With Love</h5>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-sans mt-0.5">For your best moments</p>
                       </div>
                    </div>
                 </div>
              </div>
            </section>

            {/* NEWSLETTER JOIN SECTION */}
            <section className="py-24 bg-[#0B0B0B] text-[#FAF5F0]">
              <div className="max-w-xl mx-auto px-6 text-center space-y-6">
                
                <h3 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#FAF5F0]">
                  JOIN SULTA
                </h3>
                <p className="font-sans text-sm tracking-wide text-[#FAF5F0]/70 uppercase">
                  Subscribe to receive updates, access to exclusive deals, and more.
                </p>

                {subscribeSuccess ? (
                  <div className="bg-[#DF8A9D]/20 p-4 rounded-none border border-[#DF8A9D]/30 text-[#DF8A9D] text-sm font-sans tracking-widest uppercase">
                    Thank you for subscribing.
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="pt-6 font-sans flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="ENTER YOUR EMAIL ADDRESS"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="flex-1 text-xs border-b border-[#FAF5F0]/30 px-2 py-4 bg-transparent text-[#FAF5F0] placeholder-[#FAF5F0]/50 focus:outline-none focus:border-[#DF8A9D] transition-colors uppercase tracking-widest text-center sm:text-left"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-transparent text-[#FAF5F0] hover:text-[#DF8A9D] font-bold text-xs px-6 py-4 transition-colors uppercase tracking-widest border-b border-[#FAF5F0]/30 hover:border-[#DF8A9D]"
                    >
                      SUBSCRIBE
                    </button>
                  </form>
                )}

              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: STORE PAGE (المتجر مع الفلترة الكاملة) */}
        {currentTab === 'store' && (
          <StoreView
            products={products}
            categories={categories}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onAddToCart={(prod, col, sz) => handleAddToCart(prod, col, sz, 1)}
            onSelectProduct={handleSelectProduct}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onSearchQueryChange={setSearchQuery}
            recentlyViewed={recentlyViewed}
          />
        )}

        {/* VIEW 3: SIZE GUIDE PAGE */}
        {currentTab === 'sizes' && (
          <div className="max-w-4xl mx-auto px-6 py-24 font-sans text-xs md:text-sm text-gray-700 leading-relaxed bg-[#FAF5F0] my-10 rounded-sm">
            <h2 className="font-serif text-3xl md:text-5xl font-light text-center text-[#0B0B0B] mb-2 uppercase tracking-wide">Size Guide</h2>
            <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mt-6 mb-10" />
            
            <p className="text-center max-w-xl mx-auto text-gray-500 font-sans text-sm mb-12">
              We understand how important the fit of sleepwear is to your ultimate comfort. Please review the detailed chart below to ensure a precise, elegant fit.
            </p>

            <div className="border border-[#DF8A9D]/20 rounded-sm overflow-hidden bg-white shadow-sm max-w-2xl mx-auto mb-10">
              <table className="w-full text-center border-collapse text-xs md:text-sm">
                <thead className="bg-[#0B0B0B] text-[#FAF5F0]">
                  <tr className="font-serif tracking-widest uppercase text-[10px]">
                    <th className="p-4 font-normal">Size</th>
                    <th className="p-4 font-normal">Bust (Inches)</th>
                    <th className="p-4 font-normal">Hip (Inches)</th>
                    <th className="p-4 font-normal">Approx. Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DF8A9D]/10">
                  <tr className="group hover:bg-[#FAF5F0]/50 transition-colors">
                     <td className="p-4 font-serif font-bold text-[#A44C5C]">XS / S</td>
                    <td className="p-4 font-sans text-gray-600">32" - 34"</td>
                    <td className="p-4 font-sans text-gray-600">34" - 36"</td>
                    <td className="p-4 text-gray-500">45 - 58 kg</td>
                  </tr>
                  <tr className="group hover:bg-[#FAF5F0]/50 transition-colors">
                     <td className="p-4 font-serif font-bold text-[#A44C5C]">M / L</td>
                    <td className="p-4 font-sans text-gray-600">36" - 38"</td>
                    <td className="p-4 font-sans text-gray-600">38" - 41"</td>
                    <td className="p-4 text-gray-500">60 - 75 kg</td>
                  </tr>
                   <tr className="group hover:bg-[#FAF5F0]/50 transition-colors">
                     <td className="p-4 font-serif font-bold text-[#A44C5C]">XL</td>
                    <td className="p-4 font-sans text-gray-600">40" - 42"</td>
                    <td className="p-4 font-sans text-gray-600">43" - 45"</td>
                    <td className="p-4 text-gray-500">78 - 95 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#FAF5F0] border border-[#DF8A9D]/30 p-6 rounded-sm text-center max-w-xl mx-auto text-xs space-y-2">
               <strong className="font-serif uppercase tracking-widest text-[#A44C5C] block mb-2">Designer's Tip:</strong>
               <p className="text-gray-500">If you fall between sizes, we always recommend choosing the larger size for sleepwear to ensure comfortable stretch and ease of movement during sleep and home relaxation.</p>
            </div>
          </div>
        )}

        {/* VIEW 4: ABOUT ABOUT DETAILS (من نحن) */}
        {currentTab === 'about' && (
          <AboutUs />
        )}

        {/* VIEW 5: CONTACT CONTACT DETAILS (تواصل معنا) */}
        {currentTab === 'contact' && (
          <ContactUs settings={settings} />
        )}

        {/* VIEW 6: ACCOUNT ACCOUNT SCREEN (حساب العميل والمفضلة) */}
        {currentTab === 'account' && (
          <AccountView
            session={session}
            country={country}
            orders={orders}
            favorites={favorites}
            products={products}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
            onReorder={handleReorder}
            onNavigateToDashboard={() => setTab('dashboard')}
          />
        )}

        {/* VIEW 8: FAQ SCREEN (الأسئلة الشائعة للعرائس) */}
        {currentTab === 'faq' && (
          <Faq />
        )}

        {/* VIEW 9: RETURNS & EXCHANGES POLICY (الاسترجاع والاستبدال) */}
        {currentTab === 'returns' && (
          <ReturnsExchanges />
        )}

        {/* VIEW 7: DASHBOARD SECURE SCREEN (لوحة الإدارة للبراند) */}
        {currentTab === 'dashboard' && (
          <Dashboard
            session={session}
            authLoading={authLoading}
            products={products}
            setProducts={syncProducts}
            orders={orders}
            setOrders={syncOrders}
            coupons={coupons}
            setCoupons={syncCoupons}
            settings={settings}
            setSettings={setSettings}
            categories={categories}
            setCategories={setCategories}
            collections={collections}
            setCollections={setCollections}
            homepageSections={homepageSections}
          />
        )}

      </main>

      {/* OVERLAY MODAL 1: DYNAMICAL PRODUCT DETAILED VIEW */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          products={products}
          country={country}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(prod, col, sz, qty) => {
            handleAddToCart(prod, col, sz, qty);
            setSelectedProduct(null);
          }}
          onBuyNow={(prod, col, sz, qty) => {
            handleBuyNow(prod, col, sz, qty);
          }}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          reviews={reviews}
          settings={settings}
        />
      )}

      {/* OVERLAY DRAWER 2: LUXURIOUS SHOPPING BAG DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        country={country}
        onRemoveItem={handleRemoveItem}
        onUpdateQty={handleUpdateCartQty}
        onCheckout={handleCheckoutInitiate}
        onSelectProduct={handleSelectProduct}
        products={products}
        coupons={coupons}
      />

      {/* OVERLAY MODAL 3: BILLING CHECKOUT FUNNEL */}
      {isCheckoutOpen && (
        <CheckoutModal
          country={country}
          cart={cart}
          appliedCoupon={appliedCoupon}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
          settings={settings}
        />
      )}

      {/* GLOBAL LUXURY BILINGUAL FOOTER */}
      <footer className="bg-[#0B0B0B] text-[#FAFAF7]/90 pt-16 pb-8 border-t border-gray-900 select-none font-sans text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Logo & Motto Column */}
          <div className="space-y-4">
            <h2 className="font-serif text-3xl tracking-widest text-[#F6E7A6] uppercase">{settings?.siteName || 'SULTA'}</h2>
            <span className="text-[9px] uppercase tracking-[0.2em] font-serif block text-gray-400 italic">
              {settings?.logo ? 'Luxury Sleepwear Boutique' : 'Where Comfort Meets Elegance'}
            </span>
            <p className="text-gray-400 text-xs leading-relaxed font-sans max-w-xs pt-2">
              متجر فريد مصمم لتقديم أرقى خامات البيجامات والملابس المنزلية المترفة للنساء في المملكة العربية السعودية ومصر.
            </p>
          </div>

          {/* Quick Deep links */}
          <div className="space-y-4">
            <h4 className="font-serif font-semibold text-sm uppercase text-[#F6E7A6] tracking-wider">روابط سريعة</h4>
            <div className="flex flex-col gap-2.5 font-sans items-start text-right">
              <button type="button" onClick={() => setTab('home')} className="text-gray-400 hover:text-[#F4B6C2] transition-colors cursor-pointer">الرئيسية</button>
              <button type="button" onClick={() => setTab('store')} className="text-gray-400 hover:text-[#F4B6C2] transition-colors cursor-pointer">متجرنا</button>
              <button type="button" onClick={() => setTab('sizes')} className="text-gray-400 hover:text-[#F4B6C2] transition-colors cursor-pointer">دليل المقاسات</button>
              <button type="button" onClick={() => setTab('about')} className="text-gray-400 hover:text-[#F4B6C2] transition-colors cursor-pointer">حول البراند</button>
              <button type="button" onClick={() => setTab('dashboard')} className="text-right text-[#F6E7A6] hover:underline font-bold transition-colors cursor-pointer">لوحة الإدارة والتقارير</button>
              <button type="button" onClick={() => setTab('dbtest')} className="text-right text-gray-600 hover:text-[#c5a059] text-[9px] mt-2 transition-colors cursor-pointer">فحص قاعدة البيانات (Diagnostic)</button>
            </div>
          </div>

          {/* Legal and Support */}
          <div className="space-y-4 font-sans">
            <h4 className="font-serif font-semibold text-sm uppercase text-[#F6E7A6] tracking-wider">حقوق وبطاقات الدعم</h4>
            <div className="flex flex-col gap-2.5 items-start text-right">
              <button type="button" onClick={() => setTab('faq')} className="text-gray-400 hover:text-[#F4B6C2] transition-colors cursor-pointer">الأسئلة الشائعة للعرائس</button>
              <button type="button" onClick={() => setTab('returns')} className="text-gray-400 hover:text-[#F4B6C2] transition-colors cursor-pointer">سياسة الاسترجاع في مصر والسعودية</button>
              <button type="button" onClick={() => setTab('sizes')} className="text-gray-400 hover:text-[#F4B6C2] transition-colors cursor-pointer">دليل المقاسات الرسمي</button>
              <span className="text-[#F4B6C2] font-semibold text-[10px]">تأمين كلي على الطلبيات المعبأة ورقياً</span>
            </div>
          </div>

          {/* Target Region and payment systems */}
          <div className="space-y-4 font-sans">
            <h4 className="font-serif font-semibold text-sm uppercase text-[#F6E7A6] tracking-wider">وسائل السداد وعملة الشراء</h4>
            <p className="text-xs text-gray-400">
              يقبل الموقع الدفع الآمن بنظام التشفير SSL وحرية الاختيار للعملات الأجنبية والمحلية لراحة العميل.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-white/5 border border-white/15 px-2.5 py-1 rounded text-[9px] font-bold">Mada</span>
              <span className="bg-white/5 border border-white/15 px-2.5 py-1 rounded text-[9px] font-bold">Apple Pay</span>
              <span className="bg-white/5 border border-white/15 px-2.5 py-1 rounded text-[9px] font-bold">STC Pay</span>
              <span className="bg-white/5 border border-white/15 px-2.5 py-1 rounded text-[9px] font-bold">Fawry</span>
              <span className="bg-white/5 border border-white/15 px-2.5 py-1 rounded text-[9px] font-bold">Visa</span>
              <span className="bg-white/5 border border-white/15 px-2.5 py-1 rounded text-[9px] font-bold font-sans">الدفع عند الاستلام</span>
            </div>
          </div>

        </div>

        {/* Bottom credits */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-500 font-sans">
          <span>حقوق النشر والطبع محفوظة © ٢٠٢٦ بيت الأزياء الملكي SULTA. جميع العلامات التجارية مسجلة.</span>
          <span className="font-serif italic text-gray-400">SULTA - WHERE COMFORT MEETS ELEGANCE</span>
        </div>
      </footer>



      {/* MOBILE DRAWER MODAL OVERLAY (Simplified and completely bug-free on all mobile viewports) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden font-sans">
          {/* Blur backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer container aligned with RTL right-side slot */}
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col p-6 z-50 animate-slide-right-drawer border-l border-pink-100/30 text-right overflow-y-auto justify-between">
            <div>
              {/* Drawer Top logo bar */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="font-serif text-2xl tracking-widest text-[#0B0B0B] font-light">SULTA ATELIER</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Cards List */}
              <div className="space-y-2 py-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  تصفحي أقسام البوتيك الفخمة:
                </span>
                
                {[
                  { id: 'home', label: 'الرئيسية 🏠' },
                  { id: 'store', label: 'المتجر والكتالوج 🛍️' },
                  { id: 'sizes', label: 'دليل المقاسات 📏' },
                  { id: 'about', label: 'رواد قصتنا وعن Sulta ✨' },
                  { id: 'faq', label: 'الأسئلة الشائعة للعرائس ❓' },
                  { id: 'returns', label: 'سياسة الاسترجاع والتبديل 🔄' },
                ].map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-right text-xs font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-[#0B0B0B] text-[#F6E7A6] font-bold shadow-md scale-[1.01]'
                          : 'text-gray-700 bg-gray-50/50 hover:bg-pink-50/40 hover:text-black'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-[#F6E7A6]" />}
                    </button>
                  );
                })}
              </div>

              {/* Extra Account section for quick access */}
              <div className="border-t border-gray-100 pt-3 mt-1 space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">
                  حسابكِ الملكي والإدارة:
                </span>
                
                <button
                  onClick={() => {
                    setTab('account');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-right text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'account' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'text-gray-650 bg-gray-50/30 hover:bg-pink-50/30'
                  }`}
                >
                  <span>الملف الشخصي وطلباتكِ 👤</span>
                  <span className="text-[10px] text-gray-400 text-left">تابع شحنتك</span>
                </button>

                <button
                  onClick={() => {
                    setTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-right text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'dashboard' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'text-gray-655 bg-gray-50/30 hover:bg-pink-50/30'
                  }`}
                >
                  <span>لوحة تحكم الإدارة والطلبيات ⚙️</span>
                  <span className="bg-[#F6E7A6] text-gray-900 px-1.5 py-0.5 rounded text-[9px] font-bold text-left">بوابة الإدارة</span>
                </button>
              </div>
            </div>

            {/* Quick Country switcher in Mobile menu list */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-500">الوجهة والعملة:</span>
                <button
                  onClick={() => {
                    setCountry(country === 'SA' ? 'EG' : 'SA');
                  }}
                  className="bg-white border border-gray-250 shadow-2xs text-[10.5px] px-2.5 py-1 rounded-full font-bold text-[#0B0B0B] hover:border-[#DF8A9C] transition-colors cursor-pointer"
                >
                  {country === 'SA' ? '🇸🇦 SAR (السعودية)' : '🇪🇬 EGP (مصر)'}
                </button>
              </div>

              {/* Bottom footer text inside drawer */}
              <div className="text-center text-[9px] text-gray-400 space-y-0.5 pb-2">
                <p className="font-serif italic font-medium tracking-wide text-gray-500">Where Comfort Meets Elegance</p>
                <p>تشحن ومعبأة بعناية فائقة ✦</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM NAVIGATION BAR FOR MOBILE FIRST EXPERIENCE */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-150 py-2.5 px-6 z-40 flex justify-around items-center shadow-lg select-none">
        <button 
          onClick={() => setTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${currentTab === 'home' ? 'text-[#DF8A9C] scale-105' : 'text-gray-400 hover:text-gray-750'}`}
        >
          <Home size={18} />
          <span className="text-[9px] font-sans font-bold">الرئيسية</span>
        </button>

        <button 
          onClick={() => setTab('store')}
          className={`flex flex-col items-center gap-1 transition-all ${currentTab === 'store' ? 'text-[#DF8A9C] scale-105' : 'text-gray-400 hover:text-gray-750'}`}
        >
          <ShoppingBag size={18} />
          <span className="text-[9px] font-sans font-bold">الكتالوج</span>
        </button>

        <button 
          onClick={() => setTab('account')}
          className={`flex flex-col items-center gap-1 transition-all ${currentTab === 'account' ? 'text-[#DF8A9C] scale-105' : 'text-gray-400 hover:text-gray-750'}`}
        >
          <User size={18} />
          <span className="text-[9px] font-sans font-bold">طلباتي وحسابي</span>
        </button>
      </div>

    </div>
  );
}
