import React, { useState, useRef, useEffect } from 'react';
import { PromoRequest, ContentType, Language } from '../types';
import { Sparkles, ArrowRight, Video, X, Megaphone, BookOpen, Wand2, Code2 } from 'lucide-react';
import { analyzeVideoContent } from '../services/geminiService';

interface PromoFormProps {
  onSubmit: (data: PromoRequest) => void;
  isLoading: boolean;
  language: Language;
}

const PromoForm: React.FC<PromoFormProps> = ({ onSubmit, isLoading, language }) => {
  const [contentType, setContentType] = useState<ContentType>('Promotion');
  
  const [formData, setFormData] = useState<PromoRequest>({
    contentType: 'Promotion',
    productName: '',
    description: '',
    targetAudience: '',
    platform: 'Instagram',
    tone: 'Excited',
    language: language
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, language }));
  }, [language]);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    id: {
      promotion: 'Bantu Promosi',
      story: 'Bantu Cerita',
      webDev: 'Bantu Showcase',
      uploadVideo: 'Izinkan AI Mempelajari Video',
      uploadWeb: 'Unggah Video Demo',
      uploadHint: 'Unggah video agar kami bisa membantu mengisi formulir ini.',
      uploadWebHint: 'Unggah rekaman layar untuk kami pelajari fiturnya.',
      analyzing: 'Sedang mempelajari konten...',
      analyzeSuccess: 'Video Berhasil Dipelajari',
      platform: 'Media Tayang',
      tone: 'Nuansa Penyampaian',
      submitProm: 'Bantu Susun Kata',
      submitStory: 'Bantu Rangkai Cerita',
      submitWeb: 'Bantu Deskripsikan',
      loading: 'Sedang Menyusun...',
      tones: {
        Excited: 'Semangat Positif',
        Professional: 'Formal & Santun',
        Casual: 'Santai & Akrab',
        Luxury: 'Elegan',
        Humorous: 'Ringan & Jenaka',
        Persuasive: 'Mengajak Kebaikan',
        Dramatic: 'Menyentuh Hati',
        Inspiring: 'Menginspirasi',
        Spooky: 'Misterius',
        Fairytale: 'Dongeng',
        Melancholic: 'Sendu',
        Suspenseful: 'Menegangkan',
        Technical: 'Teknis & Jelas',
        Enthusiastic: 'Antusias',
        Minimalist: 'Sederhana',
        Innovative: 'Inovatif',
        'Tutorial Style': 'Edukatif'
      }
    },
    en: {
      promotion: 'Assist Promotion',
      story: 'Assist Story',
      webDev: 'Assist Showcase',
      uploadVideo: 'Allow AI to Learn Video',
      uploadWeb: 'Upload Demo Video',
      uploadHint: 'Upload a video so we can help fill this form.',
      uploadWebHint: 'Upload screen recording for us to learn the features.',
      analyzing: 'Learning content...',
      analyzeSuccess: 'Video Learned Successfully',
      platform: 'Publishing Platform',
      tone: 'Delivery Tone',
      submitProm: 'Help Compose Words',
      submitStory: 'Help Weave Story',
      submitWeb: 'Help Describe',
      loading: 'Composing...',
      tones: {
        Excited: 'Positive Spirit',
        Professional: 'Formal & Polite',
        Casual: 'Casual & Friendly',
        Luxury: 'Elegant',
        Humorous: 'Light & Witty',
        Persuasive: 'Persuasive',
        Dramatic: 'Touching',
        Inspiring: 'Inspiring',
        Spooky: 'Mysterious',
        Fairytale: 'Fairytale',
        Melancholic: 'Melancholic',
        Suspenseful: 'Suspenseful',
        Technical: 'Technical & Clear',
        Enthusiastic: 'Enthusiastic',
        Minimalist: 'Simple',
        Innovative: 'Innovative',
        'Tutorial Style': 'Educative'
      }
    }
  };

  const text = t[language];

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    
    let defaultTone = 'Excited';
    if (type === 'Story') defaultTone = 'Dramatic';
    if (type === 'Web Showcase') defaultTone = 'Professional';

    setFormData(prev => ({ 
      ...prev, 
      contentType: type,
      tone: defaultTone
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      await analyzeVideo(file);
    }
  };

  const analyzeVideo = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeVideoContent(file, language);
      setFormData(prev => ({
        ...prev,
        productName: result.productName || prev.productName,
        description: result.description || prev.description,
        targetAudience: result.targetAudience || prev.targetAudience
      }));
    } catch (error) {
      console.error("Analysis failed", error);
      alert(language === 'id' ? "Mohon maaf, kami gagal mempelajari video Anda." : "We apologize, we failed to learn from your video.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getLabels = () => {
    if (contentType === 'Web Showcase') {
      return language === 'id' ? {
        title: 'Nama Proyek / Website',
        titlePlaceholder: 'Contoh: Web Portfolio Pribadi',
        desc: 'Teknologi & Fitur',
        descPlaceholder: 'Mohon jelaskan teknologi dan fitur utamanya...',
        audience: 'Untuk Siapa?',
      } : {
        title: 'Project Name / Website',
        titlePlaceholder: 'Ex: Personal Web Portfolio',
        desc: 'Tech & Features',
        descPlaceholder: 'Please describe the tech and main features...',
        audience: 'For Whom?',
      };
    }
    if (contentType === 'Story') {
      return language === 'id' ? {
        title: 'Judul Cerita',
        titlePlaceholder: 'Contoh: Hikmah di Hutan',
        desc: 'Ide Cerita',
        descPlaceholder: 'Mohon ceritakan sedikit tentang alur atau pesannya...',
        audience: 'Pembaca',
      } : {
        title: 'Story Title',
        titlePlaceholder: 'Ex: Wisdom in the Woods',
        desc: 'Story Idea',
        descPlaceholder: 'Please tell us a bit about the plot or message...',
        audience: 'Readers',
      };
    }
    return language === 'id' ? {
      title: 'Nama Produk / Jasa',
      titlePlaceholder: 'Contoh: Kopi Senja',
      desc: 'Keunggulan',
      descPlaceholder: 'Apa kebaikan utama produk ini?',
      audience: 'Target Penerima',
    } : {
      title: 'Product / Service Name',
      titlePlaceholder: 'Ex: Twilight Coffee',
      desc: 'Advantages',
      descPlaceholder: 'What is the main goodness of this product?',
      audience: 'Target Audience',
    };
  };

  const labels = getLabels();

  const getTones = () => {
    if (contentType === 'Web Showcase') {
      return ['Professional', 'Technical', 'Enthusiastic', 'Minimalist', 'Innovative', 'Tutorial Style'];
    }
    if (contentType === 'Story') {
      return ['Dramatic', 'Inspiring', 'Spooky', 'Fairytale', 'Funny', 'Melancholic', 'Suspenseful'];
    }
    return ['Excited', 'Professional', 'Casual', 'Luxury', 'Humorous', 'Persuasive'];
  };

  const tones = getTones();

  // Calculate toggle position
  const getToggleStyle = () => {
    switch(contentType) {
      case 'Promotion': return 'translate-x-0';
      case 'Story': return 'translate-x-[100%]';
      case 'Web Showcase': return 'translate-x-[200%]';
      default: return 'translate-x-0';
    }
  };

  return (
    <div className="glass-panel p-8 rounded-3xl shadow-2xl relative overflow-hidden ring-1 ring-white/10">
      
      {/* Toggle - 3 Options (Dark) */}
      <div className="relative flex bg-slate-900/50 p-1.5 rounded-2xl mb-8 border border-white/10">
        <div 
          className={`absolute inset-y-1.5 w-[calc(33.33%-4px)] bg-slate-700/80 rounded-xl shadow-md transition-all duration-300 ease-out border border-white/10 ${getToggleStyle()}`}
        ></div>
        
        <button
          type="button"
          onClick={() => handleContentTypeChange('Promotion')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
            contentType === 'Promotion' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span className="hidden sm:inline">{text.promotion}</span>
          <span className="sm:hidden">Promo</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleContentTypeChange('Story')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
            contentType === 'Story' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{text.story}</span>
          <span className="sm:hidden">Story</span>
        </button>

        <button
          type="button"
          onClick={() => handleContentTypeChange('Web Showcase')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
            contentType === 'Web Showcase' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span className="hidden sm:inline">{text.webDev}</span>
          <span className="sm:hidden">Web</span>
        </button>
      </div>

      <div className="mb-6 p-[1px] bg-gradient-to-r from-amber-500/30 via-violet-500/30 to-blue-500/30 rounded-2xl">
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-6 transition-all hover:bg-slate-900/90">
          {!videoFile ? (
            <label className="cursor-pointer group block text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-slate-700 transition-all duration-300 shadow-lg border border-white/5">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                {contentType === 'Web Showcase' ? text.uploadWeb : text.uploadVideo}
              </h3>
              <p className="text-xs text-slate-500 mt-1 px-4 group-hover:text-slate-400 transition-colors">
                {contentType === 'Web Showcase' 
                  ? text.uploadWebHint 
                  : text.uploadHint}
              </p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
          ) : (
             <div className="w-full">
              <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-inner mb-3">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                     <Video className="w-4 h-4 text-amber-500" />
                   </div>
                   <span className="text-sm font-medium text-slate-200 truncate">{videoFile.name}</span>
                </div>
                <button onClick={clearVideo} className="p-1.5 hover:bg-red-900/30 rounded-full text-slate-500 hover:text-red-400 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {isAnalyzing ? (
                 <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold animate-pulse py-1">
                   <Sparkles className="w-3 h-3" />
                   {text.analyzing}
                 </div>
              ) : (
                <div className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 box-shadow-glow"></div>
                  {text.analyzeSuccess}
                </div>
              )}
             </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="group">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{labels.title}</label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
            disabled={isAnalyzing}
            className="glass-input w-full rounded-xl px-4 py-3.5 placeholder-slate-600 outline-none transition-all font-medium disabled:opacity-50"
            placeholder={labels.titlePlaceholder}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{labels.desc}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={isAnalyzing}
            rows={3}
            className="glass-input w-full rounded-xl px-4 py-3.5 placeholder-slate-600 outline-none transition-all font-medium resize-none disabled:opacity-50"
            placeholder={labels.descPlaceholder}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{labels.audience}</label>
          <input
            type="text"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            required
            disabled={isAnalyzing}
            className="glass-input w-full rounded-xl px-4 py-3.5 placeholder-slate-600 outline-none transition-all font-medium disabled:opacity-50"
            placeholder={contentType === 'Web Showcase' ? (language === 'id' ? "Rekruiter, Klien..." : "Recruiter, Client...") : (language === 'id' ? "Contoh: Gen Z..." : "Ex: Gen Z...")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{text.platform}</label>
            <div className="relative">
              <select
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                disabled={isAnalyzing}
                className="glass-input w-full rounded-xl px-4 py-3.5 outline-none transition-all appearance-none cursor-pointer font-medium"
              >
                <option className="bg-slate-900" value="Instagram">Instagram</option>
                <option className="bg-slate-900" value="LinkedIn">LinkedIn</option>
                <option className="bg-slate-900" value="Twitter">Twitter / X</option>
                <option className="bg-slate-900" value="TikTok Script">TikTok</option>
                <option className="bg-slate-900" value="YouTube Shorts">Shorts</option>
                <option className="bg-slate-900" value="Email">Email</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{text.tone}</label>
             <div className="relative">
              <select
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                disabled={isAnalyzing}
                className="glass-input w-full rounded-xl px-4 py-3.5 outline-none transition-all appearance-none cursor-pointer font-medium"
              >
                {tones.map(tone => (
                  <option className="bg-slate-900" key={tone} value={tone}>
                    {/* @ts-ignore */}
                    {text.tones[tone] || tone}
                  </option>
                ))}
              </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isAnalyzing}
          className={`w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 hover:from-amber-400 hover:via-orange-500 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-orange-900/40 overflow-hidden ring-1 ring-white/20 ${isLoading || isAnalyzing ? 'opacity-80 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          {isLoading ? (
            <span className="flex items-center gap-2 relative z-10">
              <LoaderIcon className="animate-spin h-5 w-5 text-white" />
              <span>{text.loading}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 relative z-10 text-white drop-shadow-sm">
              <Wand2 className="w-5 h-5" />
              {contentType === 'Promotion' ? text.submitProm : contentType === 'Story' ? text.submitStory : text.submitWeb}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default PromoForm;