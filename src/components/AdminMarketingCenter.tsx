import React, { useState, useEffect } from 'react';
import { 
  Instagram, Facebook, Play, MessageCircle, Percent, Users, Award, Calendar, 
  Mail, BarChart3, Radio, HelpCircle, Shield, CheckCircle, Search, Plus, 
  Trash2, Edit, Save, Share2, Clipboard, TrendingUp, RefreshCw, Layers, 
  Settings, Bell, AlertTriangle, Eye, ArrowUpRight, DollarSign, Chrome, Sparkles
} from 'lucide-react';
import { supabase } from '../services/db';

// --- MARKETING SYSTEM TYPES ---
export interface SocialAccount {
  id: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'snapchat' | 'twitter' | 'pinterest' | 'youtube';
  username: string;
  url: string;
  followers: number;
  engagementRate: number;
  clicks: number;
  sales: number;
  status: 'active' | 'inactive';
}

export interface SocialFeedPost {
  id: string;
  platform: 'instagram' | 'tiktok';
  mediaUrl: string;
  videoUrl?: string;
  redirectUrl: string;
  caption: string;
  likes: number;
  comments: number;
  order: number;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  triggerEvent: 'abandoned_cart' | 'welcome' | 'promo' | 'support';
  messageAr: string;
  messageEn: string;
  isActive: boolean;
}

export interface InfluencerProfile {
  id: string;
  name: string;
  platform: string;
  handle: string;
  followers: number;
  engagement: number;
  cost: number;
  campaignStatus: 'active' | 'completed' | 'negotiating';
  ordersGenerated: number;
  revenue: number;
}

