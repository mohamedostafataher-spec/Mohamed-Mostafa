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
import { Product, CartItem, Country, DiscountCoupon, Order, Review, NewsletterSubscription } from './types';
import { recordView, recordCartAddition } from './utils/analytics';

// @ts-ignore
import sultaBoxClosed from './assets/images/sulta_box_closed_1780609086750.png';
// @ts-ignore
import sultaBoxOpen from './assets/images/sulta_box_open_1780609104306.png';
// @ts-ignore
import sultaBoxesStack from './assets/images/sulta_boxes_stack_1780609121411.png';

export default function App() {
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
    <ToastProvider>
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
              onExplore={() => setTab('store')}
              onDiscoverNew={() => {
                setTab('store');
                // Could pre-apply category filter
              }}
            />

            {/* BRAND VALUE FEATURES GRID */}
            <Features />

            {/* CATEGORIES GRID BLOCK (قسم التصنيفات) */}
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-xl mx-auto mb-12">
                  <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#0B0B0B] font-light">
                    فئات المجموعات الملكية
                  </h3>
                  <div className="w-16 h-0.5 bg-[#F4B6C2] mx-auto mt-4" />
                  <p className="text-gray-400 text-[10px] font-serif uppercase tracking-widest mt-2">
                    Discover Velvet Luxury Categories
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {(categories.length > 0 ? categories : [
                    { id: 'satin', name: 'ساتان ملكي' },
                    { id: 'cotton', name: 'قطن مصري' },
                    { id: 'loungewear', name: 'لانج وير' },
                    { id: 'dresses', name: 'فساتين نوم' }
                  ]).slice(0, 5).map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleSelectCategoryHome(category.id)}
                      className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer shadow-xs border border-gray-100 flex flex-col justify-end p-4 text-center transition-all duration-500 hover:scale-103 bg-[#0B0B0B]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                      {category.imageUrl && (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="relative z-20 space-y-1">
                        <h4 className="text-white font-serif text-sm md:text-base font-bold tracking-wide">
                          {category.name}
                        </h4>
                        <span className="text-[#F6E7A6]/80 text-[10px] font-serif uppercase tracking-wider block">
                          {category.slug}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* BEST SELLERS HIGHLIGHTS (الأكثر مبيعاً للبراند) */}
            <section className="py-16 bg-[#FAFAF7]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-xl mx-auto mb-12">
                  <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#0B0B0B] font-light">
                    الأكثر مبيعاً وجاذبية
                  </h3>
                  <div className="w-16 h-0.5 bg-[#F4B6C2] mx-auto mt-4" />
                  <p className="text-gray-400 text-[10px] font-serif uppercase tracking-widest mt-2">
                    Lustrous Silks & Royal Choice Favorites
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {bestSellers.map((prod) => {
                    const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
                    const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

                    return (
                      <div
                        key={prod.id}
                        className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all border border-gray-100 flex flex-col justify-between h-full relative"
                      >
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-[#0B0B0B] text-[#F6E7A6] text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border border-yellow-200">
                            BEST SELLER ★
                          </span>
                        </div>

                        {/* Top click photo */}
                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 cursor-pointer" onClick={() => handleSelectProduct(prod)}>
                          <img
                            src={prod.images[0]}
                            alt={prod.nameAr}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white text-gray-900 border text-xs px-4 py-2 rounded-full font-medium shadow-md">عرض التفاصيل</span>
                          </div>
                        </div>

                        {/* Text details bottom */}
                        <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest block">{prod.categoryAr}</span>
                            <h4 className="text-xs md:text-sm font-semibold text-[#0B0B0B] line-clamp-1 hover:text-[#F4B6C2] transition-colors cursor-pointer" onClick={() => handleSelectProduct(prod)}>
                              {prod.nameAr}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-gray-50">
                            <span className="font-sans font-bold text-gray-900">{priceVal.toLocaleString()} {currencyLabel}</span>
                            <button
                              onClick={() => handleAddToCart(prod, prod.colors[0], prod.sizes[0] || 'S')}
                              className="bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <span>السلة</span>
                              <ShoppingBag size={11} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                <div className="text-center mt-12">
                  <button
                    onClick={() => setTab('store')}
                    className="border border-[#0B0B0B] text-[#0B0B0B] hover:bg-[#0B0B0B] hover:text-white px-8 py-3.5 rounded-full text-xs font-semibold tracking-widest transition-all duration-300 font-sans"
                  >
                    تصفحي كامل المتجر والقطع الفريدة
                  </button>
                </div>

              </div>
            </section>

            {/* FULL WIDTH LUXURIOUS BANNER (بانر إعلاني فاخر) */}
            <section className="relative py-24 md:py-36 overflow-hidden bg-black text-white">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[#0B0B0B]/85 z-10" />
                <div
                  className="w-full h-full bg-[#FAFAF7] bg-opacity-10"
                />
              </div>

              <div className="relative z-20 max-w-4xl mx-auto px-4 text-center space-y-6">
                <span className="font-serif italic text-xs tracking-[0.25em] text-[#F6E7A6] uppercase">Sulta High Couture Sleepwear • صمم ليدوم</span>
                <h3 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light text-white tracking-wide leading-tight">
                  مصممة لليالٍ أكثر راحة وأناقة لتبهج روحك الجميلة
                </h3>
                <p className="max-w-xl mx-auto text-gray-400 text-sm leading-relaxed font-sans">
                  من التصميم الباريسي والفرنسي وحتى اختيار أنسجة الحرير الكلاسيكية وتغليفها بالصندوق المخملي الفاخر، رعاية كاملة تضفي حكايا الدفء والتجرد على ليلتك.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setTab('store')}
                    className="bg-[#FAFAF7] text-[#0B0B0B] hover:bg-[#F6E7A6] hover:text-[#0B0B0B] px-8 py-3.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-300 hover:scale-105"
                  >
                    اكتشفي التشكيلة الآن
                  </button>
                </div>
              </div>
            </section>

            {/* ART OF PACKAGING PRESENTATION SECTION */}
            <section className="py-16 bg-white">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  
                  <div className="space-y-6 text-center md:text-right">
                    <span className="font-serif text-xs text-gray-400 block tracking-widest uppercase mb-1">Couture Packaging Masterpiece • فن التغليف الفاخر</span>
                    <h3 className="font-serif text-2xl md:text-4xl font-light text-[#0B0B0B] leading-snug">
                      صندوق أسود مطفي مع ترف ذهبي ملكي وتغليف يدوي فاخر
                    </h3>
                    <div className="w-12 h-0.5 bg-[#F4B6C2] mx-auto md:mx-0 mt-3" />
                    
                    <p className="text-gray-500 text-sm leading-relaxed font-sans mt-4">
                      في سولتا، لا ينتهي شغفنا بصنع القطع فحسب؛ بل نحيك لحظات المفاجأة الأولى بكل حب. يصل لكل عميل صندوق أسود مطفي متين محفور عليه اسم <strong>SULTA</strong> بحبر ذهبي مع باقة شريط مخملي وردي رائع.
                    </p>

                    <p className="text-gray-500 text-sm leading-relaxed font-sans">
                      يُحفظ ورق الحرير الحاوي للقطع بعناية فائقة لضمان النعومة واللمعان، وتحمل كل علبة بطاقة شكر خطية مضافة لتقدير حضورك الراقي معنا.
                    </p>

                    <div className="flex gap-4 items-center justify-center md:justify-start pt-2 select-none">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-[#FAFAF7] px-3.5 py-1.5 rounded-full border">
                        <Box size={14} className="text-[#F4B6C2]" />
                        <span>تغليف يدوي فاخر</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-[#FAFAF7] px-3.5 py-1.5 rounded-full border">
                        <ShieldCheck size={14} className="text-[#F6E7A6]" />
                        <span>ورق شكر داخلي بخصوصية</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    {/* Main Active Premium Image Frame */}
                    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gray-50 border border-gray-100 shadow-md group">
                      <img 
                        src={boxImages[activeBoxImg].url} 
                        alt={boxImages[activeBoxImg].title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-all duration-500 scale-100 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-4 select-none">
                        <span className="text-white font-sans text-xs font-medium tracking-wide">
                          {boxImages[activeBoxImg].title}
                        </span>
                      </div>
                    </div>
                    
                    {/* Gallery Carousel Thumbnails */}
                    <div className="grid grid-cols-3 gap-3 select-none" dir="rtl">
                      {boxImages.map((bImg, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveBoxImg(idx)}
                          className={`relative rounded-2xl overflow-hidden aspect-[4/3] border-2 bg-gray-50 cursor-pointer transition-all ${
                            activeBoxImg === idx
                              ? 'border-[#DF8A9C] ring-2 ring-pink-150 scale-95'
                              : 'border-transparent opacity-75 hover:opacity-100 hover:scale-102'
                          }`}
                        >
                          <img 
                            src={bImg.url} 
                            alt={bImg.title} 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover" 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* CUSTOMER TESTIMONIALS (آراء العملاء) */}
            <section className="py-16 bg-[#FAFAF7] border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-xl mx-auto mb-12">
                  <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#0B0B0B] font-light">
                    آراء سيدات SULTA المفعمة بالرضا
                  </h3>
                  <div className="w-16 h-0.5 bg-[#F4B6C2] mx-auto mt-4" />
                  <p className="text-gray-400 text-[10px] font-serif uppercase tracking-widest mt-2">
                    Verified Customer Encounters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reviews.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-gray-100">
                      <span className="text-4xl text-gray-300 block mb-3">💭</span>
                      <h4 className="font-serif text-lg text-[#0B0B0B] mb-2">لا توجد آراء مسجلة حتى اللحظة</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto font-sans">
                        عُملائنا الجدد، رأيكم يهمنا. شاركونا تجربتكم الفاخرة لتظهر هنا قريباً!
                      </p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-white border border-gray-200/60 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between"
                      >
                        <p className="text-gray-600 text-xs md:text-sm italic leading-relaxed font-sans">
                          "{rev.comment}"
                        </p>

                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                          {rev.avatar ? (
                            <img
                              src={rev.avatar}
                              alt={rev.username}
                              className="w-10 h-10 rounded-full object-cover border"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center text-gray-500 font-bold text-lg">
                              {rev.username.charAt(0)}
                            </div>
                          )}
                          <div className="text-xs font-sans">
                            <h5 className="font-bold text-gray-900">{rev.username}</h5>
                            <span className="text-gray-400 block text-[9px]">{rev.country === 'SA' ? 'المملكة العربية السعودية' : 'جمهورية مصر العربية'}</span>
                            <div className="flex gap-0.5 text-yellow-400 mt-0.5">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <span key={i}>★</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </section>

            {/* INSTAGRAM GALLERY SECTION REMOVED (No fake social posts) */}

            {/* NEWSLETTER JOIN SECTION (قسم الاشتراك بالبريد والجوال) */}
            <section className="py-16 bg-[#0B0B0B] text-white">
              <div className="max-w-xl mx-auto px-4 text-center space-y-6">
                
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#F6E7A6]">
                  <Mail size={18} />
                </div>

                <h3 className="font-serif text-2xl md:text-4xl font-light text-white tracking-wide">
                  انضمي إلى عالم SULTA الراقي
                </h3>
                <p className="text-gray-400 text-xs font-sans max-w-sm mx-auto leading-relaxed">
                  سجلي بريدك الإلكتروني لتكوني أول المستلمات لكتالوجات الأزياء الملكية الجديدة وكوبونات التوصيل المجاني طيلة العام.
                </p>

                {subscribeSuccess ? (
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-[#25D366] text-xs font-semibold font-sans">
                    تم تسجيل اشتراكك بكل رقي! تفحصي هاتفك وبريدك لتلقي المزايا قريباً جداً 🌸
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-3 font-sans">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="email"
                        placeholder="أدخلي بريدك الإلكتروني هنا"
                        value={subscribeEmail}
                        onChange={(e) => setSubscribeEmail(e.target.value)}
                        className="flex-1 text-xs border border-white/10 rounded-lg px-4 py-2.5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#F4B6C2]"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="رقم هاتف الجوال (اختياري)"
                        value={subscribePhone}
                        onChange={(e) => setSubscribePhone(e.target.value)}
                        className="flex-1 text-xs text-left border border-white/10 rounded-lg px-4 py-2.5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#F4B6C2]"
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#F4B6C2] text-white hover:bg-white hover:text-black font-semibold text-xs py-2.5 rounded-lg transition-colors"
                    >
                      مشاركة العضوية الفخرية
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
          <div className="max-w-4xl mx-auto px-4 py-16 font-sans text-xs md:text-sm text-gray-700 leading-relaxed">
            <h2 className="font-serif text-2xl md:text-4xl font-light text-center text-[#0B0B0B] mb-2">دليل المقاسات في بيت الأزياء SULTA</h2>
            <div className="w-12 h-0.5 bg-[#F4B6C2] mx-auto mt-4 mb-8" />
            
            <p className="text-center max-w-xl mx-auto text-gray-400 text-xs mb-8">
              نحن ندرك مدى أهمية ملاءمة ملابس النوم ومطابقتها الطبيعية لحجم الجسد لتنعمي بالراحة القصوى دون تكتيل. يرجى مراجعة الجدول التفصيلي التالي لطلب دقيق وعصري.
            </p>

            <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-xs max-w-2xl mx-auto mb-8">
              <table className="w-full text-center border-collapse text-xs md:text-sm">
                <thead className="bg-[#0B0B0B] text-white">
                  <tr>
                    <th className="p-3">دوم المقاس</th>
                    <th className="p-3">محيط الصدر (Inches)</th>
                    <th className="p-3">محيط الورك (Inches)</th>
                    <th className="p-3">أوزان مناسبة تقريبياً</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  <tr>
                    <td className="p-3 font-bold bg-[#FAFAF7]">XS / S</td>
                    <td className="p-3 font-sans">32" - 34"</td>
                    <td className="p-3 font-sans">34" - 36"</td>
                    <td className="p-3">45 - 58 كجم</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold bg-[#FAFAF7]">M / L</td>
                    <td className="p-3 font-sans">36" - 38"</td>
                    <td className="p-3 font-sans">38" - 41"</td>
                    <td className="p-3">60 - 75 كجم</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold bg-[#FAFAF7]">XL</td>
                    <td className="p-3 font-sans">40" - 42"</td>
                    <td className="p-3 font-sans">43" - 45"</td>
                    <td className="p-3">78 - 95 كجم</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl text-gray-800 max-w-xl mx-auto text-xs space-y-1">
              <strong>💡 نصيحة مصممي سولتا لكي:</strong>
              <p>إذا كنت تقعين بين مقاسين، نوصي دوماً باختيار المقاس الأكبر لملابس النوم لتأمين تمدد مريح ومناسب للحركة أثناء النوم والاسترخاء المنزلي.</p>
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
                  { id: 'about', label: 'رواد قصتنا وعن سولتا ✨' },
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
    </ToastProvider>
  );
}
