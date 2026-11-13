import { motion, AnimatePresence } from 'motion/react';
import SultaImage from "./components/SultaImage";
import React, { useState, useEffect, Suspense } from 'react';
import { Sparkles, Heart, Star, ShoppingBag, Eye, ArrowRight, ArrowLeft, Mail, Phone, Check, Box, ShieldCheck, Instagram, Home, Package, User, X, Globe, Search, Truck, RefreshCw, Tag } from 'lucide-react';
import { WhatsAppService } from './services/whatsappService';
import { ToastProvider, useToast } from './components/Toast';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import RedirectHandler from './components/RedirectHandler';
import SEO from './components/SEO';
// Core views lazy loaded for maximum performance
const HomeView = React.lazy(() => import('./components/HomeView'));
const ProductPage = React.lazy(() => import('./components/ProductPage'));
const StoreView = React.lazy(() => import('./components/StoreView'));
import WhatsAppFloat from './components/WhatsAppFloat';
import MobileBottomNav from './components/MobileBottomNav';
import RibbonBowDivider from './components/RibbonBowDivider';
import { ProductPrice } from './components/ProductPrice';
import Features from './components/Features';
import PaymentMethodsDisplay from './components/PaymentMethodsDisplay';
// Lazy load non-critical components to reduce initial bundle size and improve performance
const ProductDetailModal = React.lazy(() => import('./components/ProductDetailModal'));
const CartDrawer = React.lazy(() => import('./components/CartDrawer'));
const CheckoutModal = React.lazy(() => import('./components/CheckoutModal'));
const AboutUs = React.lazy(() => import('./components/AboutUs'));
const ContactUs = React.lazy(() => import('./components/ContactUs'));
const AccountView = React.lazy(() => import('./components/AccountView'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const AdminAuthGate = React.lazy(() => import('./components/AdminAuthGate'));
const Faq = React.lazy(() => import('./components/Faq'));
const ReturnsExchanges = React.lazy(() => import('./components/ReturnsExchanges'));
const DatabaseTest = React.lazy(() => import('./components/DatabaseTest'));
const BlogView = React.lazy(() => import('./components/BlogView'));
const BlogPostView = React.lazy(() => import('./components/BlogPostView'));
const TrackOrder = React.lazy(() => import('./components/TrackOrder'));
const SystemStatus = React.lazy(() => import('./components/SystemStatus'));
const SocialLinksView = React.lazy(() => import('./components/SocialLinksView'));
const PremiumLuxuryExperience = React.lazy(() => import('./components/PremiumLuxuryExperience'));
const FabricGuide = React.lazy(() => import('./components/FabricGuide'));

// Luxury Add-on views
const SultaCollections = React.lazy(() => import('./components/SultaCollections'));
const BestSellers = React.lazy(() => import('./components/BestSellers'));
const NewArrivals = React.lazy(() => import('./components/NewArrivals'));
const TrendingNow = React.lazy(() => import('./components/TrendingNow'));
const LuxuryGifts = React.lazy(() => import('./components/LuxuryGifts'));
const LimitedPieces = React.lazy(() => import('./components/LimitedPieces'));
const SleepExperience = React.lazy(() => import('./components/SleepExperience'));
const SultaMagazine = React.lazy(() => import('./components/SultaMagazine'));
const SultaConcierge = React.lazy(() => import('./components/SultaConcierge'));

const RoyalSensesSalon = React.lazy(() => import('./components/RoyalSensesSalon'));
const LiveTrafficMonitor = React.lazy(() => import('./components/LiveTrafficMonitor'));
// LivePurchaseToasts removed to ensure 100% genuine data only
const SearchOverlay = React.lazy(() => import('./components/SearchOverlay'));
const SEOLandingPage = React.lazy(() => import('./components/SEOLandingPage'));

import { dbService, supabase, cleanImgUrl } from './services/db';
import { CanonicalAdminRole } from './utils/rbac';
import { SEED_FALLBACK_PRODUCTS } from './data/fallbackProducts';
import { Product, CartItem, Country, DiscountCoupon, Order, Review, NewsletterSubscription, Collection, BlogPost } from './types';
import { getProductSlug } from './utils/slugify';
import {
  recordView,
  recordCartAddition,
  trackViewContent,
  trackAddToCart,
  trackPurchase,
  trackPageView,
  initPixels,
  initGlobalSync,
  trackAddToWishlist,
  trackSearch,
  trackSubscribe,
  trackLead
} from './utils/analytics';
import {
  ttqIdentify,
  trackTikTokViewContent,
  trackTikTokAddToWishlist,
  trackTikTokSearch,
  trackTikTokAddToCart,
  trackTikTokInitiateCheckout,
  trackTikTokPurchase
} from './utils/tiktokPixel';


export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tab sync for backward compatibility in components
  const currentTab = location.pathname === '/' ? 'home' : location.pathname.substring(1).split('/')[0];
  const setTab = (tab: string) => {
    if (tab === 'home') navigate('/');
    else navigate(`/${tab}`);
  };
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [country, setCountry] = useState<Country>('SA');
  const [autoTrackId, setAutoTrackId] = useState<string | null>(null);

  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  // Verified Admin state (derived strictly from Supabase Auth + AdminAuthGate)
  const [authorizedAdmin, setAuthorizedAdmin] = useState<{
    email: string;
    name: string;
    role: CanonicalAdminRole;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (!session?.user?.email) {
      setAuthorizedAdmin(null);
      setIsAdmin(false);
    }
  }, [session]);

  // High-precision geographic country detector
  useEffect(() => {
    try {
      localStorage.setItem('sulta_user_country_preference', country);
    } catch (e) {}

    if (!isDashboardRoute) {
      supabase.from('page_views').insert([{ page_path: window.location.pathname }]).then();
    }
  }, [country, isDashboardRoute]);

  // Comprehensive SPA Route Tracking (GA4, Meta, TikTok)
  useEffect(() => {
    const pageName = document.title || 'سولته';
    trackPageView(pageName);
    
    // Luxurious smooth scroll to top on every navigation
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

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
      console.error("[Sulta CART] Saving failure:", e);
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

  const [products, setProducts] = useState<Product[]>(SEED_FALLBACK_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [homepageSections, setHomepageSections] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
 
  // Initialize and synchronize tracking pixels (GA4 G-Q3TBBTHEJL, Meta, TikTok)
  useEffect(() => {
    initGlobalSync(); 
    initPixels({
      googleAnalyticsId: 'G-Q3TBBTHEJL',
      facebookPixelId: '1648674350574190',
      tiktokPixelId: 'DBESRBJC77U4J2JQDUB0'
    });
  }, []);

  // Sulta Order Tracking Center Deep-link Routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track') || params.get('id') || params.get('orderId');
    
    if (trackParam) {
      setAutoTrackId(trackParam);
      window.localStorage.setItem('sulta_auto_track_order_id', trackParam);
    }
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
          console.warn("[Sulta DB] Seeding initial data skipped or failed:", e);
        }

        // Initial setup complete safely

        // Auth Session Sync
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        } catch (e) {
          console.error("[Sulta AUTH] Fetching active session failed:", e);
        }
        setAuthLoading(false);

        try {
          const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
          });
          subscription = data.subscription;
        } catch (e) {
          console.error("[Sulta AUTH] Setting auth state changes failed:", e);
        }

        // Fetch settings - ensure this doesn't block the splash
        dbService.getSettings().then(setSettings).catch(err => console.error("Settings error:", err));
        
        unsubProducts = dbService.subscribeProducts(
          (list) => {
            setProducts(list);
            setIsLoadingProducts(false);
            if (list.length > 0) {
              console.log("[Sulta DEBUG] First 3 product images:", list.slice(0, 3).map(p => p.images?.[0]));
            }
          },
          (error) => {
            console.error("Products error:", error);
            setIsLoadingProducts(false);
          }
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

  // Clean up legacy notification keys if present to prevent unwanted alerts
  useEffect(() => {
    try {
      sessionStorage.removeItem('sulta_notified_orders_v2');
      sessionStorage.removeItem('sulta_notified_orders');
    } catch {}
  }, []);

  // UI Theme & Overlay States
  const [isMidnightVelvet, setIsMidnightVelvet] = useState<boolean>(false);

  // Synchronise or merge favorites when user session changes
  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem('sulta_active_user_id', session.user.id);
      
      // TikTok Pixel Advanced Matching identify with client-side SHA-256
      ttqIdentify({
        email: session.user.email || undefined,
        phone: session.user.phone || (session.user.user_metadata as any)?.phone || undefined,
        externalId: session.user.id
      });
      
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
            console.log("[Sulta FAVORITES] Merged guest bookmarks into customer account:", merged);
          }
        } catch (e) {
          console.error("[Sulta FAVORITES] Merging guest bookmarks failed:", e);
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
      console.error("[Sulta FAVORITES] Saving failure:", e);
    }
  }, [favorites, session]);
  
  // UI overlays states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
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
    const matchedProduct = products.find(p => p.id === productId);
    const prodName = matchedProduct ? matchedProduct.nameAr : 'المنتج الفاخر';

    setFavorites(prev => {
      const isFav = prev.includes(productId);
      if (isFav) {
        toast(`تم إزالة "${prodName}" من مفضلتك الملكية 🖤`, "info");
        return prev.filter(id => id !== productId);
      } else {
        toast(`تم إضافة "${prodName}" إلى مفضلتك الملكية ✨💖`, "success");
        if (matchedProduct) {
          trackTikTokAddToWishlist(matchedProduct, 'SAR');
          trackAddToWishlist(matchedProduct, 'SAR');
        }
        return [...prev, productId];
      }
    });

    console.log(`Updated Wishlist item: ${productId}`);
  };

  // Add Item to Shopping Cart Bag
  const handleAddToCart = (product: Product, color: { name: string; hex: string }, size: string, qty: number = 1, customOpts?: any) => {
    recordCartAddition(product.id);
    try {
      trackAddToCart(product, qty, 'SAR');
    } catch {}

    // TikTok Pixel AddToCart event (exact TikTok object structure)
    try {
      trackTikTokAddToCart(product, qty, 'SAR');
    } catch (err) {
      console.warn('[TikTok Pixel] AddToCart error:', err);
    }

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
    try {
      trackAddToCart(product, qty, 'SAR');
    } catch {}

    // TikTok Pixel AddToCart event (exact TikTok object structure)
    try {
      trackTikTokAddToCart(product, qty, 'SAR');
    } catch (err) {
      console.warn('[TikTok Pixel] AddToCart error:', err);
    }

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

    // TikTok Pixel InitiateCheckout event
    try {
      const cartTotal = cart.reduce((sum, item) => {
        const itemPrice = dbService.getProductActualPrice(item.product, country, settings).unitPrice;
        return sum + (itemPrice * item.quantity);
      }, 0);
      trackTikTokInitiateCheckout(cart, cartTotal, 'SAR');
    } catch (err) {
      console.warn('[TikTok Pixel] InitiateCheckout error:', err);
    }
  };

  // Final Checkout booking success
  const handleOrderSuccess = (newOrder: Order) => {
    // Universal Analytics
    try {
      trackPurchase(newOrder);
    } catch {}

    // TikTok Pixel Purchase & PlaceAnOrder events with customer identification
    try {
      trackTikTokPurchase(newOrder, newOrder.currency || 'SAR');
    } catch (err) {
      console.warn('[TikTok Pixel] Purchase track error:', err);
    }

    // Reset shopping state & update local orders state immediately
    setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
    setCart([]);
    setAppliedCoupon(null);
    setIsCheckoutOpen(false);

    // Automatically send invoice to customer WhatsApp
    WhatsAppService.sendInvoice(newOrder, newOrder.phone);

    // Switch view to customer cabinet to track orders instantly
    setTab('account');
    toast(`تهانينا! 🎉 تم حجز طلبك الفاخر بنجاح برقم الاستعلام: ${newOrder.id}. تم إرسال تفاصيل الفاتورة عبر واتساب.`, 'success');
  };

  const handleTrackOrderFromModal = (orderId: string) => {
    setCart([]);
    setAppliedCoupon(null);
    setIsCheckoutOpen(false);
    setAutoTrackId(orderId);
    setTab('track-order');
    toast(`جاري عرض بيانات تتبع طلبيتكِ الملكية 📦`, 'success');
  };

  // Select Product Handler (updates customer history & fires ViewContent)
  const handleSelectProduct = (product: Product) => {
    recordView(product.id);
    try {
      trackViewContent(product, 'SAR');
    } catch {}

    // TikTok Pixel ViewContent event
    try {
      trackTikTokViewContent(product, 'SAR');
    } catch (err) {
      console.warn('[TikTok Pixel] ViewContent error:', err);
    }

    setRecentlyViewed(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return [product, ...prev.filter(p => p.id !== product.id)];
      }
      return [product, ...prev].slice(0, 4); // max 4 items
    });
    
    const slug = getProductSlug(product);
    navigate(`/product/${slug}`);
  };


  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      try {
        localStorage.setItem('sulta_search_history', query);
        const matches = products.filter(p => 
          p.nameAr?.includes(query) || 
          p.nameEn?.toLowerCase().includes(query.toLowerCase()) || 
          p.categoryAr?.includes(query)
        );
        trackTikTokSearch(query, matches, 'SAR');
        trackSearch(query, matches.length);
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
      
      // TikTok Pixel Advanced Matching identify on newsletter subscription
      ttqIdentify({
        email: subscribeEmail,
        phone: subscribePhone || undefined,
        externalId: newSub.id
      });

      // Meta Pixel: Subscribe & Lead events
      try {
        trackSubscribe(subscribeEmail, 0, 'SAR');
        trackLead('اشتراك بالنشرة الملكية', 0, 'SAR');
      } catch {}

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

  // Dynamic live homepage filtering systems
  const filteredProducts = products.filter(p => {
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
  const bestSellers = catalogPool.slice(0, 4);
  const bestSellerIds = new Set(bestSellers.map(p => p.id));
  const remainingProducts = catalogPool.filter(p => !bestSellerIds.has(p.id));
  const newArrivals = remainingProducts.length > 0 ? remainingProducts : catalogPool.slice(2, 6);
  const featuredProducts = catalogPool.slice(0, 6);
  const trendingProducts = catalogPool.slice(0, 6);
  const seasonalCollections = catalogPool.slice(0, 6);
  const offers = catalogPool.filter(p => p.isDiscountActive && (p.salePriceSA || p.discountPercent > 0));

  return (
      <div dir="rtl" className={`min-h-screen bg-[#FAF4F5] font-sans text-gray-900 ${isDashboardRoute ? 'pb-0' : 'pb-20 md:pb-0'} transition-all duration-1000 ${isMidnightVelvet ? 'midnight-velvet-active bg-[#0B0B0B] text-white' : ''}`}>
      
      {/* GLOBAL HEADER BAR (Hidden on dedicated Admin Dashboard workspace) */}
      {!isDashboardRoute && (
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
          isAdmin={isAdmin}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenFavorites={() => {
            setTab('account');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openAccountTab', { detail: 'wishlist' }));
            }, 60);
          }}
          onSearch={(query) => {
            if (!query) {
              setIsSearchOpen(true);
            } else {
              handleSearchQueryChange(query);
              setTab('store');
            }
          }}
        />
      )}

      {/* REDIRECT HANDLER FOR LEGACY ?tab= LINKS */}
      <RedirectHandler />

      {/* CORE DYNAMIC LAYOUT BASED ON ROUTES */}
      <main className={isDashboardRoute ? '' : 'animate-fade-in-rapid overflow-x-hidden'}>
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#A44C5C] rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={
              <HomeView 
                products={products}
                bestSellers={bestSellers}
                newArrivals={newArrivals}
                offers={offers}
                isLoading={isLoadingProducts}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                handleSelectProduct={handleSelectProduct}
                handleAddToCart={handleAddToCart}
                setTab={setTab}
                homepageSections={homepageSections}
                subscribeSuccess={subscribeSuccess}
                subscribeEmail={subscribeEmail}
                setSubscribeEmail={setSubscribeEmail}
                handleSubscribe={handleSubscribe}
                settings={settings}
              />
            } />
            
            <Route path="/store" element={
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
            } />

            <Route path="/best-sellers" element={
                <BestSellers
                  products={products}
                  country={country}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectProduct={handleSelectProduct}
                  onAddToCart={(p, c, s, q) => handleAddToCart(p, c, s, q || 1)}
                />
            } />

            <Route path="/offers" element={
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
            } />

            <Route path="/new-arrivals" element={
                <NewArrivals
                  products={products}
                  country={country}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectProduct={handleSelectProduct}
                  onAddToCart={(p, c, s, q) => handleAddToCart(p, c, s, q || 1)}
                />
            } />

            <Route path="/product/:slug" element={
              <ProductPage 
                onAddToCart={handleAddToCart}
                toggleFavorite={toggleFavorite}
                favorites={favorites}
              />
            } />
            <Route path="/products/:slug" element={
              <ProductPage 
                onAddToCart={handleAddToCart}
                toggleFavorite={toggleFavorite}
                favorites={favorites}
              />
            } />

            <Route path="/about" element={<AboutUs homepageSections={homepageSections} />} />
            <Route path="/contact" element={<ContactUs settings={settings} />} />
            <Route path="/track-order" element={<TrackOrder initialOrderId={autoTrackId} />} />
            <Route path="/account" element={
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
                isAdmin={isAdmin}
              />
            } />
            <Route path="/faq" element={<Faq />} />
            <Route path="/returns" element={<ReturnsExchanges />} />
            <Route path="/magazine" element={
              selectedBlogPost ? (
                <BlogPostView post={selectedBlogPost} onBack={() => setSelectedBlogPost(null)} />
              ) : (
                <SultaMagazine onReadPost={setSelectedBlogPost} />
              )
            } />
            <Route path="/dashboard" element={
              <AdminAuthGate
                session={session}
                authLoading={authLoading}
                onAuthorized={(user) => {
                  setAuthorizedAdmin(user);
                  setIsAdmin(true);
                }}
                onBackToStore={() => setTab('home')}
              >
                <Dashboard
                  session={session}
                  authLoading={authLoading}
                  adminUser={authorizedAdmin}
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
                  onBackToStore={() => setTab('home')}
                  onSignOut={async () => {
                    try {
                      localStorage.removeItem('sulta_admin_auth_user');
                    } catch {}
                    try {
                      await supabase.auth.signOut();
                    } catch {}
                    setAuthorizedAdmin(null);
                    setIsAdmin(false);
                    setTab('home');
                  }}
                />
              </AdminAuthGate>
            } />

            <Route path="/بيجامات-نسائية" element={
              <SEOLandingPage 
                keyword="بيجامات نسائية"
                titleAr="أفضل بيجامات نسائية فاخرة في السعودية | متجر سولته"
                descriptionAr="استكشفي تشكيلتنا الواسعة من البيجامات النسائية الفاخرة. تصاميم عصرية، أقمشة ناعمة، ومقاسات مريحة. شحن مجاني للطلبات فوق 299 ريال."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/بيجامات-نسائية"
              />
            } />

            <Route path="/بيجامات-قطن" element={
              <SEOLandingPage 
                keyword="بيجامات قطن"
                titleAr="بيجامات قطن نسائية ناعمة 100% — راحة وأناقة | سولته"
                descriptionAr="بيجامات قطن نسائية بجودة عالية. خامات طبيعية تسمح للبشرة بالتنفس، تصاميم مريحة للنوم والاسترخاء. اطلبيها الآن من سولتة."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/بيجامات-قطن"
              />
            } />

            <Route path="/ملابس-نوم" element={
              <SEOLandingPage 
                keyword="ملابس نوم"
                titleAr="ملابس نوم نسائية فاخرة — كوليكشن الموسم | متجر سولته"
                descriptionAr="دليلي نفسك بأجمل ملابس نوم نسائية. أناقة ملكية وراحة لا تضاهى. تشكيلة متنوعة من الألوان والتصاميم التي تليق بكِ."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/ملابس-نوم"
              />
            } />

            <Route path="/بيجامات-عروس" element={
              <SEOLandingPage 
                keyword="بيجامات عروس"
                titleAr="بيجامات عروس فاخرة وأطقم ليلة الدخلة في السعودية | سولته"
                descriptionAr="تألقي في ليلة عمركِ وأجمل أوقاتكِ مع تشكيلة بيجامات عروس فاخرة ومصممة بعناية فائقة. أقمشة بيضاء ووردية ناصعة مع تفاصيل كوتور راقية."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/بيجامات-عروس"
              />
            } />

            <Route path="/ملابس-استرخاء" element={
              <SEOLandingPage 
                keyword="ملابس استرخاء"
                titleAr="ملابس استرخاء منزلية فاخرة للنساء — راحة تامة | سولته"
                descriptionAr="تشكيلة ملابس استرخاء منزلية راقية تجمع بين الأناقة والنعومة المطلقة. اختاري ما يعبر عن ذوقكِ الرفيع من صالات سولته."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/ملابس-استرخاء"
              />
            } />

            <Route path="/قمصان-نوم" element={
              <SEOLandingPage 
                keyword="قمصان نوم"
                titleAr="قمصان نوم نسائية ناعمة وفاخرة — تصاميم ملكية | سولته"
                descriptionAr="اكتشفي أجمل قمصان النوم النسائية الطويلة والقصيرة المصنوعة من أجود الأنسجة الناعمة. أناقة لا توصف للياليكِ الخاصة."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/قمصان-نوم"
              />
            } />

            <Route path="/أرواب-استحمام" element={
              <SEOLandingPage 
                keyword="أرواب"
                titleAr="أرواب نسائية فاخرة ومنشفة استرخاء ملكية | سولته"
                descriptionAr="أرواب استحيام واستقبال منزلية مصممة بأعلى معايير النعومة والامتصاص. أناقة متكاملة بعد الاستحمام."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/أرواب-استحمام"
              />
            } />

            <Route path="/تخفيضات-سولته" element={
              <SEOLandingPage 
                keyword="تخفيضات"
                titleAr="تخفيضات وعروض بيجامات وملابس نوم نسائية | سولته"
                descriptionAr="تخفيضات حصرية على تشكيلة واسعة من البيجامات النسائية الفاخرة وملابس النوم. جودة لا تُعوض بأسعار استثنائية."
                products={products}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSelectProduct={handleSelectProduct}
                path="/تخفيضات-سولته"
              />
            } />

            <Route path="/404" element={
              <div className="py-32 flex flex-col items-center justify-center text-center bg-[#FAF9F6] min-h-[60vh] px-4" dir="rtl">
                <SEO title="الصفحة غير موجودة - 404" path="/404" />
                <span className="text-8xl mb-4 font-serif text-[#DF8A9C]/20 opacity-50">404</span>
                <h1 className="text-2xl md:text-3xl font-serif text-[#0B0B0B] mb-4">الغرفة الملكية غير موجودة</h1>
                <p className="text-gray-500 font-sans max-w-md text-xs md:text-sm leading-relaxed mb-8">
                  يبدو أنكِ بحثتِ عن تصنيف أو صفحة لم تعد متوفرة في صالاتنا. القطع الأنيقة دائماً في تجدد مستمر.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-[#A44C5C] text-white px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#DF8A9C] transition-all shadow-sm cursor-pointer"
                >
                  العودة للرئيسية
                </button>
              </div>
            } />
            
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {/* OVERLAY MODAL 1: DYNAMICAL PRODUCT DETAILED VIEW (Fallback for quick view) */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          products={products}
          country={country}
          onClose={() => setSelectedProduct(null)}
          onSelectProduct={(p) => {
            const slug = getProductSlug(p);
            navigate(`/product/${slug}`);
            setSelectedProduct(null);
          }}
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
        settings={settings}
      />

      {/* OVERLAY MODAL 3: BILLING CHECKOUT FUNNEL */}
      {isCheckoutOpen && (
        <CheckoutModal
          country={country}
          cart={cart}
          appliedCoupon={appliedCoupon}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
          onTrackOrder={handleTrackOrderFromModal}
          settings={settings}
        />
      )}
      {/* OVERLAY MODAL 4: INSTANT SEARCH OVERLAY */}
      {isSearchOpen && (
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectProduct={(p) => {
            handleSelectProduct(p);
            setIsSearchOpen(false);
          }}
          products={products}
          country={country}
        />
      )}
      </Suspense>

      {/* GLOBAL SALLA / NALAH STYLE CLEAN WHITE FOOTER (Hidden on Dashboard) */}
      {!isDashboardRoute && (
        <footer className="bg-white text-gray-900 pt-16 pb-8 border-t border-gray-200 select-none font-sans text-xs" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Logo & Brand Story Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setTab('home')}>
              <span className="font-serif text-2xl font-black tracking-widest text-[#111827] uppercase">
                Sulta
              </span>
              <span className="text-[#A44C5C] text-sm">👑</span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold block text-gray-900 font-sans -mt-2">
              سولته · أزياء النوم الفاخرة
            </span>
            <p className="text-gray-900 font-bold text-xs leading-relaxed max-w-xs pt-1">
              علامة سعودية فاخرة رائدة في تصميم وتقديم أرقى خامات البيجامات والملابس المنزلية المترفة للنساء في المملكة العربية السعودية.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://instagram.com/sulta.sa" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#A44C5C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A44C5C] rounded-md p-1" aria-label="سولته على انستغرام">
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a href="https://tiktok.com/@sulta.sa" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#A44C5C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A44C5C] rounded-md p-1" aria-label="سولته على تيك توك">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.36-.54.38-.98-1.03 1.63-.12.53-.08 1.1.1 1.6.43 1.2 1.88 1.91 3.1 1.53.84-.26 1.5-.97 1.74-1.8.13-.41.13-.85.13-1.28.02-4.14.01-8.28.02-12.43z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Deep links */}
          <nav className="space-y-3.5" aria-label="روابط سريعة">
            <h3 className="font-bold text-sm text-gray-950 tracking-wide pb-1 border-b border-gray-100">
              روابط المتجر السريعة
            </h3>
            <div className="flex flex-col gap-2 font-sans items-start text-right text-gray-900">
              <button type="button" onClick={() => setTab('home')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold focus-visible:text-[#A44C5C] focus-visible:outline-none">الرئيسية</button>
              <button type="button" onClick={() => setTab('offers')} className="hover:text-[#A44C5C] font-black text-[#A44C5C] transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none">
                <span>العروض والتخفيضات الحصرية</span>
                <span className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0.2 rounded-full font-bold">خصومات</span>
              </button>
              <button type="button" onClick={() => setTab('store')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold focus-visible:text-[#A44C5C] focus-visible:outline-none">المتجر الشامل</button>
              <button type="button" onClick={() => setTab('best-sellers')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold focus-visible:text-[#A44C5C] focus-visible:outline-none">الأكثر طلباً ومبيعاً</button>
              <button type="button" onClick={() => setTab('new-arrivals')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold focus-visible:text-[#A44C5C] focus-visible:outline-none">وصل حديثاً</button>
              <button type="button" onClick={() => setTab('account')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold focus-visible:text-[#A44C5C] focus-visible:outline-none">حسابي والطلبات</button>
              <button type="button" onClick={() => setTab('dashboard')} className="text-gray-400 hover:text-black font-medium text-[10px] transition-colors cursor-pointer mt-3 focus-visible:text-black focus-visible:outline-none">⚙️ دخول الإدارة</button>
            </div>
          </nav>

          {/* Customer Service & Policies */}
          <div className="space-y-3.5 font-sans">
            <h3 className="font-bold text-sm text-gray-950 tracking-wide pb-1 border-b border-gray-100">
              خدمة العملاء والسياسات
            </h3>
            <div className="flex flex-col gap-2 items-start text-right text-gray-900">
              <button type="button" onClick={() => setTab('faq')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold">الأسئلة الشائعة</button>
              <button type="button" onClick={() => setTab('track-order')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold">تتبع طلبيتكِ</button>
              <button type="button" onClick={() => setTab('returns')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold">سياسة الاسترجاع والاستبدال</button>
              <button type="button" onClick={() => setTab('about')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold">من نحن</button>
              <button type="button" onClick={() => setTab('contact')} className="hover:text-[#A44C5C] transition-colors cursor-pointer font-bold">اتصلي بنا</button>
            </div>
          </div>

          {/* Saudi Commitment & Payment */}
          <div className="space-y-4 font-sans">
            <h3 className="font-bold text-sm text-gray-950 tracking-wide pb-1 border-b border-gray-100">
              العملة والدفع الآمن
            </h3>
            <div className="flex flex-col gap-3 items-start">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-full">
                <span className="text-xl">🇸🇦</span>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-gray-900">الريال السعودي</span>
                  <span className="text-[9px] text-gray-500">العملة الرسمية (SAR)</span>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-gray-400 font-bold block mb-2">طرق الدفع المتوفرة:</span>
                <PaymentMethodsDisplay variant="footer" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-500 font-sans">
          <div className="flex items-center gap-4 flex-wrap">
            <span>جميع الحقوق محفوظة © ٢٠٢٦ متجر Sulta للأزياء الفاخرة</span>
            <Suspense fallback={null}>
              {isAdmin && <LiveTrafficMonitor compact={true} />}
            </Suspense>
          </div>
          <div className="text-gray-400 text-[11px]">
            <span>تسوق سهل وسريع مع توصيل آمن لكافة مناطق المملكة</span>
          </div>
        </div>
      </footer>
      )}

      {/* MOBILE DRAWER MODAL OVERLAY (Simplified and completely bug-free on all mobile viewports) */}
      {!isDashboardRoute && mobileMenuOpen && (
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
                <span className="font-serif text-2xl tracking-widest text-[#0B0B0B] font-light">Sulta</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="إغلاق القائمة"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Cards List */}
              <div className="space-y-1.5 py-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  تصفحي المتجر
                </span>
                
                {[
                  { id: 'home', label: 'الرئيسية' },
                  { id: 'store', label: 'المتجر والكتالوج' },
                  { id: 'best-sellers', label: 'الأكثر طلباً' },
                  { id: 'new-arrivals', label: 'وصل حديثاً' },
                  { id: 'offers', label: 'العروض الخاصة' },
                  { id: 'about', label: 'عن سولته' },
                  { id: 'faq', label: 'الأسئلة الشائعة' },
                  { id: 'returns', label: 'الاستبدال والاسترجاع' },
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
                          ? 'bg-[#A44C5C] text-white font-bold shadow-xs'
                          : 'text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-black border border-transparent'
                      }`}
                    >
                      <span className="font-sans text-[12px]">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </div>

              {/* Extra Account section for quick access */}
              <div className="border-t border-gray-100 pt-3 mt-1 space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">
                  خدمات وتتبع:
                </span>
                
                <button
                  onClick={() => {
                    setTab('track-order');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-right text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'track-order' ? 'bg-[#A44C5C] text-white' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span>تتبع طلبي وشحنتي</span>
                  <span className="text-[10px] text-gray-400 text-left">كود التتبع</span>
                </button>

                <button
                  onClick={() => {
                    setTab('account');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-right text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'account' ? 'bg-[#A44C5C] text-white' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span>حسابكِ وطلباتكِ</span>
                  <span className="text-[10px] text-gray-400 text-left">الملف الشخصي</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-right text-xs font-semibold py-2 px-4 rounded-xl text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center justify-between cursor-pointer"
                  >
                    <span>لوحة إدارة المتجر</span>
                    <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded-md font-mono">Admin</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Country switcher & WhatsApp in Mobile menu list */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
              <a
                href="https://wa.me/966552823677?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Sulta%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D8%B7%D9%84%D8%A8%D8%A7%D8%AA"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#111827] text-white py-2.5 px-3.5 rounded-xl font-sans font-bold text-xs flex items-center justify-between shadow-sm hover:bg-black transition-all border border-gray-700"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">💬</span>
                  <span>واتساب خدمة العملاء (المملكة العربية السعودية 🇸🇦)</span>
                </span>
                <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded-full" dir="ltr">
                  0552823677
                </span>
              </a>

              <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-500">الوجهة والعملة:</span>
                <span className="bg-white border border-gray-250 shadow-2xs text-[10.5px] px-2.5 py-1 rounded-full font-bold text-[#0B0B0B]">
                  🇸🇦 SAR (المملكة العربية السعودية)
                </span>
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

      {/* SALLA MOBILE BOTTOM NAVIGATION BAR (Hidden on Dashboard) */}
      {!isDashboardRoute && (
        <MobileBottomNav
          currentTab={currentTab}
          setTab={setTab}
          cart={cart}
          favorites={favorites}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenFavorites={() => setTab('account')}
        />
      )}

      <Suspense fallback={null}>
        <SearchOverlay 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          products={products}
          country={country}
          onSelectProduct={handleSelectProduct}
        />
      </Suspense>

      {!isDashboardRoute && (
        <WhatsAppFloat 
          number={settings?.whatsappSaudi || settings?.whatsapp || '966552823677'} 
          saudiNumber="966552823677" 
          country={country} 
        />
      )}
      {/* Genuine orders only */}
    </div>
  );
}