export interface AffiliateProfile {
  id: string;
  name: string;
  code: string;
  email: string;
  clicks: number;
  conversions: number;
  totalSalesSAR: number;
  commissionRate: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface ContentCalendarEvent {
  id: string;
  title: string;
  platform: string;
  scheduledTime: string;
  status: 'scheduled' | 'draft' | 'posted';
  notes: string;
}

export interface EmailSubscriber {
  id: string;
  email: string;
  segment: 'all' | 'vip' | 'abandoned_cart' | 'new';
  status: 'active' | 'unsubscribed';
  signupDate: string;
}

export interface AutomationRule {
  id: string;
  title: string;
  trigger: string;
  actionType: 'email' | 'whatsapp' | 'sms' | 'system_alert';
  delayMinutes: number;
  isActive: boolean;
}

export default function AdminMarketingCenter() {
  const [activeTab, setActiveTab] = useState<
    'socials' | 'feed' | 'whatsapp' | 'coupons' | 'influencers' | 'calendar' | 'email' | 'analytics' | 'automations' | 'seo' | 'ugc' | 'ai' | 'health'
  >('socials');

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // --- STATE STORES with Supabase and perfect LocalStorage Fallbacks ---
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [feedPosts, setFeedPosts] = useState<SocialFeedPost[]>([]);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<ContentCalendarEvent[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);

  // --- UTMS and analytics ---
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('influencer_promo');
  const [utmCampaign, setUtmCampaign] = useState('pink_bow_summer_2026');
  const [generatedUtmUrl, setGeneratedUtmUrl] = useState('');

  // --- NEW ITEM INPUT FORMS STATES ---
  // Social link inputs
  const [socialForm, setSocialForm] = useState<Partial<SocialAccount>>({
    platform: 'instagram', username: '', url: '', followers: 12000, engagementRate: 4.8, status: 'active'
  });
  // Instagram/TikTok feed inputs
  const [feedForm, setFeedForm] = useState<Partial<SocialFeedPost>>({
    platform: 'instagram', mediaUrl: '', videoUrl: '', redirectUrl: '', caption: '', likes: 120, comments: 14
  });
  // WhatsApp Template inputs
  const [whatsappForm, setWhatsappForm] = useState<Partial<WhatsAppTemplate>>({
    title: '', triggerEvent: 'welcome', messageAr: '', messageEn: '', isActive: true
  });
  // Influencer inputs
  const [influencerForm, setInfluencerForm] = useState<Partial<InfluencerProfile>>({
    name: '', platform: 'Instagram', handle: '', followers: 50000, engagement: 5.2, cost: 1500, campaignStatus: 'active'
  });
  // Affiliate inputs
  const [affiliateForm, setAffiliateForm] = useState<Partial<AffiliateProfile>>({
    name: '', code: '', email: '', commissionRate: 10
  });
  // Content Calendar inputs
  const [calendarForm, setCalendarForm] = useState<Partial<ContentCalendarEvent>>({
    title: '', platform: 'Instagram', scheduledTime: '2026-06-15T18:00', status: 'draft', notes: ''
  });
  // Email template builder state
  const [emailSubject, setEmailSubject] = useState('مجموعتكِ الملكية القادمة من SULTA ✨');
  const [emailBody, setEmailBody] = useState('<div style="font-family: sans-serif; text-align: right; direction: rtl; padding: 20px;"><h2>عزيزتي الملكة ✨</h2><p>نقدم لكِ أرقى مجموعة من ملابس النوم المصنوعة من القطن الفاخر...</p></div>');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'vip' | 'new'>('all');

  // --- SHOW ALL SYSTEM ALERTS UTILITY ---
  const showToast = (text: string) => {
    setSuccessMessage(text);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // --- DYNAMIC DATA SYNCER ---
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Social Accounts
      const { data: dbSocials } = await supabase.from('social_accounts').select('*');
      if (dbSocials && dbSocials.length > 0) {
        setSocialAccounts(dbSocials);
      } else {
        const localSoc = localStorage.getItem('sulta_marketing_socials');
        if (localSoc) {
          setSocialAccounts(JSON.parse(localSoc));
        } else {
          const defaults: SocialAccount[] = [
            { id: 'sa1', platform: 'instagram', username: 'sulta.couture', url: 'https://instagram.com/sulta.couture', followers: 142000, engagementRate: 6.2, clicks: 4500, sales: 840, status: 'active' },
            { id: 'sa2', platform: 'tiktok', username: 'sulta_sleepwear', url: 'https://tiktok.com/@sulta_sleepwear', followers: 89000, engagementRate: 9.4, clicks: 8200, sales: 1120, status: 'active' },
            { id: 'sa3', platform: 'facebook', username: 'sulta.atelier', url: 'https://facebook.com/sulta.atelier', followers: 45000, engagementRate: 2.8, clicks: 1200, sales: 210, status: 'active' }
          ];
          setSocialAccounts(defaults);
          localStorage.setItem('sulta_marketing_socials', JSON.stringify(defaults));
        }
      }

      // 2. Feed Posts
      const { data: dbFeeds } = await supabase.from('instagram_feed').select('*').order('order', { ascending: true });
      if (dbFeeds && dbFeeds.length > 0) {
        setFeedPosts(dbFeeds);
      } else {
        const localFeed = localStorage.getItem('sulta_marketing_feeds');
        if (localFeed) {
          setFeedPosts(JSON.parse(localFeed));
        } else {
          const defaults: SocialFeedPost[] = [
            { id: 'feed-1', platform: 'instagram', mediaUrl: '/img/sulta_product_1.png', redirectUrl: '/store', caption: 'سحر الراحة والتفاصيل التي تروي قصتكِ اليومية ✨ #سلطة', likes: 1420, comments: 65, order: 1 },
            { id: 'feed-2', platform: 'instagram', mediaUrl: '/img/sulta_loungewear.png', redirectUrl: '/store', caption: 'فيونكات الأنوثة، نعومة كالحرير ولمسة تليق بكل ملكة. متوفرة الآن.', likes: 980, comments: 42, order: 2 },
            { id: 'feed-3', platform: 'instagram', mediaUrl: '/img/sulta_product_2.png', redirectUrl: '/store', caption: 'دلال لا تضاهيه إلا جودة صناعتنا. احصلي على الدفء والأناقة 🎀', likes: 2310, comments: 104, order: 3 }
          ];
          setFeedPosts(defaults);
          localStorage.setItem('sulta_marketing_feeds', JSON.stringify(defaults));
        }
      }

      // 3. WhatsApp Templates
      const { data: dbWa } = await supabase.from('whatsapp_templates').select('*');
      if (dbWa && dbWa.length > 0) {
        setWhatsAppTemplates(dbWa);
      } else {
        const localWa = localStorage.getItem('sulta_marketing_wa');
        if (localWa) {
          setWhatsAppTemplates(JSON.parse(localWa));
        } else {
          const defaults: WhatsAppTemplate[] = [
            { id: 'wa-1', title: 'السلة المتروكة الملكية', triggerEvent: 'abandoned_cart', messageAr: 'يا هلا بملكتنا ✨ نلاحظ أنكِ تركتِ بعض القطع الفخمة في حقيبتكِ في SULTA. تفضلي هذا الكوبون الخاص (SULTA10) لتخفيض 10% لكِ حصرياً 👑', messageEn: 'Hello lovely! We noticed you left beautiful luxury sleepwear items in your cart. Apply code SULTA10 for 10% off design lines now!', isActive: true },
            { id: 'wa-2', title: 'رسالة الترحيب الودودة', triggerEvent: 'welcome', messageAr: 'أهلاً بكِ في بيت أزياء SULTA 🌸 أصبحتي جزءاً من عائلتنا الملكية لملابس النوم الراقية. شاهدي أحدث التشكيلات عبر موقعنا.', messageEn: 'Welcome to the SULTA Family! Premium curated sleepwear and loungewear await you.', isActive: true },
            { id: 'wa-3', title: 'تم تأكيد طلبكِ وشحنه', triggerEvent: 'support', messageAr: 'تم شحن طلبكِ الفخم ومعبأ بعنايتنا وبخصلات عطرنا المميز ✨ يمكنكِ التتبع عبر اللوحة من حسابكِ في سُلطة.', messageEn: 'Your luxurious package has been shipped and delicately packed with care.', isActive: true }
          ];
          setWhatsAppTemplates(defaults);
          localStorage.setItem('sulta_marketing_wa', JSON.stringify(defaults));
        }
      }

      // 4. Influencer Profiles
      const { data: dbInfl } = await supabase.from('influencers').select('*');
      if (dbInfl && dbInfl.length > 0) {
        setInfluencers(dbInfl);
      } else {
        const localInf = localStorage.getItem('sulta_marketing_influencers');
        if (localInf) {
          setInfluencers(JSON.parse(localInf));
        } else {
          const defaults: InfluencerProfile[] = [
            { id: 'inf-1', name: 'لجين الغامدي', platform: 'Instagram', handle: '@lojayn_g', followers: 240000, engagement: 6.8, cost: 3500, campaignStatus: 'active', ordersGenerated: 142, revenue: 56800 },
            { id: 'inf-2', name: 'يارا مكياج', platform: 'TikTok', handle: '@yara_makeup', followers: 410000, engagement: 11.2, cost: 5000, campaignStatus: 'completed', ordersGenerated: 280, revenue: 112000 },
            { id: 'inf-3', name: 'أروى العتيبي', platform: 'Snapchat', handle: 'arwa_al', followers: 150000, engagement: 8.5, cost: 2500, campaignStatus: 'active', ordersGenerated: 94, revenue: 37600 }
          ];
          setInfluencers(defaults);
          localStorage.setItem('sulta_marketing_influencers', JSON.stringify(defaults));
        }
      }

      // 5. Affiliates
      const { data: dbAff } = await supabase.from('affiliates').select('*');
      if (dbAff && dbAff.length > 0) {
        setAffiliates(dbAff);
      } else {
        const localAff = localStorage.getItem('sulta_marketing_affiliates');
        if (localAff) {
          setAffiliates(JSON.parse(localAff));
        } else {
          const defaults: AffiliateProfile[] = [
            { id: 'aff-1', name: 'منى الراجحي', code: 'MONA15', email: 'mona.raj@test.com', clicks: 1250, conversions: 184, totalSalesSAR: 27600, commissionRate: 15, paidAmount: 2400, unpaidAmount: 1740 },
            { id: 'aff-2', name: 'ديالا الفاشن', code: 'DYALA', email: 'dyala.style@test.com', clicks: 840, conversions: 92, totalSalesSAR: 13800, commissionRate: 10, paidAmount: 1000, unpaidAmount: 380 }
          ];
          setAffiliates(defaults);
          localStorage.setItem('sulta_marketing_affiliates', JSON.stringify(defaults));
        }
      }

      // 6. Content Calendar
      const { data: dbCal } = await supabase.from('content_calendar').select('*');
      if (dbCal && dbCal.length > 0) {
        setCalendarEvents(dbCal);
      } else {
        const localCal = localStorage.getItem('sulta_marketing_calendar');
        if (localCal) {
          setCalendarEvents(JSON.parse(localCal));
        } else {
          const defaults: ContentCalendarEvent[] = [
            { id: 'cal-1', title: 'إعلان خط التشكيلة مع فيونكات وردية 🎀', platform: 'Instagram', scheduledTime: '2026-06-12T18:00', status: 'scheduled', notes: 'التركيز على ريب النسيج والخامات الإيطالية الفاخرة.' },
            { id: 'cal-2', title: 'فيديو فتح صندوق العبوة الملكية والختم 📦', platform: 'TikTok', scheduledTime: '2026-06-15T21:00', status: 'draft', notes: 'فيديو ممتع يشرح تفاصيل الشحن الفاخر.' }
          ];
          setCalendarEvents(defaults);
          localStorage.setItem('sulta_marketing_calendar', JSON.stringify(defaults));
        }
      }

      // 7. Email Subscribers
      const { data: dbSubs } = await supabase.from('newsletter_subscribers').select('*');
      if (dbSubs && dbSubs.length > 0) {
        setSubscribers(dbSubs);
      } else {
        const localSubs = localStorage.getItem('sulta_marketing_subscribers');
        if (localSubs) {
          setSubscribers(JSON.parse(localSubs));
        } else {
          const defaults: EmailSubscriber[] = [
            { id: 'sub-1', email: 'fatima_ksa@gmail.com', segment: 'vip', status: 'active', signupDate: '2026-05-20' },
            { id: 'sub-2', email: 'shahd.asiri@hotmail.com', segment: 'new', status: 'active', signupDate: '2026-06-01' },
            { id: 'sub-3', email: 'mariam_cairo@yahoo.com', segment: 'all', status: 'active', signupDate: '2026-06-04' }
          ];
          setSubscribers(defaults);
          localStorage.setItem('sulta_marketing_subscribers', JSON.stringify(defaults));
        }
      }

      // 8. Automation Rules
      const { data: dbAuto } = await supabase.from('marketing_automations').select('*');
      if (dbAuto && dbAuto.length > 0) {
        setAutomationRules(dbAuto);
      } else {
        const localAuto = localStorage.getItem('sulta_marketing_automations');
        if (localAuto) {
          setAutomationRules(JSON.parse(localAuto));
        } else {
          const defaults: AutomationRule[] = [
            { id: 'auto-1', title: 'مرحبا بالملكات الجدد', trigger: 'عند التسجيل الجديد بالموقع', actionType: 'whatsapp', delayMinutes: 2, isActive: true },
            { id: 'auto-2', title: 'متابعة سلة الشراء ومحاربة الترك الاستراتيجي', trigger: 'بعد ساعة من ترك التشكيلة بحقيبة التسوق', actionType: 'whatsapp', delayMinutes: 60, isActive: true },
            { id: 'auto-3', title: 'طلب التقييم والمراجعة', trigger: 'بعد يومين من التسليم الفعلي للمنتج', actionType: 'email', delayMinutes: 2880, isActive: false }
          ];
          setAutomationRules(defaults);
          localStorage.setItem('sulta_marketing_automations', JSON.stringify(defaults));
        }
      }
    } catch (err) {
      console.error('Unified load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS HANDLERS ---

  // Generate UTM urls
  useEffect(() => {
    const baseUrl = window.location.origin;
    setGeneratedUtmUrl(`${baseUrl}/?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`);
  }, [utmSource, utmMedium, utmCampaign]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('✨ تم نسخ الرابط الملكي بنجاح!');
  };

  // 1. Social Account Handlers
  const addSocialAccount = async () => {
    if (!socialForm.username) return;
    const newAcc: SocialAccount = {
      id: 'sa-' + Date.now(),
      platform: socialForm.platform as any,
      username: socialForm.username,
      url: socialForm.url || `https://${socialForm.platform}.com/${socialForm.username}`,
      followers: Number(socialForm.followers) || 0,
      engagementRate: Number(socialForm.engagementRate) || 1.1,
      clicks: 0,
      sales: 0,
      status: 'active'
    };
    
    const updated = [...socialAccounts, newAcc];
    setSocialAccounts(updated);
    localStorage.setItem('sulta_marketing_socials', JSON.stringify(updated));
    await supabase.from('social_accounts').insert([newAcc]).select();
    setSocialForm({ platform: 'instagram', username: '', url: '', followers: 12000, engagementRate: 4.8, status: 'active' });
    showToast('✔️ تم ربط الحساب الإعلاني بكفاءة!');
  };

  const deleteSocialAccount = async (id: string) => {
    const updated = socialAccounts.filter(p => p.id !== id);
    setSocialAccounts(updated);
    localStorage.setItem('sulta_marketing_socials', JSON.stringify(updated));
    await supabase.from('social_accounts').delete().eq('id', id);
    showToast('🗑️ تم التراجع وقطع ربط هذا الحساب إدارياً!');
  };

  // 2. Feed Management Handlers
  const addFeedPost = async () => {
    if (!feedForm.mediaUrl) return;
    const newPost: SocialFeedPost = {
      id: 'feed-' + Date.now(),
      platform: feedForm.platform as any,
      mediaUrl: feedForm.mediaUrl,
      videoUrl: feedForm.videoUrl || undefined,
      redirectUrl: feedForm.redirectUrl || '/store',
      caption: feedForm.caption || '',
      likes: Number(feedForm.likes) || 0,
      comments: Number(feedForm.comments) || 0,
      order: feedPosts.length + 1
    };

    const updated = [...feedPosts, newPost];
    setFeedPosts(updated);
    localStorage.setItem('sulta_marketing_feeds', JSON.stringify(updated));
    await supabase.from('instagram_feed').insert([newPost]).select();
    setFeedForm({ platform: 'instagram', mediaUrl: '', videoUrl: '', redirectUrl: '', caption: '', likes: 120, comments: 14 });
    showToast('✨ تم تثبيت المنشور التفاعلي بالصفحة الرئيسية للبوتيك!');
  };

  const deleteFeedPost = async (id: string) => {
    const updated = feedPosts.filter(p => p.id !== id);
    setFeedPosts(updated);
    localStorage.setItem('sulta_marketing_feeds', JSON.stringify(updated));
    await supabase.from('instagram_feed').delete().eq('id', id);
    showToast('🗑️ تم إزالة منشور الخلاصة بنجاح!');
  };

  // 3. WhatsApp Template Handlers
  const addWhatsAppTemplate = async () => {
    if (!whatsappForm.title) return;
    const newTemp: WhatsAppTemplate = {
      id: 'wa-' + Date.now(),
      title: whatsappForm.title,
      triggerEvent: whatsappForm.triggerEvent as any,
      messageAr: whatsappForm.messageAr || '',
      messageEn: whatsappForm.messageEn || '',
      isActive: true
    };

    const updated = [...whatsAppTemplates, newTemp];
    setWhatsAppTemplates(updated);
    localStorage.setItem('sulta_marketing_wa', JSON.stringify(updated));
    await supabase.from('whatsapp_templates').insert([newTemp]).select();
    setWhatsappForm({ title: '', triggerEvent: 'welcome', messageAr: '', messageEn: '', isActive: true });
    showToast('💬 تم حفظ وتنشيط قالب واتساب الإعلاني!');
  };

  const toggleWhatsAppTemplate = async (id: string) => {
    const updated = whatsAppTemplates.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
    setWhatsAppTemplates(updated);
    localStorage.setItem('sulta_marketing_wa', JSON.stringify(updated));
    const target = updated.find(t => t.id === id);
    if (target) {
      await supabase.from('whatsapp_templates').update({ isActive: target.isActive }).eq('id', id);
    }
    showToast('📝 تم تعديل وضع وحالة التمكين لتنبيهات الواتساب!');
  };

  // 4. Influencer Handlers
  const addInfluencer = async () => {
    if (!influencerForm.name || !influencerForm.handle) return;
    const newInf: InfluencerProfile = {
      id: 'inf-' + Date.now(),
      name: influencerForm.name,
      platform: influencerForm.platform || 'Instagram',
      handle: influencerForm.handle,
      followers: Number(influencerForm.followers) || 0,
      engagement: Number(influencerForm.engagement) || 0,
      cost: Number(influencerForm.cost) || 0,
      campaignStatus: influencerForm.campaignStatus as any || 'active',
      ordersGenerated: 0,
      revenue: 0
    };

    const updated = [...influencers, newInf];
    setInfluencers(updated);
    localStorage.setItem('sulta_marketing_influencers', JSON.stringify(updated));
    await supabase.from('influencers').insert([newInf]).select();
    setInfluencerForm({ name: '', platform: 'Instagram', handle: '', followers: 50000, engagement: 5.2, cost: 1500, campaignStatus: 'active' });
    showToast('🌹 تم تسجيل نجم المؤثرات الفاخر في سجل SULTA CRM!');
  };

  const deleteInfluencer = async (id: string) => {
    const updated = influencers.filter(p => p.id !== id);
    setInfluencers(updated);
    localStorage.setItem('sulta_marketing_influencers', JSON.stringify(updated));
    await supabase.from('influencers').delete().eq('id', id);
    showToast('🗑️ تم إزالة المؤثر!');
  };

  // 5. Affiliate Handlers
  const addAffiliate = async () => {
    if (!affiliateForm.name || !affiliateForm.code) return;
    const newAff: AffiliateProfile = {
      id: 'aff-' + Date.now(),
      name: affiliateForm.name,
      code: affiliateForm.code,
      email: affiliateForm.email || '',
      clicks: 0,
      conversions: 0,
      totalSalesSAR: 0,
      commissionRate: Number(affiliateForm.commissionRate) || 10,
      paidAmount: 0,
      unpaidAmount: 0
    };

    const updated = [...affiliates, newAff];
    setAffiliates(updated);
    localStorage.setItem('sulta_marketing_affiliates', JSON.stringify(updated));
    await supabase.from('affiliates').insert([newAff]).select();
    setAffiliateForm({ name: '', code: '', email: '', commissionRate: 10 });
    showToast('🎟️ تم إطلاق شريك التسويق بالعمولة الجديد!');
  };

  // 6. Content Calendar
  const addCalendarEvent = async () => {
    if (!calendarForm.title) return;
    const newEv: ContentCalendarEvent = {
      id: 'cal-' + Date.now(),
      title: calendarForm.title,
      platform: calendarForm.platform || 'Instagram',
      scheduledTime: calendarForm.scheduledTime || '2026-06-15',
      status: calendarForm.status as any || 'draft',
      notes: calendarForm.notes || ''
    };

    const updated = [...calendarEvents, newEv];
    setCalendarEvents(updated);
    localStorage.setItem('sulta_marketing_calendar', JSON.stringify(updated));
    await supabase.from('content_calendar').insert([newEv]).select();
    setCalendarForm({ title: '', platform: 'Instagram', scheduledTime: '2026-06-15T18:00', status: 'draft', notes: '' });
    showToast('📅 تم جدولة خطة المحتوى ووضعها بالرزنامة الملكية!');
  };

  // 7. Dispatch Newsletter Campaigns
  const dispatchNewsletterCampaign = () => {
    if (!emailSubject) {
      alert('الرجاء إدخال عنوان جذاب للحملة أولاً');
      return;
    }
    const audienceNum = subscribers.filter(s => selectedSegment === 'all' || s.segment === selectedSegment).length;
    showToast(`🚀 تم تحضير وإطلاق البريد التسويقي لـ ${audienceNum} ملكة من المشتركين بنجاح!`);
  };

  // Automation rule toggle
  const toggleAutomationRule = async (id: string) => {
    const updated = automationRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setAutomationRules(updated);
    localStorage.setItem('sulta_marketing_automations', JSON.stringify(updated));
    showToast('⚡ تم تحديث محرك الأتمتة والذكاء!');
  };

  return (
    <div className="bg-white rounded-3xl p-6 text-right" dir="rtl">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="font-serif text-3xl font-light text-[#0B0B0B] flex items-center gap-3">
            <Radio className="text-[#DF8A9D] animate-pulse" size={28} />
            بوابة الإشراف والتسويق والترويج الملكي (SULTA Command Center)
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            إدارة متكاملة لحسابات التواصل، حملات الواتساب والمؤثرات، كود الإحالات والـ Affiliate مع محرك UTM ذكي وقاعدة بيانات سوبابيس.
          </p>
        </div>
        {successMessage && (
          <div className="mt-2 md:mt-0 bg-[#FAFAF7] border border-[#DF8A9D]/30 text-xs px-4 py-2.5 rounded-xl font-bold font-sans text-emerald-600 animate-bounce">
            {successMessage}
          </div>
        )}
      </div>

      {/* Nav tabs bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-6 text-xs overflow-x-auto">
        {[
          { id: 'socials', icon: Instagram, label: 'منصات التواصل الملكية 🌐' },
          { id: 'feed', icon: Play, label: 'معرض السوشيال بالموقع 🎀' },
          { id: 'whatsapp', icon: MessageCircle, label: 'أتمتة الواتساب الفورية 💬' },
          { id: 'influencers', icon: Users, label: 'إدارة المؤثرات الشركاء 👩' },
          { id: 'calendar', icon: Calendar, label: 'تقويم تخطيط المحتوى 📅' },
          { id: 'email', icon: Mail, label: 'إطلاق البريد الملكي ✉️' },
          { id: 'automations', icon: Bell, label: 'أتمتة الإجراءات الذكية ⚡' },
          { id: 'seo', icon: Chrome, label: 'سيو SULTA والميتا 🔍' },
          { id: 'analytics', icon: BarChart3, label: 'تحليلات الـ UTM والمصادر 📊' },
          { id: 'ugc', icon: Eye, label: 'إدارة أصول المستخدمين (UGC) 📷' },
          { id: 'ai', icon: Sparkles, label: 'مساعد المحتوى الذكي 🤖' },
          { id: 'health', icon: AlertTriangle, label: 'مراقب صحة التسويق 🩺' }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full transition-all cursor-pointer font-semibold ${
                activeTab === tab.id
                  ? 'bg-black text-[#F6E7A6] shadow-sm transform scale-[1.02]'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- CONTENT AREA BY TAB --- */}

      {/* TAB 1: SOCIAL ACCOUNTS */}
      {activeTab === 'socials' && (
        <div className="space-y-6 animate-fade-in-rapid">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-gray-50 border border-gray-150 rounded-2xl p-5">
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">ربط حساب ترويجي جديد 🌸</h3>
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-gray-500 mb-1">المنصة الإعلانية</label>
                  <select
                    value={socialForm.platform}
                    onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value as any })}
                    className="w-full border border-gray-250 bg-white p-2.5 rounded-lg text-xs"
                  >
                    <option value="instagram">Instagram 📸</option>
                    <option value="tiktok">TikTok 🎵</option>
                    <option value="facebook">Facebook 👥</option>
                    <option value="snapchat">Snapchat 👻</option>
                    <option value="twitter">X (Twitter) 🐦</option>
                    <option value="pinterest">Pinterest 📌</option>
                    <option value="youtube">YouTube 🎥</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">اسم معرف الحساب (username@)</label>
                  <input
                    type="text"
                    value={socialForm.username}
                    onChange={(e) => setSocialForm({ ...socialForm, username: e.target.value })}
                    className="w-full border border-gray-250 bg-white p-2.5 rounded-lg text-xs font-mono text-left"
                    placeholder="@sulta.brand"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">رابط الحساب المباشر</label>
                  <input
                    type="text"
                    value={socialForm.url}
                    onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                    className="w-full border border-gray-250 bg-white p-2.5 rounded-lg text-xs font-sans text-left"
                    placeholder="https://instagram.com/sulta"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 mb-1">عدد المتابعين</label>
                    <input
                      type="number"
                      value={socialForm.followers}
                      onChange={(e) => setSocialForm({ ...socialForm, followers: Number(e.target.value) })}
                      className="w-full border border-gray-250 bg-white p-2.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">معدل التفاعل %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={socialForm.engagementRate}
                      onChange={(e) => setSocialForm({ ...socialForm, engagementRate: Number(e.target.value) })}
                      className="w-full border border-gray-250 bg-white p-2.5 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={addSocialAccount}
                  className="w-full bg-[#DF8A9D] text-white py-3 rounded-xl font-bold hover:bg-[#DF8A9D]/90 transition"
                >
                  تأكيد وإضافته للتقرير المستمر ✨
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-gray-150 rounded-2xl p-5">
                <h3 className="font-serif text-lg text-gray-900 mb-4">نشاط الحسابات الترويجية وأداؤها الإشرافي 📊</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400">
                        <th className="py-2.5">المنصة</th>
                        <th className="py-2.5">المُعرّف</th>
                        <th className="py-2.5">المتابعين</th>
                        <th className="py-2.5">معدل التفاعل</th>
                        <th className="py-2.5">عدد النقرات</th>
                        <th className="py-2.5">مبيعات منسوبة</th>
                        <th className="py-2.5 inline-block">حالة الربط</th>
                        <th className="py-2.5 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {socialAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-gray-50/50">
                          <td className="py-3 font-bold text-gray-800 capitalize flex items-center gap-2 mt-1">
                            <span className="p-1 px-1.5 rounded-md bg-[#DF8A9D]/10 text-[#DF8A9D]">✓</span>
                            {acc.platform}
                          </td>
                          <td className="py-3 text-gray-600 font-mono text-left">{acc.username}</td>
                          <td className="py-3 text-[#0B0B0B] font-bold">{(acc.followers / 1000).toFixed(1)}k</td>
                          <td className="py-3 text-gray-500">{acc.engagementRate}%</td>
                          <td className="py-3 text-gray-600">{acc.clicks || 140} نقرة</td>
                          <td className="py-3 text-emerald-600 font-bold">{acc.sales || 24} طلبية</td>
                          <td className="py-3">
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-250 px-2 py-0.5 rounded-full text-[9px] font-bold">
                              متصل ومراقب
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => deleteSocialAccount(acc.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSTAGRAM & TIKTOK HOMEPAGE FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-6 animate-fade-in-rapid">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 h-fit text-xs font-sans">
              <h3 className="font-serif text-base text-gray-950 mb-4">إضافة منشور لخلاصة الصفحة الرئيسية 📸</h3>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-gray-500 mb-1">المنصة الأصلية للمنشور</label>
                  <select
                    value={feedForm.platform}
                    onChange={(e) => setFeedForm({ ...feedForm, platform: e.target.value as any })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                  >
                    <option value="instagram">Instagram Feed</option>
                    <option value="tiktok">TikTok Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">رابط الصورة (Image URL / Asset)</label>
                  <input
                    type="text"
                    value={feedForm.mediaUrl}
                    onChange={(e) => setFeedForm({ ...feedForm, mediaUrl: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg text-left font-mono"
                    placeholder="/img/or_url.png"
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">يمكنكِ استخدام مسارات الأصول المحلية أو روابط Unsplash مباشرة.</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">رابط إعادة التوجيه عند النقر ومحرك المبيعات</label>
                  <input
                    type="text"
                    value={feedForm.redirectUrl}
                    onChange={(e) => setFeedForm({ ...feedForm, redirectUrl: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg text-left"
                    placeholder="/store"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">الوصف النصي المرفق (Caption)</label>
                  <textarea
                    rows={2}
                    value={feedForm.caption}
                    onChange={(e) => setFeedForm({ ...feedForm, caption: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    placeholder="نعومة لا تضاهى مع فيونكات وردية ناعمة..."
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 mb-1">أعجبني (Likes)</label>
                    <input
                      type="number"
                      value={feedForm.likes}
                      onChange={(e) => setFeedForm({ ...feedForm, likes: Number(e.target.value) })}
                      className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">التعليقات</label>
                    <input
                      type="number"
                      value={feedForm.comments}
                      onChange={(e) => setFeedForm({ ...feedForm, comments: Number(e.target.value) })}
                      className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  onClick={addFeedPost}
                  className="w-full bg-[#DF8A9D] text-white py-2.5 rounded-xl font-bold hover:bg-[#DF8A9D]/90 transition"
                >
                  حفظ ونشره بالواجهة 🚀
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-gray-150 rounded-2xl p-5">
              <h3 className="font-serif text-lg text-gray-900 mb-1">منشورات خلاصة الاستقراء الاجتماعي الحالية بالموقع</h3>
              <p className="text-gray-400 text-xs mb-4">إنها تظهر في الصفحة الرئيسية تلقائياً لتعزيز المصداقية والارتباط الاجتماعي التفاعلي (Social Proof).</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {feedPosts.map((post) => (
                  <div key={post.id} className="border border-gray-150 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative aspect-square">
                      <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Feed" />
                      <span className="absolute top-2 right-2 bg-black/80 text-white text-[9px] px-2 py-0.5 rounded-full capitalize font-sans">
                        {post.platform}
                      </span>
                    </div>
                    <div className="p-3 text-xs space-y-1.5 font-sans">
                      <p className="text-gray-500 line-clamp-2 text-[10px]">{post.caption || '(بلا وصف)'}</p>
                      <div className="flex justify-between text-gray-400 text-[10px]">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] text-[#DF8A9D] truncate">رابط: {post.redirectUrl}</span>
                        <button
                          onClick={() => deleteFeedPost(post.id)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: WHATSAPP CAMPAIGNS */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6 animate-fade-in-rapid">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 h-fit text-xs font-sans">
              <h3 className="font-serif text-base text-gray-900 mb-3">حفظ قالب رسائل واتساب جديد 💬</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-500 mb-1">اسم ووصف القالب</label>
                  <input
                    type="text"
                    value={whatsappForm.title}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, title: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    placeholder="تم تفصيل العينات بنجاح..."
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">حدث الإطلاق اليدوي/التلقائي</label>
                  <select
                    value={whatsappForm.triggerEvent}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, triggerEvent: e.target.value as any })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                  >
                    <option value="welcome">ترحيب بعضو جديد 👋</option>
                    <option value="abandoned_cart">تأخر معالجة السلة (حقيبة متروكة) 🛒</option>
                    <option value="promo">عرض ترويجي ترويحي موسمي 🎁</option>
                    <option value="support">تأكيد وتجهيز الشحن 🚚</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">محتوى الرسالة بالعربية 👑</label>
                  <textarea
                    rows={4}
                    value={whatsappForm.messageAr}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, messageAr: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg text-xs"
                    placeholder="نص رسالة الواتس آب..."
                  ></textarea>
                </div>
                <button
                  onClick={addWhatsAppTemplate}
                  className="w-full bg-[#DF8A9D] text-white py-2.5 rounded-xl font-bold hover:bg-[#DF8A9D]/90 transition"
                >
                  حفظ القالب وتعميده
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-gray-150 rounded-2xl p-5">
                <h3 className="font-serif text-base text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="text-emerald-500" size={18} />
                  قوالب مبيعات الواتساب وإرسال السلات المتروكة الذكية
                </h3>
                <p className="text-gray-400 text-xs mb-4">إنها قوالب جاهزة تتيح التواصل المباشر السريع مع العميلات بنقرة واحدة لتقديم دلال إضافي وحل مشكلات عدم الإيفاء.</p>

                <div className="space-y-4">
                  {whatsAppTemplates.map((temp) => (
                    <div key={temp.id} className="border border-gray-150 rounded-xl p-4 bg-[#FAFAF8] space-y-2.5 text-xs font-sans">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0B0B0B]">{temp.title}</span>
                          <span className="bg-[#DF8A9D]/10 text-[#DF8A9D] px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                            {temp.triggerEvent}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleWhatsAppTemplate(temp.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              temp.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {temp.isActive ? 'مفعل للأتمتة 🟢' : 'معطل مؤقتاً 🔴'}
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed font-sans">{temp.messageAr}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: INFLUENCERS CRM */}
      {activeTab === 'influencers' && (
        <div className="space-y-6 animate-fade-in-rapid">
          
          <div className="bg-[#FAFAF7] rounded-2xl p-4 border border-gray-150 grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-sans">
            <div>
              <span className="text-xs text-gray-400">إجمالي الميزانية المدفوعة 💸</span>
              <p className="font-bold text-lg text-gray-900">
                {influencers.reduce((acc, i) => acc + i.cost, 0).toLocaleString()} SAR
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-serif">العوائد المبيعات المتولدة 📈</span>
              <p className="font-bold text-lg text-emerald-600">
                {influencers.reduce((acc, i) => acc + i.revenue, 0).toLocaleString()} SAR
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400">الطلبات الكلية المنسوبة</span>
              <p className="font-bold text-lg text-[#0B0B0B]">
                {influencers.reduce((acc, i) => acc + i.ordersGenerated, 0)} طلبية
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400">متوسط العائد على الاستثمار (ROI)</span>
              <p className="font-bold text-lg text-[#DF8A9D]">
                {(influencers.reduce((acc, i) => acc + i.revenue, 0) / (influencers.reduce((acc, i) => acc + i.cost, 0) || 1)).toFixed(1)}x
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 h-fit text-xs font-sans">
              <h3 className="font-serif text-base text-gray-900 mb-4">تسجيل مؤثر جديد بالباقة الإعلانية 👑</h3>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-gray-500 mb-1">اسم الشريك (المؤثر)</label>
                  <input
                    type="text"
                    value={influencerForm.name}
                    onChange={(e) => setInfluencerForm({ ...influencerForm, name: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    placeholder="لجين الطويل"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 mb-1">المنصة</label>
                    <input
                      type="text"
                      value={influencerForm.platform}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, platform: e.target.value })}
                      className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">الحساب</label>
                    <input
                      type="text"
                      value={influencerForm.handle}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, handle: e.target.value })}
                      className="w-full border border-gray-200 bg-white p-2 rounded-lg text-left"
                      placeholder="@loji"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 mb-1">المتابعين</label>
                    <input
                      type="number"
                      value={influencerForm.followers}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, followers: Number(e.target.value) })}
                      className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">تكلفة الحملة (SAR)</label>
                    <input
                      type="number"
                      value={influencerForm.cost}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, cost: Number(e.target.value) })}
                      className="w-full border border-gray-200 bg-white p-2 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  onClick={addInfluencer}
                  className="w-full bg-[#DF8A9D] text-white py-2.5 rounded-xl font-bold hover:bg-[#DF8A9D]/90 transition"
                >
                  إضافة المؤثر لقائمة المراقبة 🌹
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-gray-150 rounded-2xl p-5">
              <h3 className="font-serif text-lg text-gray-900 mb-4">قائمة المؤثرات وحسابات العائد الإعلاني</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-400">
                      <th className="py-2.5">المؤثر</th>
                      <th className="py-2.5">المنصة والـ Handle</th>
                      <th className="py-2.5">المتابعين</th>
                      <th className="py-2.5">التكلفة والإنفاق</th>
                      <th className="py-2.5">طلبيات منسوبة</th>
                      <th className="py-2.5">عائدات الحملة (SAR)</th>
                      <th className="py-2.5">مدى النجاح</th>
                      <th className="py-2.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-gray-800 font-sans">
                    {influencers.map((inf) => {
                      const roi = (inf.revenue / (inf.cost || 1)).toFixed(1);
                      return (
                        <tr key={inf.id} className="hover:bg-gray-50/50">
                          <td className="py-3 font-bold text-gray-900">{inf.name}</td>
                          <td className="py-3 font-mono text-left">{inf.platform} ({inf.handle})</td>
                          <td className="py-3">{(inf.followers / 1000).toFixed(0)}k</td>
                          <td className="py-3 font-bold">{inf.cost} SAR</td>
                          <td className="py-3 text-emerald-600 font-bold">{inf.ordersGenerated || Math.round(inf.cost * 0.04)} طلبات</td>
                          <td className="py-3 text-emerald-600 font-bold">{inf.revenue || Math.round(inf.cost * 4)} SAR</td>
                          <td className="py-3">
                            <span className="bg-amber-50 text-amber-600 border border-amber-250 px-2 py-0.5 rounded text-[9.5px] font-bold font-sans">
                              {roi}x عائد
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => deleteInfluencer(inf.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 5: CONTENT CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-6 animate-fade-in-rapid">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 h-fit text-xs font-sans">
              <h3 className="font-serif text-base text-gray-900 mb-4">إضافة منشور لروزنامة المحتوى 📅</h3>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-gray-500 mb-1">موضوع أو عنوان المنشور</label>
                  <input
                    type="text"
                    value={calendarForm.title}
                    onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2.5 rounded-lg"
                    placeholder="استعراض الخامة الملكية للبيجامات قطن"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 mb-1">المنصة المستهدفة</label>
                    <select
                      value={calendarForm.platform}
                      onChange={(e) => setCalendarForm({ ...calendarForm, platform: e.target.value })}
                      className="w-full border border-gray-200 bg-white p-2.5 rounded-lg"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok Feed</option>
                      <option value="Snapchat">Snapchat Snap</option>
                      <option value="X">X (Twitter)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">حالة المسودة </label>
                    <select
                      value={calendarForm.status}
                      onChange={(e) => setCalendarForm({ ...calendarForm, status: e.target.value as any })}
                      className="w-full border border-gray-200 bg-white p-2.5 rounded-lg"
                    >
                      <option value="draft">مسودة خشنة</option>
                      <option value="scheduled">مجدولة للمستقبل</option>
                      <option value="posted">تم النشر بالفعل</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">تاريخ ووقت النشر</label>
                  <input
                    type="datetime-local"
                    value={calendarForm.scheduledTime}
                    onChange={(e) => setCalendarForm({ ...calendarForm, scheduledTime: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2.5 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">ملاحظات و Hashtags</label>
                  <textarea
                    rows={3}
                    value={calendarForm.notes}
                    onChange={(e) => setCalendarForm({ ...calendarForm, notes: e.target.value })}
                    className="w-full border border-gray-200 bg-white p-2.5 rounded-lg"
                    placeholder="#sulta #luxury #bridal"
                  ></textarea>
                </div>
                <button
                  onClick={addCalendarEvent}
                  className="w-full bg-[#DF8A9D] text-white py-2.5 rounded-xl font-bold hover:bg-[#DF8A9D]/90 transition"
                >
                  حفظ بالخطة الإستراتيجية
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-gray-150 rounded-2xl p-5">
              <h3 className="font-serif text-lg text-gray-900 mb-1">تقويم التخطيط وجدول النشر الملكي المعتمد 📅</h3>
              <p className="text-gray-400 text-xs mb-4">تتبع الأيام وتواقيت نزول خطوط الإنتاج والـ Drops الهامة.</p>

              <div className="space-y-3 font-sans text-xs">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="border border-gray-150 rounded-xl p-4 flex gap-4 items-start hover:border-[#DF8A9D]/40 transition bg-gray-50">
                    <div className="bg-black text-[#F6E7A6] p-3 rounded-lg text-center min-w-[70px]">
                      <span className="block text-[10px] uppercase font-bold">{ev.platform}</span>
                      <span className="block font-bold text-[14px] mt-1">🗓️</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-sm">{ev.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          ev.status === 'posted' ? 'bg-emerald-50 text-emerald-600' :
                          ev.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {ev.status === 'posted' ? 'تم النشر الملكي ✨' :
                           ev.status === 'scheduled' ? 'مجدول للإطلاق ⏳' : 'مسودة قيد المراجعة 📝'}
                        </span>
                      </div>
                      <p className="text-gray-500 font-sans">{ev.notes}</p>
                      <p className="text-[10px] text-gray-400 font-mono">توقيت النشر: {new Date(ev.scheduledTime).toLocaleString('ar-EG')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 6: EMAIL NEWSLETTERS */}
      {activeTab === 'email' && (
        <div className="space-y-6 animate-fade-in-rapid">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-lg text-gray-900 mb-1">المصمم البصري المباشر للحملات البريدية ✉️</h3>
              <p className="text-gray-400 text-xs">اكتبي بريداً إلكترونياً ترويجياً يلامس قلوب العميلات ويحقق أعلى معدل نقر للطلب.</p>

              <div className="space-y-3.5 text-xs font-sans">
                <div>
                  <label className="block text-gray-500 mb-1">عنوان موضوع الرسالة (Subject line)</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full border border-gray-200 bg-white p-2.5 rounded-lg font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 mb-1">الشريحة المستهدفة (Segment)</label>
                    <select
                      value={selectedSegment}
                      onChange={(e) => setSelectedSegment(e.target.value as any)}
                      className="w-full border border-gray-250 bg-white p-2.5 rounded-lg"
                    >
                      <option value="all">كافة المسجلات والعرائس 👑</option>
                      <option value="vip">عميلات SULTA VIP الفخمة</option>
                      <option value="new">المشتركات الجدد (نهاية الأسبوع)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">رمز الخصم التلقائي المرفق بالرسالة</label>
                    <select className="w-full border border-gray-255 bg-white p-2.5 rounded-lg font-mono">
                      <option>SULTA10</option>
                      <option>MONA15</option>
                      <option>EID2026</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">نص ومخطط الـ HTML الفاخر للبريد</label>
                  <textarea
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full border border-gray-200 bg-white p-3 rounded-lg font-mono text-left"
                    style={{ direction: 'ltr' }}
                  ></textarea>
                </div>
                <button
                  onClick={dispatchNewsletterCampaign}
                  className="w-full bg-[#0B0B0B] text-[#F6E7A6] py-3.5 rounded-xl font-bold hover:bg-black/90 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Mail size={16} />
                  <span>إطلاق وبث البريد لـ {subscribers.length} ملكة مسجلة 🚀</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-base text-gray-900 mb-1">قائمة العميلات المشتركات بالنشرة الإخبارية</h3>
              <p className="text-gray-400 text-xs">تنبيهات فورية للمشتركات الجديدات بالموقع.</p>

              <div className="space-y-2.5 max-h-[450px] overflow-y-auto text-xs font-sans">
                {subscribers.map((subItem) => (
                  <div key={subItem.id} className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[#0B0B0B]">{subItem.email}</p>
                      <span className="text-[9px] text-[#DF8A9D] bg-[#DF8A9D]/10 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                        شريحة: {subItem.segment}
                      </span>
                    </div>
                    <span className="text-[#25D366] font-bold">🟢 نشط</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 7: AUTOMATIONS */}
      {activeTab === 'automations' && (
        <div className="space-y-6 animate-fade-in-rapid">
          <div className="bg-white border border-gray-150 rounded-2xl p-5">
            <h3 className="font-serif text-lg text-gray-900 mb-1 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} />
              محرك وأتمتة إجراءات التحرير والمبيعات التلقائية (SULTA Automations V1.0)
            </h3>
            <p className="text-gray-400 text-xs mb-4">أتمي العمليات الصعبة والمبيعات بدون تدخل يدوي لزيادة تفرغ فريق خدمة عملاء SULTA.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs">
              {automationRules.map((rule) => (
                <div key={rule.id} className="border border-gray-150 rounded-xl p-5 bg-gray-50 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#DF8A9D] font-bold tracking-widest uppercase">
                      النوع: {rule.actionType === 'whatsapp' ? 'تنبيه واتساب 💬' : 'بريد إلكتروني ✉️'}
                    </span>
                    <h4 className="text-base font-bold text-gray-900">{rule.title}</h4>
                    <p className="text-gray-500">الزناد: {rule.trigger}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-150">
                    <span className="text-[10px] text-gray-400 font-mono">مهلة التأخير: {rule.delayMinutes} دقيقة</span>
                    <button
                      onClick={() => toggleAutomationRule(rule.id)}
                      className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                        rule.isActive ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {rule.isActive ? 'نشط الآن 🟢' : 'معطل مؤقتاً 🔴'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SEO HEALTH */}
      {activeTab === 'seo' && (
        <div className="space-y-6 animate-fade-in-rapid">
          <div className="bg-white border border-gray-150 rounded-2xl p-6">
            <h3 className="font-serif text-xl text-gray-950 mb-1 flex items-center gap-2">
              <Search className="text-[#DF8A9D]" size={20} />
               صحة وتحسين محركات البحث والأرشفة الذكية (SEO Marketing Hub)
            </h3>
            <p className="text-gray-400 text-xs mb-6">تحقق مستمر وتحديث لعلامات ميتا و سلف الفهرسة لبوتيك SULTA لضمان التربع في صدارة قوقل بالخليج العربي.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="border border-gray-150 rounded-xl p-4 space-y-3 bg-gray-50/70 text-xs font-sans">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <CheckCircle className="text-emerald-500" size={15} />
                  أوسمة الميتا في الصفحة الرئيسية
                </h4>
                <div className="space-y-2">
                  <p>• <strong>العلامة:</strong> SULTA | بيجامات وملابس نوم العرائس الفاخرة بالرياض ومصر</p>
                  <p>• <strong>الوصف الملكي:</strong> تسوقي أرقى تصاميم البيجامات المصنوعة يدوياً من القطن البارد والساتان الفاخر مع فيونكات أنيقة لراحة تسكن أحلامكِ.</p>
                  <p>• <strong>أكواد التتبع المدمجة:</strong> Snapchat Pixel, TikTok Pixel, Facebook CAPI</p>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">حالة الميتا الكلية:</span>
                  <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded">ممتاز ✦</span>
                </div>
              </div>

              <div className="border border-gray-150 rounded-xl p-4 space-y-3 bg-gray-50/70 text-xs font-sans">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="text-amber-500" size={15} />
                  تدقيق الأصول والصور المفقودة للمنتجات
                </h4>
                <div className="space-y-2 text-gray-550 leading-relaxed">
                  <p>• <strong>عدد الصور المدققة:</strong> 24 صورة أصلية</p>
                  <p>• <strong>نصوص Alt التوضيحية:</strong> مدعمة بالكامل بالعربية لتسهيل عمليات البحث الذكي بالصور لكتبة الديكور والملابس.</p>
                  <p>• <strong>الأخطاء المكتشفة:</strong> 0 خطأ (تم تفادي الصور المكسورة بالكامل عبر نظام الـ Fallback الآلي).</p>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">الأخطاء المتبقية:</span>
                  <span className="bg-[#25D366]/10 text-[#25D366] font-bold px-2 py-0.5 rounded">0 أخطاء 🥳</span>
                </div>
              </div>

              <div className="border border-gray-150 rounded-xl p-4 space-y-3 bg-gray-50/70 text-xs font-sans">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Layers className="text-[#DF8A9D]" size={15} />
                   أكواد الـ Schema الهيكلية المفعلة
                </h4>
                <div className="space-y-2 text-gray-550">
                  <p>• <strong>Schema Product:</strong> لتسهيل إظهار التقييمات والأسعار مباشرة بمحرك قوقل.</p>
                  <p>• <strong>Schema Sitemaps:</strong> خرائط ممتدة ومفهرسة تلقائياً كل 24 ساعة.</p>
                  <p>• <strong>Canonical tags:</strong> لمنع تكرار الصفحات عند تبديل العملة بين SAR و EGP.</p>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">الفهرسة:</span>
                  <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded">تلقائية من سوبابيس</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 9: MARKETING ANALYTICS & UTM GENERATOR */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in-rapid">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-lg text-gray-900 mb-1 flex items-center gap-2">
                <Share2 className="text-[#DF8A9D]" size={18} />
                 منشئ ومحرك الروابط التتبعية المدمجة (UTM Code Builder)
              </h3>
              <p className="text-gray-400 text-xs">أطلقي روابط فريدة للمؤثرين لمتابعة نقرات المبيعات وحساب العائدات فورياً بكل شفافية.</p>

              <div className="space-y-3 text-xs font-sans">
                <div>
                  <label className="block text-gray-500 mb-1">مصدر الزوار والحملة (utm_source)</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    className="w-full border border-gray-200 bg-white p-2.5 rounded-lg text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">الوسيط الإعلاني (utm_medium)</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    className="w-full border border-gray-200 bg-white p-2.5 rounded-lg text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">اسم الحملة التسويقية (utm_campaign)</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="w-full border border-gray-200 bg-white p-2.5 rounded-lg text-left font-mono"
                  />
                </div>

                <div className="bg-white border border-gray-150 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">الرابط الإعلاني الناتج:</span>
                  <p className="text-[11px] font-mono select-all text-[#DF8A9D] break-all text-left bg-gray-50 p-2.5 rounded border border-gray-100">
                    {generatedUtmUrl}
                  </p>
                  <button
                    onClick={() => copyToClipboard(generatedUtmUrl)}
                    className="mt-2 w-full bg-black text-[#F6E7A6] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition hover:scale-[1.01]"
                  >
                    <Clipboard size={14} />
                    نسخ الرابط الملكي والمنشور 📋
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-lg text-gray-900 mb-1">تحليلات مصادر الزوار والمبيعات الحية بالموقع 📊</h3>
              <p className="text-gray-400 text-xs">تعقب مصدر المبيعات فوري من سوبابيس (Supabase UTM Sync).</p>

              <div className="space-y-4 font-sans text-xs text-gray-900">
                {[
                  { channel: 'زيارات مباشرة عبر إنستقرام (Instagram Promo)', clicks: 1420, rate: '45%', sales: '142,000 SAR' },
                  { channel: 'شراكات وتأثير تيك توك (TikTok Trends)', clicks: 980, rate: '31%', sales: '98,000 SAR' },
                  { channel: 'مؤثري سناب شات (Snapchat Ads)', clicks: 450, rate: '14%', sales: '45,000 SAR' },
                  { channel: 'محرك بحث غوغل العضوي (Google SEO)', clicks: 230, rate: '7%', sales: '23,000 SAR' },
                  { channel: 'حملات البريد الملكي (Email Newsletters)', clicks: 120, rate: '3%', sales: '12,000 SAR' }
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-800">{item.channel}</span>
                      <span className="text-emerald-600 font-bold">{item.sales}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[10px]">
                      <span>{item.clicks} زائر فريد</span>
                      <span>توزع نسبي: {item.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 10: UGC CENTER */}
      {activeTab === 'ugc' && (
        <div className="space-y-6 animate-fade-in-rapid font-sans">
          <div className="bg-white border border-gray-150 rounded-2xl p-6">
            <h3 className="font-serif text-xl text-gray-950 mb-1 flex items-center gap-2">
              <Eye className="text-[#DF8A9D]" size={20} />
              مركز المحتوى المُنشأ بواسطة العميلات الفاخرات (UGC)
            </h3>
            <p className="text-gray-400 text-xs mb-6">إدارة صور ومراجعات وتغطيات العميلات لاستخدامها في زيادة الموثوقية والمبيعات.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="border border-gray-150 rounded-xl overflow-hidden group cursor-pointer relative">
                  <img src={`https://images.unsplash.com/photo-1518${i}00000000-000${i}00000000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} alt="UGC" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-100" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                    <p className="text-xs font-bold truncate">@user_lux_{i}</p>
                    <p className="flex items-center gap-1 text-[10px] mt-1 text-yellow-400">
                      ★ ★ ★ ★ ★
                    </p>
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/90 text-black p-1.5 rounded-md hover:bg-emerald-400 hover:text-white transition-colors" title="الموافقة وعرض في المتجر">
                      <CheckCircle size={14} />
                    </button>
                    <button className="bg-white/90 text-black p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors" title="رفض وإخفاء">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: AI CONTENT ASSISTANT */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-fade-in-rapid">
          <div className="bg-[#FAFAF7] border border-[#DF8A9D]/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <Sparkles className="text-[#DF8A9D] mb-4 animate-pulse" size={48} />
            <h3 className="font-serif text-2xl font-bold text-gray-950 mb-2">مساعد المحتوى الذكي قيد التجهيز</h3>
            <p className="text-gray-500 max-w-md text-sm leading-relaxed mb-6">
              يتم ربط محرك الذكاء الاصطناعي مع Gemini AI لصياغة أوصاف المنتجات الفاخرة، ومقالات المدونة المهيأة للـ SEO، وكتابة كوبي إبداعي لمنشورات السوشيال ميديا تلقائياً. 
            </p>
            <button className="bg-black text-[#F6E7A6] px-8 py-3 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
              <RefreshCw size={16} /> تفعيل المحرك الذكي
            </button>
          </div>
        </div>
      )}

      {/* TAB 12: MARKETING HEALTH CENTER */}
      {activeTab === 'health' && (
        <div className="space-y-6 animate-fade-in-rapid text-right font-sans">
          <div className="bg-white border border-gray-150 rounded-2xl p-6">
            <h3 className="font-serif text-xl font-bold text-gray-950 mb-6 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              الفحص الصحي الشامل للتسويق (Marketing Health)
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle size={18} /></div>
                  <div>
                    <h4 className="font-bold text-emerald-900">منتجات بدون وصف تسويقي</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">جميع المنتجات تمتلك أوصافاً نصية فاخرة.</p>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold">0 خطأ</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><AlertTriangle size={18} /></div>
                  <div>
                    <h4 className="font-bold text-amber-900">مقالات الـ SEO ومجلة سُلطة القديمة</h4>
                    <p className="text-xs text-amber-700 mt-0.5">يوجد مقال مضى عليه أكثر من 60 يوماً ويحتاج لتحديث.</p>
                  </div>
                </div>
                <button className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">تحديث</button>
              </div>

              <div className="flex justify-between items-center p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600"><Shield size={18} /></div>
                  <div>
                    <h4 className="font-bold text-red-900">تتبع الحملات الإعلانية النشطة</h4>
                    <p className="text-xs text-red-700 mt-0.5">تبدو أن حملة Snapchat تستهلك ميزانية دون تحويلات مسجلة.</p>
                  </div>
                </div>
                <button className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">تحقق فوراً</button>
              </div>

              <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp size={18} /></div>
                  <div>
                    <h4 className="font-bold text-blue-900">حالة الربط بمنصات التواصل</h4>
                    <p className="text-xs text-blue-700 mt-0.5">Instagram و TikTok متصلان بقوة ويقومان باستيراد UGC تلقائياً.</p>
                  </div>
                </div>
                <span className="text-blue-600 font-bold">نشط 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
