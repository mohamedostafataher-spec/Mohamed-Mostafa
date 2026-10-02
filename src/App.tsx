import { motion, AnimatePresence } from 'motion/react';
import SultaImage from "./components/SultaImage";
import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Star, ShoppingBag, Eye, ArrowRight, ArrowLeft, Mail, Phone, Check, Box, ShieldCheck, Instagram, Home, Package, User, X, Globe, Search, Truck, RefreshCw, Tag } from 'lucide-react';
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
import BlogView from './components/BlogView';
import BlogPostView from './components/BlogPostView';
import TrackOrder from './components/TrackOrder';
import SystemStatus from './components/SystemStatus';
import RibbonBowDivider from './components/RibbonBowDivider';
import SocialLinksView from './components/SocialLinksView';
import PremiumLuxuryExperience from './components/PremiumLuxuryExperience';
import FabricGuide from './components/FabricGuide';
import AtelierAudioAtmosphere from './components/AtelierAudioAtmosphere';

// Luxury Add-on views
import SultaCollections from './components/SultaCollections';
import BestSellers from './components/BestSellers';
import NewArrivals from './components/NewArrivals';
import TrendingNow from './components/TrendingNow';
import LuxuryGifts from './components/LuxuryGifts';
import LimitedPieces from './components/LimitedPieces';
import SleepExperience from './components/SleepExperience';
import SultaMagazine from './components/SultaMagazine';
import SultaConcierge from './components/SultaConcierge';
import AiMirror from './components/AiMirror';
import RoyalSensesSalon from './components/RoyalSensesSalon';
import WhatsAppFloat from './components/WhatsAppFloat';
import MobileBottomNav from './components/MobileBottomNav';

