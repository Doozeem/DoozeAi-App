import React, { useState } from 'react';
import { PromoRequest, AudioStatus, Language, ContentType } from './types';
import PromoForm from './components/PromoForm';
import GeneratedResult from './components/GeneratedResult';
import { generatePromoText, generatePromoSpeech } from './services/geminiService';
import { Zap, Sparkles, Layers, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('id');
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>(AudioStatus.IDLE);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [currentContentType, setCurrentContentType] = useState<ContentType>('Promotion');

  const t = {
    id: {
      powered: 'Didukung oleh Gemini 2.5',
      titleStart: 'Teman Setia dalam',
      titleEnd: 'Menyusun Karya.',
      subtitle: 'Sebuah alat bantu sederhana untuk meringankan ide Anda menjadi tulisan dan suara yang bermanfaat.',
      workflowTitle: 'Langkah Sederhana',
      steps: [
        { title: "Tentukan Hajat", desc: "Pilih jenis bantuan konten yang dibutuhkan" },
        { title: "Sampaikan Detail", desc: "Ceritakan maksud Anda atau unggah video" },
        { title: "Terima Hasil", desc: "Dapatkan draf naskah dan suara pendukung" }
      ],
      err: "Mohon maaf, terjadi kendala teknis. Silakan periksa kunci API dan coba kembali."
    },
    en: {
      powered: 'Supported by Gemini 2.5',
      titleStart: 'A Loyal Companion',
      titleEnd: 'in Your Creation.',
      subtitle: 'A simple tool designed to assist in transforming your ideas into useful scripts and voice-overs.',
      workflowTitle: 'Simple Steps',
      steps: [
        { title: "Set Intention", desc: "Choose the type of assistance you need" },
        { title: "Share Details", desc: "Tell us your intent or upload a video" },
        { title: "Receive Draft", desc: "Get your script draft and supporting audio" }
      ],
      err: "We apologize, a technical issue occurred. Please check your API key and try again."
    }
  };

  const text = t[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  const handleGenerateContent = async (request: PromoRequest) => {
    setIsGeneratingText(true);
    setAudioStatus(AudioStatus.IDLE);
    setAudioBuffer(null);
    setAudioBlob(null);
    setGeneratedContent("");
    setCurrentContentType(request.contentType);

    try {
      const text = await generatePromoText({ ...request, language });
      setGeneratedContent(text);
    } catch (error) {
      console.error(error);
      setGeneratedContent(text.err);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateSpeech = async (textToSpeak: string, voice: string) => {
    if (!textToSpeak) return;

    setAudioStatus(AudioStatus.GENERATING);
    try {
      const { buffer, blob } = await generatePromoSpeech(textToSpeak, voice);
      setAudioBuffer(buffer);
      setAudioBlob(blob);
      setAudioStatus(AudioStatus.READY);
    } catch (error) {
      console.error(error);
      setAudioStatus(AudioStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-amber-500/20">
      {/* Modern Header - Dark Glass */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* New Logo: Zap Icon with Amber Gradient */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-2.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transform hover:rotate-6 transition-transform duration-300">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Dooze<span className="text-amber-400">.AI</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition backdrop-blur-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'ID' : 'EN'}</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-sm font-medium text-violet-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-violet-400 fill-violet-400" />
              <span>{text.powered}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 space-y-6">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xl">
            {text.titleStart} <span className="gradient-text">Dooze</span>. <br/>
            {text.titleEnd}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed font-light">
            {text.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <PromoForm onSubmit={handleGenerateContent} isLoading={isGeneratingText} language={language} />
            
            <div className="glass-panel p-6 rounded-3xl border border-white/5">
              <h4 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                {text.workflowTitle}
              </h4>
              <div className="space-y-6">
                {text.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-white/5 text-amber-500 flex items-center justify-center font-bold text-sm shrink-0 border border-white/10 group-hover:bg-amber-500 group-hover:text-black transition-colors duration-300">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-200 text-sm group-hover:text-amber-400 transition-colors">{step.title}</h5>
                      <p className="text-xs text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7 h-full">
            <div className="sticky top-24">
              <GeneratedResult 
                content={generatedContent}
                onGenerateSpeech={handleGenerateSpeech}
                audioStatus={audioStatus}
                audioBuffer={audioBuffer}
                audioBlob={audioBlob}
                language={language}
                contentType={currentContentType}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;