import { dbService, supabase, cleanImgUrl } from './services/db';
import { Product, CartItem, Country, DiscountCoupon, Order, Review, NewsletterSubscription, Collection, BlogPost } from './types';
import { recordView, recordCartAddition } from './utils/analytics';


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
  const [aiSplashImage, setAiSplashImage] = useState<string | null>(null);

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

    // Fetch AI Splash Image
    const fetchAiSplash = async () => {
      try {
        const res = await fetch('/api/generate-splash');
        const data = await res.json();
        if (data.imageUrl) {
          setAiSplashImage(data.imageUrl);
        }
      } catch (err) {
        console.error("Splash image generate error:", err);
      }
    };
    fetchAiSplash();

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

  const [country, setCountry] = useState<Country>(() => {
    try {
      const savedCountry = localStorage.getItem('sulta_user_country_preference');
      if (savedCountry === 'EG' || savedCountry === 'SA') {
        return savedCountry as Country;
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Africa/Cairo' || tz.includes('Cairo') || tz.includes('Egypt')) {
        return 'EG';
      }
      if (tz.includes('Riyadh') || tz.includes('Saudi') || tz.includes('Asia/Qatar') || tz.includes('Asia/Kuwait') || tz.includes('Asia/Bahrain') || tz.includes('Asia/Muscat') || tz.includes('Asia/Aden')) {
        return 'SA';
      }
      return 'EG'; // Default fallback
    } catch {
      return 'EG';
    }
  });

  // Synchronise manually chosen country changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sulta_user_country_preference', country);
    } catch (e) {
      console.warn('LocalStorage country write failed', e);
    }
  }, [country]);

  // High-precision geographic country detector (IP Geo-resolve -> Language resolution -> GMT/Timezone fallback)
  useEffect(() => {
    const detectGeographicCountry = async () => {
      // If user has an explicit saved preference in localStorage, respect it and do not overwrite or alert
      const savedPref = localStorage.getItem('sulta_user_country_preference');
      if (savedPref === 'EG' || savedPref === 'SA') {
        return;
      }

      let detected: 'EG' | 'SA' | null = null;

      // Tier 1: Check browser language strings for hints
      try {
        const lang = (navigator.language || '').toLowerCase();
        const langs = (navigator.languages || []).map(l => l.toLowerCase());
        const hasEgyptHint = [lang, ...langs].some(l => l.includes('eg') || l.includes('cairo'));
        const hasSaudiHint = [lang, ...langs].some(l => l.includes('sa') || l.includes('riyadh') || l.includes('gcc') || l.includes('arabia'));
        
        if (hasEgyptHint) {
          detected = 'EG';
        } else if (hasSaudiHint) {
          detected = 'SA';
        }
      } catch (err) {
        console.warn('Browser language analysis failed:', err);
      }

      // Tier 2: Real-time Geo-IP Resolution (Concurrent fast fallback)
      if (!detected) {
        try {
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            const data = await res.json();
            const code = String(data.country_code || '').toUpperCase();
            if (code === 'EG') {
              detected = 'EG';
            } else if (['SA', 'QA', 'KW', 'BH', 'OM', 'AE'].includes(code)) {
              detected = 'SA';
            }
          }
        } catch (err) {
          console.warn('Primary ipapi.co lookup failed. Querying backup...', err);
          
          try {
            const res = await fetch('https://ip-api.com/json/');
            if (res.ok) {
              const data = await res.json();
              const code = String(data.countryCode || '').toUpperCase();
              if (code === 'EG') {
                detected = 'EG';
              } else if (['SA', 'QA', 'KW', 'BH', 'OM', 'AE'].includes(code)) {
                detected = 'SA';
              }
            }
          } catch (backupErr) {
            console.warn('Backup ip-api lookup failed.', backupErr);
          }
        }
      }

      // Tier 3: Timezone check (Default fallback strategy)
      if (!detected) {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz === 'Africa/Cairo' || tz.includes('Cairo') || tz.includes('Egypt')) {
            detected = 'EG';
          } else if (tz.includes('Riyadh') || tz.includes('Saudi') || tz.includes('Asia/Qatar') || tz.includes('Asia/Kuwait') || tz.includes('Asia/Bahrain') || tz.includes('Asia/Muscat') || tz.includes('Asia/Aden')) {
            detected = 'SA';
          } else {
            detected = 'EG'; // Default fallback
          }
        } catch {
          detected = 'EG';
        }
      }

      // Apply detected localization setting
      if (detected && detected !== country) {
        setCountry(detected);
      }

      // Beautiful Luxe notification to make sure the customer feels welcomed and in control
      const sessionAlerted = sessionStorage.getItem('sulta_country_alerted');
      if (!sessionAlerted && detected) {
        sessionStorage.setItem('sulta_country_alerted', 'true');
        const flag = detected === 'SA' ? '🇸🇦' : '🇪🇬';
        const welcomeMessage = detected === 'SA' 
          ? `أهلاً بكِ في سولا! تم تحديد موقعك الجغرافي وتجربة السفر وتخصيص المتجر تلقائياً للمملكة العربية السعودية ${flag} (ريال سعودي SAR).`
          : `أهلاً بكِ في سولا! تم تحديد موقعك الجغرافي وتخصيص تجربة المتجر تلقائياً لجمهورية مصر العربية ${flag} (جنيه مصري EGP).`;
        
        setTimeout(() => {
          toast(welcomeMessage, 'success');
        }, 1500);
      }
    };

    detectGeographicCountry();
  }, [country, toast]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('sulta_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sulta_cart', JSON.stringify(cart));
    } catch (e) {
      console.error("[SULTA CART] Saving failure:", e);
    }
  }, [cart]);
  
  // Load initial favorites from LocalStorage with fallback support
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const activeSessionUser = typeof window !== 'undefined' ? localStorage.getItem('sulta_active_user_id') : null;
      const storageKey = activeSessionUser ? `sulta_favorites_${activeSessionUser}` : 'sulta_favorites_guest';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  // SULTA Order Tracking Center Deep-link Routing (Phase 1 & Phase 6 specs)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    
    // Check search queries
    const pageParam = params.get('page');
    const trackParam = params.get('track') || params.get('id');
    
    // Check pathname routing: /track-order/[order_number] or /order-tracking/[order_number]
    const trackPathMatch = pathname.match(/^\/(track-order|order-tracking)\/(.+)$/);
    
    if (pageParam === 'track-order' || trackParam) {
      setTab('track-order');
      if (trackParam) {
        window.localStorage.setItem('sulta_auto_track_order_id', trackParam);
      }
    } else if (trackPathMatch) {
      setTab('track-order');
      const foundOrderId = decodeURIComponent(trackPathMatch[2]);
      window.localStorage.setItem('sulta_auto_track_order_id', foundOrderId);
    }
  }, []);

  useEffect(() => {
    const handleGlobalOpenTab = (e: any) => {
      if (e.detail) {
        setTab('account');
      }
    };
    const handleGlobalSetTab = (e: any) => {
      if (e.detail) {
        setTab(e.detail);
      }
    };
    window.addEventListener('openAccountTab', handleGlobalOpenTab);
    window.addEventListener('setTab', handleGlobalSetTab);
    return () => {
      window.removeEventListener('openAccountTab', handleGlobalOpenTab);
      window.removeEventListener('setTab', handleGlobalSetTab);
    };
  }, []);

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
    let unsubPromotions: any = null;

    const initData = async () => {
      try {
        // Seed initial data if needed - safely caught so any database/table connection errors won't block the site
        try {
          await dbService.seedInitialData();
        } catch (e) {
          console.warn("[SULTA DB] Seeding initial data skipped or failed:", e);
        }

        // Clean experimental pajama from live database if present to ensure clean slate
        try {
          await supabase.from('products').delete().eq('id', 'experimental-pajama-001');
          console.log("[SULTA DB] Experimental template pajamas cleaned.");
        } catch (e) {
          console.warn("[SULTA DB] Cleaning experimental pajama failed:", e);
        }

        // Auth Session Sync
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        } catch (e) {
          console.error("[SULTA AUTH] Fetching active session failed:", e);
        }
        setAuthLoading(false);

        try {
          const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
          });
          subscription = data.subscription;
        } catch (e) {
          console.error("[SULTA AUTH] Setting auth state changes failed:", e);
        }

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

        // **. Live Sync Promotions
        unsubPromotions = dbService.subscribePromotions(
          (list) => {
            const now = new Date();
            const activePromo = list.find(p => p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now);
            if (activePromo && activePromo.bannerText) {
              setSettings(prev => prev ? { ...prev, promoBannerAr: activePromo.bannerText! } : prev);
            }
          },
          () => {}
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
      if (typeof unsubPromotions === 'function') unsubPromotions();
    };
  }, []);

  // UI Theme & Overlay States
  const [isMidnightVelvet, setIsMidnightVelvet] = useState<boolean>(false);

  // Synchronise or merge favorites when user session changes
  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem('sulta_active_user_id', session.user.id);
      
      const userKey = `sulta_favorites_${session.user.id}`;
      const savedUserFavs = localStorage.getItem(userKey);
      let userFavs: string[] = savedUserFavs ? JSON.parse(savedUserFavs) : [];
      
      // Seamless guest to user favorites transfer/merge on login
      const guestFavsRaw = localStorage.getItem('sulta_favorites_guest');
      if (guestFavsRaw) {
        try {
          const guestFavs: string[] = JSON.parse(guestFavsRaw);
          if (guestFavs.length > 0) {
            const merged = Array.from(new Set([...userFavs, ...guestFavs]));
            userFavs = merged;
            localStorage.setItem(userKey, JSON.stringify(merged));
            localStorage.removeItem('sulta_favorites_guest');
            console.log("[SULTA FAVORITES] Merged guest bookmarks into customer account:", merged);
          }
        } catch (e) {
          console.error("[SULTA FAVORITES] Merging guest bookmarks failed:", e);
        }
      }
      setFavorites(userFavs);
    } else {
      localStorage.removeItem('sulta_active_user_id');
      const guestFavsRaw = localStorage.getItem('sulta_favorites_guest');
      if (guestFavsRaw) {
        try {
          setFavorites(JSON.parse(guestFavsRaw));
        } catch {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    }
  }, [session]);

  // Persist updated favorites to appropriate storage bucket on state edits
  useEffect(() => {
    try {
      const activeUser = session?.user?.id;
      const storageKey = activeUser ? `sulta_favorites_${activeUser}` : 'sulta_favorites_guest';
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch (e) {
      console.error("[SULTA FAVORITES] Saving failure:", e);
    }
  }, [favorites, session]);
  
  // UI overlays states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBottomSearchOpen, setIsBottomSearchOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);


  // Subscription email / phone state
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribePhone, setSubscribePhone] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  // Handle Favorites toggle
  const toggleFavorite = (productId: string) => {
    const matchedProduct = products.find(p => p.id === productId);
    const prodName = matchedProduct ? matchedProduct.nameAr : 'المنتج الفاخر';

    setFavorites(prev => {
      const isFav = prev.includes(productId);
      if (isFav) {
        toast(`تم إزالة "${prodName}" من مفضلتك الملكية 🖤`, "info");
        return prev.filter(id => id !== productId);
      } else {
        toast(`تم إضافة "${prodName}" إلى مفضلتك الملكية ✨💖`, "success");
        return [...prev, productId];
      }
    });

    console.log(`Updated Wishlist item: ${productId}`);
  };

  // Add Item to Shopping Cart Bag
  const handleAddToCart = (product: Product, color: { name: string; hex: string }, size: string, qty: number = 1, customOpts?: any) => {
    recordCartAddition(product.id);
    setCart(prev => {
      const existingIdx = prev.findIndex(
        i => i.product.id === product.id && i.selectedColor.name === color.name && i.selectedSize === size
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + qty;
        copy[existingIdx].quantity = newQty > product.stock ? product.stock : newQty;
        if (customOpts) {
          copy[existingIdx] = { ...copy[existingIdx], ...customOpts };
        }
        return copy;
      }

      return [...prev, { product, selectedColor: color, selectedSize: size, quantity: qty, ...customOpts }];
    });

    toast(`تمت إضافة "${product.nameAr}" إلى الحقيبة الملكية بنجاح 🛍️`, 'success');
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
    
    // Save AI preference markers to localStorage
    try {
      const marker = `${product.nameAr} ${product.categoryAr || ''} ${product.tagAr || ''} ${product.fabricAr || ''} ${product.fabricEn || ''} ${product.keywords?.join(' ') || ''}`;
      localStorage.setItem('sulta_recently_viewed', marker);
    } catch { }
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      try {
        localStorage.setItem('sulta_search_history', query);
      } catch { }
    }
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
  const deleteProduct = React.useCallback(async (prodId: string, nameAr?: string) => {
    try {
      await dbService.deleteProduct(prodId);
      setProducts(prev => prev.filter(p => p.id !== prodId));
      toast(`تم حذف القطعة "${nameAr || ''}" بنجاح`, 'success');
    } catch (err) {
      console.error("Delete product error:", err);
      toast('فشل حذف المنتج من قاعدة البيانات', 'error');
    }
  }, []);

  const syncProducts = React.useCallback((value: React.SetStateAction<Product[]>) => {
    const nextArr = typeof value === 'function' ? value(products) : value;
    setProducts(nextArr);
  }, [products]);

  const syncCoupons = React.useCallback((value: React.SetStateAction<DiscountCoupon[]>) => {
    const nextArr = typeof value === 'function' ? value(coupons) : value;
    setCoupons(nextArr);
  }, [coupons]);

  const syncOrders = React.useCallback((value: React.SetStateAction<Order[]>) => {
    const nextArr = typeof value === 'function' ? value(orders) : value;
    setOrders(nextArr);
  }, [orders]);

  // Select home categories shortcut
  const handleSelectCategoryHome = (categoryId: string) => {
    setTab('store');
    // We can simulate an active selection by leaving it to StoreView filter
  };

  // Dynamic live homepage filtering systems - Excluding lingerie per user request
  const filteredProducts = products.filter(p => {
    const text = (p.nameAr + ' ' + p.nameEn + ' ' + (p.categoryAr || '') + ' ' + (p.category || '')).toLowerCase();
    if (text.includes('لانجيري') || text.includes('lingerie')) {
      return false;
    }
    if (country === 'EG') {
      if (settings?.saExclusiveProductIds && Array.isArray(settings.saExclusiveProductIds) && settings.saExclusiveProductIds.includes(p.id)) {
        return false;
      }
    } else if (country === 'SA') {
      if (settings?.egExclusiveProductIds && Array.isArray(settings.egExclusiveProductIds) && settings.egExclusiveProductIds.includes(p.id)) {
        return false;
      }
    }
    return true;
  });

  // Safe product pool ensuring products are ALWAYS visible and never empty
  const activeProducts = filteredProducts.filter(p => p.status === 'active' || !p.status);
  const catalogPool = activeProducts.length > 0 ? activeProducts : (filteredProducts.length > 0 ? filteredProducts : products);

  // Distinct product pools to eliminate repetitive product displays (Zero duplication)
  const bestSellers = catalogPool.slice(0, 6);
  const bestSellerIds = new Set(bestSellers.map(p => p.id));
  const remainingProducts = catalogPool.filter(p => !bestSellerIds.has(p.id));
  const newArrivals = remainingProducts.length > 0 ? remainingProducts.slice(0, 6) : catalogPool.slice(6, 12);
  const featuredProducts = catalogPool.slice(0, 6);
  const trendingProducts = catalogPool.slice(0, 6);
  const seasonalCollections = catalogPool.slice(0, 6);

  return (
      <div dir="rtl" className={`min-h-screen bg-[#FAF4F5] font-sans text-gray-900 pb-16 md:pb-0 transition-all duration-1000 ${isMidnightVelvet ? 'midnight-velvet-active bg-[#0B0B0B] text-white' : ''}`}>
      
      {/* SCREEN 1: BRAND SPLASH SCREEN OVERLAY */}
      {showSplash && (
        <div className="fixed inset-0 bg-[#0B0B0B] z-[100] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in overflow-hidden">
          {/* AI Generated Background Layer */}
          {aiSplashImage && (
            <div className="absolute inset-0 z-0 animate-fade-in duration-1000">
              <SultaImage 
                src={aiSplashImage} 
                className="w-full h-full object-cover opacity-20 scale-110 blur-sm" 
                alt="AI Generated Background"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B] via-transparent to-[#0B0B0B]" />
            </div>
          )}

          <div className="max-w-md w-full space-y-6 relative z-10">
            <div className="space-y-3">
              <span className="text-[10px] text-[#F4B6C2] font-semibold tracking-[0.3em] uppercase block animate-pulse font-sans">
                ✦ BIENVENUE DANS L'ATELIER SULTA ✦
              </span>
              <h1 className="font-serif text-5xl md:text-7xl font-extralight text-white tracking-[0.2em] translate-x-[4px] uppercase">
                SULTA
              </h1>
              <div className="w-12 h-[1px] bg-white/20 mx-auto my-3" />
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[10.5px] font-serif italic text-[#F6E7A6] tracking-wider block">
                  Where Comfort Meets Elegance
                </span>
                {aiSplashImage && (
                  <span className="text-[8px] text-[#F4B6C2]/60 font-sans tracking-widest uppercase">
                    AI Visual Re-generated
                  </span>
                )}
              </div>
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
        products={products}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFavorites={() => {
          setTab('account');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openAccountTab', { detail: 'wishlist' }));
          }, 60);
        }} // wishlist is in Account screen tab
        onSearch={(query) => {
          handleSearchQueryChange(query);
          setTab('store');
        }}
      />

      {/* CORE DYNAMIC LAYOUT BASED ON ACTIVE TAB */}
      <main className="animate-fade-in-rapid overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
        
        {/* VIEW: DATABASE TEST (تشخيص القاعدة) */}
        {currentTab === 'dbtest' && <DatabaseTest />}

        {/* VIEW 1: HOME PAGE (الرئيسية) */}
        {currentTab === 'home' && (
          <div className="space-y-0">
            
            {/* 1. SALLA HERO PROMOTIONS CAROUSEL */}
            <Hero
              settings={settings}
              homepageSections={homepageSections}
              onExplore={() => setTab('store')}
              onDiscoverNew={() => {
                setTab('offers');
              }}
            />

            {/* 2. FAST HORIZONTAL SALLA CATEGORY CHIPS RAIL */}
            <div className="bg-white border-b border-gray-200/80 sticky top-[95px] sm:top-[112px] z-30 py-2 sm:py-2.5 px-3 sm:px-6 shadow-2xs">
              <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { id: 'all', label: 'الكل 👑', action: () => setTab('store') },
                  { id: 'offers', label: 'العروض والتخفيضات 🏷️', action: () => setTab('offers'), isHot: true },
                  { id: 'pajamas', label: 'بيجامات النوم 🎀', action: () => { setTab('store'); handleSearchQueryChange('بيجاما'); } },
                  
                  
                  { id: 'best-sellers', label: 'الأكثر طلباً 🔥', action: () => setTab('best-sellers') },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={chip.action}
                    className={`shrink-0 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border select-none ${
                      chip.isHot 
                        ? 'bg-rose-50 text-[#A44C5C] border-rose-200 hover:bg-rose-100 shadow-2xs' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-black hover:border-gray-300'
                    }`}
                  >
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. DYNAMIC HOMEPAGE PRODUCT SECTIONS (ONLY 2 CLEAN DISTINCT LISTS - NO REPETITION) */}
            {[
              { title: 'الأكثر طلباً ومبيعاً 🔥', label: 'قطع نالت إعجاب واختيار العميلات', data: bestSellers },
              { title: 'وصل حديثاً من تشكيلة البيجامات والفساتين ✨', label: 'أحدث تصاميم أزياء النوم والساتان الملكي', data: newArrivals },
            ].map((section, sectionIdx) => (
              <React.Fragment key={section.title}>
                <section className={`py-8 sm:py-12 ${sectionIdx % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]'}`} dir="rtl">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="flex items-center justify-between mb-5 sm:mb-8 pb-2 sm:pb-3 border-b border-gray-200/80">
                      <div className="text-right">
                        <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                          {section.title}
                        </h3>
                        <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5 sm:mt-1">
                          {section.label}
                        </p>
                      </div>
                      <button
                        onClick={() => setTab('store')}
                        className="text-xs font-bold text-[#A44C5C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>عرض الكل</span>
                        <span>←</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                      {section.data.length > 0 ? section.data.slice(0, 8).map((prod) => {
                        const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
                        const currencyLabel = country === 'EG' ? 'ج.م' : 'ر.س';
                        const isFav = favorites.includes(prod.id);

                        return (
                          <div
                            key={prod.id}
                            className="group flex flex-col h-full bg-white rounded-2xl p-2 sm:p-3 overflow-hidden border border-gray-150 hover:border-gray-300 transition-all duration-300 hover:shadow-lg relative select-none cursor-pointer justify-between"
                            onClick={() => handleSelectProduct(prod)}
                          >
                            <div>
                              {/* Top Photo Frame */}
                              <div className="relative aspect-[3/4] overflow-hidden bg-[#F8F9FA] rounded-xl mb-2 sm:mb-2.5 flex items-center justify-center">
                                {/* Badges */}
                                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                  {prod.isBestSeller && (
                                    <span className="bg-[#F59E0B] text-black text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                                      الأكثر طلباً 👑
                                    </span>
                                  )}
                                  {prod.featured && (
                                    <span className="bg-[#111827] text-white text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                                      جديد ✨
                                    </span>
                                  )}
                                </div>

                                {/* Favorite Heart Button */}
                                <div className="absolute top-2 right-2 z-10">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }} 
                                    className="w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xs text-gray-500 hover:text-red-500 transition-transform hover:scale-110 cursor-pointer"
                                    title="إضافة للمفضلة"
                                  >
                                    <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : ""} />
                                  </button>
                                </div>

                                <img
                                  src={cleanImgUrl(prod.images[0], prod.category)}
                                  alt={prod.nameAr || prod.nameEn}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('sulta_default')) {
                                      target.src = '/img/sulta_default_1_1781140865386.png';
                                    }
                                  }}
                                />
                              </div>

                              {/* Text details bottom */}
                              <div className="space-y-1 text-right">
                                <span className="text-[10px] text-gray-400 font-medium block">
                                  {prod.categoryAr || prod.category || 'ملابس نوم فاخرة'}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-gray-950 line-clamp-2 leading-snug group-hover:text-[#A44C5C] transition-colors">
                                  {prod.nameAr || prod.nameEn}
                                </h4>
                                
                                {/* Rating */}
                                <div className="flex items-center gap-1 justify-start pt-0.5">
                                  <div className="flex items-center text-amber-400">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <svg key={i} className={`w-2.5 h-2.5 ${i < Math.round(prod.rating || 5) ? "fill-current" : "text-gray-200"}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono">({prod.reviewsCount || 28})</span>
                                </div>
                              </div>
                            </div>

                            {/* Price & Add to Cart button */}
                            <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                              <div className="flex items-baseline justify-between">
                                <span className="font-extrabold text-sm sm:text-base text-gray-950 font-mono" dir="ltr">
                                  {priceVal.toLocaleString()} {currencyLabel}
                                </span>
                                <span className="text-[9.5px] text-gray-400">شامل الضريبة</span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const chosenCol = prod.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' };
                                  const chosenSz = prod.sizes?.[0] || 'S';
                                  handleAddToCart(prod, chosenCol, chosenSz, 1);
                                }}
                                className="w-full py-2 px-2.5 rounded-xl bg-[#111827] hover:bg-[#A44C5C] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98 cursor-pointer"
                              >
                                <ShoppingBag size={13} />
                                <span>أضف للسلة</span>
                              </button>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="col-span-full text-center text-gray-400 py-6 text-xs">
                          جاري تحديث تشكيلة القطع الحالية.
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* SALLA FLASH OFFERS PROMO RIBBON (Placed between sections seamlessly) */}
                {sectionIdx === 0 && (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="rounded-2xl bg-gradient-to-l from-rose-50 via-white to-pink-50 border border-pink-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                      <div className="text-right space-y-1 max-w-xl">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#A44C5C]/10 text-[#A44C5C] font-bold text-[11px]">
                          <Sparkles size={11} />
                          <span>خصم إضافي وشحن مجاني 🏷️</span>
                        </div>
                        <h4 className="text-base sm:text-xl font-black text-gray-950">
                          وفري حتى 30% على تشكيلات النوم والحرير الملكي
                        </h4>
                        <p className="text-gray-600 text-[11px] sm:text-xs">
                          استخدمي كود الخصم الترحيبي <strong className="font-mono text-[#A44C5C] bg-white px-2 py-0.5 rounded border border-pink-200">SULTA20</strong> عند إتمام الطلب للحصول على خصم فوري وشحن مجاني!
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => setTab('offers')}
                          className="w-full sm:w-auto bg-[#111827] hover:bg-[#A44C5C] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>تسوقي العروض الآن</span>
                          <ArrowLeft size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* 6. FULL WIDTH LUXURIOUS BANNER WITH FALLBACK */}
            {(() => {
              const bannerSection = homepageSections.find(s => s.section_key === 'middle_banner');
              const bannerData = bannerSection?.content_json || {
                active: true,
                imageUrl: '/img/sulta_luxury_pajama_hero_2_1780682794821.png',
                subtitle: 'Because You Deserve',
                title: 'THE SOFTEST LIFE',
                buttonText: 'SHOP THE COLLECTION'
              };
              if (!bannerData.active) return null;
              return (
                <section className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-r from-rose-50 via-white to-pink-50 border-y border-pink-100">
                  <div className="relative z-20 max-w-4xl mx-auto px-4 text-center space-y-4">
                    <span className="text-xs tracking-widest text-[#A44C5C] uppercase flex items-center justify-center gap-1.5 font-bold">
                      <Sparkles size={14} />
                      <span>{bannerData.subtitle}</span>
                    </span>
                    <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-950 tracking-tight">
                      {bannerData.title}
                    </h3>
                    <div className="pt-4">
                      <button
                        onClick={() => setTab('store')}
                        className="bg-[#111827] text-white hover:bg-[#A44C5C] px-8 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-md hover:scale-102 cursor-pointer"
                      >
                        {bannerData.buttonText}
                      </button>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* 7. FEATURES & UNBOXING (DYNAMIC FROM SUPABASE) */}
            <Features homepageSections={homepageSections} />

            {/* 8. NEWSLETTER JOIN SECTION */}
            <section className="py-16 bg-[#F8F9FA] text-gray-900 border-t border-gray-200">
              <div className="max-w-xl mx-auto px-6 text-center space-y-4">
                <span className="text-2xl">💌</span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                  انضمي إلى نادي SULTA الحصري
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  اشتركي لتصلكِ أحدث العروض الحصرية، إشعارات توفر الموديلات الجديدة وكوبونات الخصم قبل الجميع.
                </p>

                {subscribeSuccess ? (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold">
                    شكراً لاشتراككِ! تم تسجيل بريدكِ بنجاح. 🌸
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="pt-2 font-sans flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="أدخلي بريدكِ الإلكتروني..."
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="flex-1 text-xs border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#A44C5C] text-right"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-[#111827] text-white hover:bg-[#A44C5C] font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      اشتراك
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* 9. SALLA TRUST PILLARS BAR (Placed cleanly above footer) */}
            <div className="bg-white border-y border-gray-200/80 py-6 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-xs font-semibold text-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-[#A44C5C] flex items-center justify-center shrink-0">
                    <Truck size={18} />
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-gray-950 text-xs sm:text-sm">شحن سريع ومجاني</span>
                    <span className="text-[10px] sm:text-[11px] text-gray-500">فوق {country === 'SA' ? '299 ر.س 🇸🇦' : '1500 ج.م 🇪🇬'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-gray-950 text-xs sm:text-sm">سداد آمن 100%</span>
                    <span className="text-[10px] sm:text-[11px] text-gray-500">مدى، Apple Pay والدفع عند الاستلام</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <RefreshCw size={18} />
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-gray-950 text-xs sm:text-sm">استبدال واسترجاع سهل</span>
                    <span className="text-[10px] sm:text-[11px] text-gray-500">خلال 14 يوماً بكل مرونة</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-gray-950 text-xs sm:text-sm">خدمة عملاء واتساب</span>
                    <a 
                      href={country === 'SA' ? "https://wa.me/966596894393" : "https://wa.me/201110095403"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] sm:text-[11px] text-emerald-700 font-mono font-bold hover:underline"
                    >
                      {country === 'SA' ? '0596894393 🇸🇦' : '+20 111 009 5403 🇪🇬'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: STORE PAGE (المتجر مع الفلترة الكاملة) */}
        {currentTab === 'store' && (
          <StoreView
            products={filteredProducts}
            categories={categories}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onAddToCart={(prod, col, sz) => handleAddToCart(prod, col, sz, 1)}
            onSelectProduct={handleSelectProduct}
            searchQuery={searchQuery}
            onClearSearch={() => handleSearchQueryChange('')}
            onSearchQueryChange={handleSearchQueryChange}
            recentlyViewed={recentlyViewed}
          />
        )}

        {/* VIEW: OFFERS PAGE (صفحة العروض والتخفيضات - مثل سلة ونله كير) */}
        {currentTab === 'offers' && (
          <StoreView
            products={filteredProducts}
            categories={categories}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onAddToCart={(prod, col, sz) => handleAddToCart(prod, col, sz, 1)}
            onSelectProduct={handleSelectProduct}
            searchQuery={searchQuery}
            onClearSearch={() => handleSearchQueryChange('')}
            onSearchQueryChange={handleSearchQueryChange}
            recentlyViewed={recentlyViewed}
            initialCategory="offers"
          />
        )}

        {/* VIEW: SULTA COLLECTIONS */}
        {currentTab === 'collections' && (
          <SultaCollections
            collections={collections}
            categories={categories}
            products={filteredProducts}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
            setTab={setTab}
          />
        )}

        {/* VIEW: BEST SELLERS */}
        {currentTab === 'best-sellers' && (
          <BestSellers
            products={products}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* VIEW: NEW ARRIVALS */}
        {currentTab === 'new-arrivals' && (
          <NewArrivals
            products={products}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* VIEW: TRENDING NOW */}
        {currentTab === 'trending' && (
          <TrendingNow
            products={products}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* VIEW: LUXURY GIFTS */}
        {currentTab === 'luxury-gifts' && (
          <LuxuryGifts
            products={products}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(prod, col, sz, qty) => handleAddToCart(prod, col, sz, qty)}
          />
        )}

        {/* VIEW: LIMITED PIECES */}
        {currentTab === 'limited-pieces' && (
          <LimitedPieces
            products={products}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* VIEW: SLEEP EXPERIENCE */}
        {currentTab === 'sleep-experience' && (
          <SleepExperience
            products={products}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* VIEW: SULTA CONCIERGE */}
        {currentTab === 'concierge' && (
          <SultaConcierge
            products={products}
            country={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(prod, col, sz, qty) => handleAddToCart(prod, col, sz, qty)}
          />
        )}

        {/* VIEW 3: PREMIUM DYNAMIC FABRIC GUIDE PAGE */}
        {currentTab === 'fabrics' && (
          <FabricGuide homepageSections={homepageSections} />
        )}

        {/* VIEW 4: ABOUT ABOUT DETAILS (من نحن) */}
        {currentTab === 'about' && (
          <AboutUs homepageSections={homepageSections} />
        )}

        {/* VIEW 5: CONTACT CONTACT DETAILS (تواصل معنا) */}
        {currentTab === 'contact' && (
          <ContactUs settings={settings} />
        )}

        {/* TRACK ORDER */}
        {currentTab === 'track-order' && (
          <TrackOrder />
        )}

        {/* SYSTEM STATUS */}
        {currentTab === 'system-status' && (
          <SystemStatus />
        )}

        {/* VIEW 6: ACCOUNT ACCOUNT SCREEN (حساب العميل والمفضلة) */}
        {currentTab === 'account' && (
          <AccountView
            session={session}
            country={country}
            orders={orders}
            favorites={favorites}
            products={products}
            recentlyViewed={recentlyViewed}
            toggleFavorite={toggleFavorite}
            onSelectProduct={handleSelectProduct}
            onReorder={handleReorder}
            onNavigateToDashboard={() => setTab('dashboard')}
            onAddToCart={handleAddToCart}
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

        {/* VIEW 10: BLOG / JOURNAL (مجلة SULTA) */}
        {(currentTab === 'blog' || currentTab === 'magazine') && (
          selectedBlogPost ? (
            <BlogPostView post={selectedBlogPost} onBack={() => setSelectedBlogPost(null)} />
          ) : (
            <SultaMagazine onReadPost={setSelectedBlogPost} />
          )
        )}

        {/* VIEW LUXURY SALON EXPERIENCE */}
        {currentTab === 'luxury-salon' && (
          <PremiumLuxuryExperience
            products={products}
            currentCountry={country}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            toast={toast}
            onClose={() => setTab('home')}
          />
        )}

        {/* VIEW: SULTA AI MIRROR */}
        {currentTab === 'ai_mirror' && (
          <AiMirror
            products={products}
            setTab={setTab}
            country={country}
            onSelectProduct={handleSelectProduct}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}

        {/* VIEW: ROYAL SENSES SALON */}
        {currentTab === 'royal-senses' && (
          <RoyalSensesSalon
            products={products}
            country={country}
            onAddToCart={handleAddToCart}
            onSelectProduct={handleSelectProduct}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            setTab={setTab}
          />
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
            toast={toast}
            deleteProduct={deleteProduct}
          />
        )}

          {/* Professional 404 Fallback View */}
          {!['home', 'offers', 'store', 'collections', 'best-sellers', 'new-arrivals', 'trending', 'luxury-gifts', 'limited-pieces', 'sleep-experience', 'concierge', 'fabrics', 'about', 'contact', 'track-order', 'system-status', 'account', 'faq', 'returns', 'blog', 'magazine', 'luxury-salon', 'ai_mirror', 'royal-senses', 'dashboard', 'dbtest'].includes(currentTab) && (
            <div className="py-32 flex flex-col items-center justify-center text-center bg-[#FAF9F6] min-h-[60vh] px-4" dir="rtl">
              <span className="text-8xl mb-4 font-serif text-[#DF8A9C]/20 opacity-50">404</span>
              <h2 className="text-2xl md:text-3xl font-serif text-[#0B0B0B] mb-4">الغرفة الملكية غير موجودة</h2>
              <p className="text-gray-500 font-sans max-w-md text-xs md:text-sm leading-relaxed mb-8">
                يبدو أنكِ بحثتِ عن تصنيف أو صفحة لم تعد متوفرة في صالاتنا. القطع الأنيقة دائماً في تجدد مستمر.
              </p>
              <button
                onClick={() => setTab('home')}
                className="bg-[#0B0B0B] text-[#F6E7A6] px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#DF8A9C] hover:text-white transition-all shadow-sm"
              >
                العودة للرئيسية
              </button>
            </div>
          )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* OVERLAY MODAL 1: DYNAMICAL PRODUCT DETAILED VIEW */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          products={products}
          country={country}
          onClose={() => setSelectedProduct(null)}
          onSelectProduct={setSelectedProduct}
          onAddToCart={(prod, col, sz, qty, customOpts) => {
            handleAddToCart(prod, col, sz, qty, customOpts);
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

      {/* GLOBAL SALLA / NALAH STYLE CLEAN WHITE FOOTER */}
      <footer className="bg-white text-gray-700 pt-16 pb-8 border-t border-gray-200 select-none font-sans text-xs" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Logo & Brand Story Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setTab('home')}>
              <span className="font-serif text-2xl font-black tracking-widest text-[#111827] uppercase">
                {settings?.siteName || 'SULTA'}
              </span>
              <span className="text-[#A44C5C] text-sm">👑</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold block text-gray-400 font-sans -mt-2">
              سُـلـطَـة · أزياء النوم الفاخرة
            </span>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs pt-1">
              متجر سعودي متكامل مصمم لتقديم أرقى خامات البيجامات والملابس المنزلية المترفة للنساء في المملكة العربية السعودية ومصر بأعلى معايير الجودة والفخامة.
            </p>
            <div className="pt-2">
              <SocialLinksView settings={settings} className="flex gap-2 pt-2 justify-start" />
            </div>
          </div>

          {/* Quick Deep links */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-sm text-gray-900 tracking-wide pb-1 border-b border-gray-100">
              روابط المتجر السريعة
            </h4>
            <div className="flex flex-col gap-2 font-sans items-start text-right text-gray-600">
              <button type="button" onClick={() => setTab('home')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">الرئيسية</button>
              <button type="button" onClick={() => setTab('offers')} className="hover:text-[#A44C5C] font-bold text-[#A44C5C] transition-colors cursor-pointer flex items-center gap-1">
                <span>العروض والتخفيضات الحصرية</span>
                <span className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0.2 rounded-full font-bold">خصومات</span>
              </button>
              <button type="button" onClick={() => setTab('store')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">المتجر الشامل</button>
              <button type="button" onClick={() => setTab('best-sellers')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">الأكثر طلباً ومبيعاً</button>
              <button type="button" onClick={() => setTab('new-arrivals')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">وصل حديثاً</button>
              <button type="button" onClick={() => setTab('account')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">حسابي والطلبات</button>
              <button type="button" onClick={() => setTab('dashboard')} className="hover:text-black text-gray-400 text-[10px] transition-colors cursor-pointer mt-1">لوحة الإدارة للبراند</button>
            </div>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3.5 font-sans">
            <h4 className="font-bold text-sm text-gray-900 tracking-wide pb-1 border-b border-gray-100">
              خدمة العملاء والسياسات
            </h4>
            <div className="flex flex-col gap-2 items-start text-right text-gray-600">
              <button type="button" onClick={() => setTab('faq')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">الأسئلة الشائعة للعرائس</button>
              <button type="button" onClick={() => setTab('track-order')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">تتبع طلبيتكِ</button>
              <button type="button" onClick={() => setTab('returns')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">سياسة الاسترجاع والاستبدال (١٤ يوماً)</button>
              <button type="button" onClick={() => setTab('fabrics')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">دليل الخامات الحريرية والساتان</button>
              <button type="button" onClick={() => setTab('contact')} className="hover:text-[#A44C5C] transition-colors cursor-pointer">اتصلي بنا</button>
              <div className="pt-2 text-[10.5px] text-gray-400 leading-normal">
                ✓ شحن سريع ومغلف بعناية فائقة<br />
                ✓ منتجات أصلية 100% مضمونة
              </div>
            </div>
          </div>

          {/* Direct WhatsApp & Payment Badges */}
          <div className="space-y-3.5 font-sans">
            <h4 className="font-bold text-sm text-gray-900 tracking-wide pb-1 border-b border-gray-100">
              تواصل واتساب والدعم السريع
            </h4>
            <div className="space-y-2 text-xs">
              <a 
                href="https://wa.me/966596894393?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20SULTA%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D9%85%D9%88%D8%AF%D9%8A%D9%84%D8%A7%D8%AA%20%D9%88%D8%A7%D9%84%D8%B7%D9%84%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 transition-colors group shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇸🇦</span>
                  <div className="text-right">
                    <span className="block font-bold text-emerald-950 text-[11px]">واتساب خدمة عملاء السعودية</span>
                    <span className="text-[10px] text-emerald-700">متاح للمساعدة الفورية والطلبات</span>
                  </div>
                </div>
                <span className="font-mono text-emerald-900 font-black text-xs" dir="ltr">0596894393</span>
              </a>

              <a 
                href="https://wa.me/201110095403?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20SULTA%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D9%85%D9%88%D8%AF%D9%8A%D9%84%D8%A7%D8%AA%20%D9%88%D8%A7%D9%84%D8%B7%D9%84%D8%A8%20%D9%81%D9%8A%20%D9%85%D8%B5%D8%B1" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors group shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇪🇬</span>
                  <div className="text-right">
                    <span className="block font-bold text-gray-900 text-[11px]">واتساب خدمة عملاء مصر</span>
                    <span className="text-[10px] text-gray-500">للاستفسارات ومتابعة الشحنات</span>
                  </div>
                </div>
                <span className="font-mono text-gray-800 font-bold text-xs" dir="ltr">+20 111 009 5403</span>
              </a>
            </div>

            <div className="pt-2">
              <h5 className="font-bold text-[11px] text-gray-900 mb-2">وسائل الدفع المعتمدة</h5>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="bg-[#F8F9FA] border border-gray-200 px-2 py-1 rounded text-[10px] font-bold text-gray-800 shadow-2xs">مدى Mada</span>
                <span className="bg-[#F8F9FA] border border-gray-200 px-2 py-1 rounded text-[10px] font-bold text-gray-800 shadow-2xs">Apple Pay</span>
                <span className="bg-[#F8F9FA] border border-gray-200 px-2 py-1 rounded text-[10px] font-bold text-gray-800 shadow-2xs">تابي Tabby</span>
                <span className="bg-[#F8F9FA] border border-gray-200 px-2 py-1 rounded text-[10px] font-bold text-gray-800 shadow-2xs">تمارا Tamara</span>
                <span className="bg-[#F8F9FA] border border-gray-200 px-2 py-1 rounded text-[10px] font-bold text-gray-800 shadow-2xs">Visa / Master</span>
                <span className="bg-[#F8F9FA] border border-gray-200 px-2 py-1 rounded text-[10px] font-bold text-gray-800 shadow-2xs font-sans">الدفع عند الاستلام</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom credits & Salla Trust Stamp */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-500 font-sans">
          <div className="flex items-center gap-2">
            <span>جميع الحقوق محفوظة © ٢٠٢٦ متجر SULTA للأزياء الفاخرة</span>
            <span className="text-gray-300">·</span>
            <span>الرقم الضريبي الموحد مسجل ومعتمد</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
              ✓ موثق في المركز السعودي للأعمال
            </span>
          </div>
        </div>
      </footer>

      {/* MOBILE DRAWER MODAL OVERLAY (Simplified and completely bug-free on all mobile viewports) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] font-sans">
          {/* Blur backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer container aligned with RTL right-side slot */}
          <div className="fixed top-0 right-0 bottom-0 w-85 max-w-[90vw] bg-white h-full shadow-2xl flex flex-col p-6 z-50 animate-slide-right-drawer border-l border-[#DF8A9D]/12 text-right overflow-y-auto justify-between">
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
              <div className="space-y-1.5 py-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  تصفحي البوتيك وعالمنا الفاخر ✦
                </span>
                
                {[
                  { id: 'home', label: 'الرئيسية 🏠' },
                  { id: 'offers', label: 'العروض والتخفيضات 🏷️' },
                  { id: 'store', label: 'المتجر والكتالوج 🛍️' },
                  { id: 'best-sellers', label: 'الأكثر مبيعاً 🏆' },
                  { id: 'new-arrivals', label: 'أحدث الإصدارات 🆕' },
                  { id: 'collections', label: 'SULTA Collections ✨' },
                  { id: 'ai_mirror', label: 'مرآة SULTA الذكية 🪞' },
                  { id: 'trending', label: 'الأكثر رواجاً 🔥' },
                  { id: 'luxury-gifts', label: 'هدايا SULTA 🎁' },
                  { id: 'limited-pieces', label: 'القطع المحدودة 💎' },
                  { id: 'sleep-experience', label: 'Sleep Experience 💤' },
                  { id: 'magazine', label: 'SULTA Magazine 📰' },
                  { id: 'concierge', label: 'SULTA Concierge 👑' },
                  { id: 'faq', label: 'مركز المساعدة ❓' },
                  { id: 'returns', label: 'سياسة الشحن والاسترجاع 📦' },
                  { id: 'about', label: 'عالم SULTA 🏛️' },
                ].map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-right text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-[#111827] text-white font-bold shadow-xs'
                          : 'text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-black border border-transparent'
                      }`}
                    >
                      <span className="font-sans text-[11.5px]">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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
                  className={`w-full text-right text-xs font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'account' ? 'bg-[#111827] text-white' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
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
                  className={`w-full text-right text-xs font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'dashboard' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'text-gray-655 bg-gray-50/30 hover:bg-pink-50/30'
                  }`}
                >
                  <span>لوحة تحكم الإدارة والطلبيات ⚙️</span>
                  <span className="bg-[#F6E7A6] text-gray-000 px-1.5 py-0.5 rounded text-[9px] font-bold text-left">بوابة الإدارة</span>
                </button>
              </div>
            </div>

            {/* Quick Country switcher & WhatsApp in Mobile menu list */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
              <a
                href={country === 'SA' ? "https://wa.me/966596894393?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20SULTA%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D9%88%D8%A7%D9%84%D8%B7%D9%84%D8%A8" : "https://wa.me/201110095403?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20SULTA%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D9%88%D8%A7%D9%84%D8%B7%D9%84%D8%A8"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-2.5 px-3.5 rounded-xl font-sans font-bold text-xs flex items-center justify-between shadow-sm hover:bg-[#20ba59] transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">💬</span>
                  <span>واتساب خدمة العملاء ({country === 'SA' ? 'السعودية 🇸🇦' : 'مصر 🇪🇬'})</span>
                </span>
                <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded-full" dir="ltr">
                  {country === 'SA' ? '0596894393' : '+201110095403'}
                </span>
              </a>

              <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-500">الوجهة والعملة:</span>
                <button
                  onClick={() => {
                    setCountry(country === 'SA' ? 'EG' : 'SA');
                  }}
                  className="bg-white border border-gray-250 shadow-2xs text-[10.5px] px-2.5 py-1 rounded-full font-bold text-[#0B0B0B] hover:border-[#DF8A9D] transition-colors cursor-pointer"
                >
                  {country === 'SA' ? '🇸🇦 SAR (السعودية)' : '🇪🇬 EGP (مصر)'}
                </button>
              </div>

              {/* Bottom footer text inside drawer */}
              <div className="text-center text-[9px] text-gray-400 space-y-0.5 pb-2">
                <p className="font-serif italic font-medium tracking-wide text-gray-500">Where Comfort Meets Elegance</p>
                <p>تشحن ومعبأة بعناية فائقة © ٢٠٢٦ ✦</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SALLA MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        currentTab={currentTab}
        setTab={setTab}
        cart={cart}
        favorites={favorites}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFavorites={() => setTab('account')}
      />

      {/* FLOATING BOTTOM SEARCH MODAL */}
      {isBottomSearchOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[101] flex items-center justify-center p-4 transition-all" dir="rtl">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-lg border border-[#DF8A9D]/15 shadow-2xl relative text-right animate-scale-up">
            <button 
              onClick={() => setIsBottomSearchOpen(false)}
              className="absolute top-6 left-6 text-gray-400 hover:text-[#A44C5C] p-2 hover:bg-neutral-100 rounded-full cursor-pointer transition-all border border-transparent"
            >
              <X size={18} />
            </button>
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-[#A44C5C] text-[10px] font-bold tracking-widest font-sans uppercase">
                <Search size={12} />
                <span>البحث الذكي الملكي | SULTA SEARCH ENGINE</span>
              </div>
              <h3 className="font-serif text-xl font-light text-gray-900">ما الذي تبحثين عنه اليوم؟</h3>
              <p className="text-3xs sm:text-2xs text-gray-450 leading-relaxed font-sans">اكتبي ما يلهم طقوسكِ لتعثري عليه فوراً بلمح البصر في بوتيك سُلْطَة الملوكي.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                setIsBottomSearchOpen(false);
                setTab('store');
              }} className="relative mt-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="ابحثي عن حرير، عرايس، شتوي..."
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  className="w-full bg-[#FAF5F0] rounded-full border border-gray-200 px-6 py-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A44C5C]/15 focus:border-[#A44C5C] text-right shadow-2xs font-sans"
                />
                <button 
                  type="submit"
                  className="absolute left-3 top-2.5 bg-[#A44C5C] hover:bg-[#A44C5C]/90 text-white text-3xs font-bold px-4 py-2.5 rounded-full cursor-pointer transition-all shadow-2xs font-sans"
                >
                  بحث
                </button>
              </form>

              {/* Live instant suggestions for SULTA Search Engine */}
              {searchQuery.trim().length >= 1 && (
                <div className="mt-4 border-t border-gray-150 pt-4 space-y-3" dir="rtl">
                  <div className="text-[10px] text-gray-400 font-bold tracking-wider uppercase font-sans flex items-center justify-between">
                    <span>اقتراحات فورية ملكية</span>
                    <span className="bg-amber-50 text-[#c5a059] px-2 py-0.5 rounded-full text-[9px]">
                      {products.filter(p => {
                        const q = searchQuery.toLowerCase().trim();
                        return p.nameAr.toLowerCase().includes(q) || p.categoryAr?.toLowerCase().includes(q) || p.colors?.some(c => c.name.toLowerCase().includes(q));
                      }).length} قطعة مطابقة
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {products
                      .filter(p => {
                        const q = searchQuery.toLowerCase().trim();
                        return p.nameAr.toLowerCase().includes(q) || p.categoryAr?.toLowerCase().includes(q) || p.colors?.some(c => c.name.toLowerCase().includes(q));
                      })
                      .slice(0, 4)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSearchQuery(p.nameAr);
                            setIsBottomSearchOpen(false);
                            setTab('store');
                          }}
                          className="flex items-center gap-3 p-2 bg-[#FAF5F0]/50 hover:bg-[#FAF5F0] rounded-xl border border-gray-150/40 cursor-pointer transition-all duration-300 group hover:border-[#A44C5C]/30"
                        >
                          <div className="w-10 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                            <SultaImage src={p.images?.[0]} alt={p.nameAr} className="w-full h-full" imgClassName="object-cover" />
                          </div>
                          <div className="text-right flex-1 min-w-0">
                            <h4 className="text-xs font-serif font-medium text-gray-900 group-hover:text-[#A44C5C] transition-colors truncate">{p.nameAr}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-400 font-sans">
                              <span>{p.categoryAr}</span>
                              <span>•</span>
                              <span className="text-[#A44C5C] font-semibold">{country === 'EG' ? p.priceEG : p.priceSA} {country === 'EG' ? 'EGP' : 'SAR'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <WhatsAppFloat 
        number={settings?.whatsapp || '201110095403'} 
        saudiNumber={settings?.whatsappSaudi || '966596894393'} 
        country={country} 
      />

      <AtelierAudioAtmosphere 
        products={products}
        collections={collections}
        coupons={coupons}
        country={country}
        setTab={setTab}
        onSelectProduct={handleSelectProduct}
        onAddToCart={handleAddToCart}
        session={session}
      />
    </div>
  );
}
