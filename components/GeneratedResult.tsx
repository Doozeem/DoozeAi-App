import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AudioStatus, Language, ContentType } from '../types';
import { Play, Square, Loader2, Volume2, Copy, Check, Info, Download, Edit3, Music, Mic, Rocket, Hash, AlignCenter } from 'lucide-react';

interface GeneratedResultProps {
  content: string;
  onGenerateSpeech: (text: string, voice: string) => void;
  audioStatus: AudioStatus;
  audioBuffer: AudioBuffer | null;
  audioBlob: Blob | null;
  language: Language;
  contentType: ContentType;
}

type TabType = 'full' | 'narration' | 'seo';

const GeneratedResult: React.FC<GeneratedResultProps> = ({ 
  content, 
  onGenerateSpeech, 
  audioStatus, 
  audioBuffer,
  audioBlob,
  language,
  contentType
}) => {
  const [localContent, setLocalContent] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('full');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const t = {
    id: {
      tabs: {
        full: 'Editor Naskah',
        narration: 'Mode Baca',
        seo: 'Metadata SEO'
      },
      editor: 'Ruang Kolaborasi',
      copy: 'Salin',
      copied: 'Tersalin',
      writeSomething: 'Draf tulisan akan muncul di sini...',
      info: 'Edit naskah di sini. Perubahan akan otomatis memperbarui Mode Baca.',
      narrationInfo: 'Tampilan ini hanya menampilkan narasi cerita yang akan dibaca. Instruksi visual dan label telah disaring.',
      seoInfo: 'Salin metadata ini untuk optimasi YouTube/TikTok Anda.',
      voiceLabel: 'Suara AI',
      doozeIt: 'Generate Suara',
      processing: 'Memproses...',
      emptyTitle: 'Menunggu Ide Anda',
      emptyDesc: 'Isi formulir untuk mendapatkan naskah ajaib.',
      voices: {
        Netral: 'Netral',
        Lembut: 'Lembut',
        Berat: 'Berat',
        Energik: 'Energik',
        Wanita: 'Elegan'
      }
    },
    en: {
      tabs: {
        full: 'Script Editor',
        narration: 'Reader Mode',
        seo: 'SEO Data'
      },
      editor: 'Collaboration Space',
      copy: 'Copy',
      copied: 'Copied',
      writeSomething: 'Draft will appear here...',
      info: 'Edit script here. Changes automatically update Reader Mode.',
      narrationInfo: 'This view displays only the story narration. Visual instructions and labels have been filtered out.',
      seoInfo: 'Copy this metadata for your YouTube/TikTok optimization.',
      voiceLabel: 'AI Voice',
      doozeIt: 'Generate Audio',
      processing: 'Processing...',
      emptyTitle: 'Awaiting Ideas',
      emptyDesc: 'Fill the form to get magic scripts.',
      voices: {
        Netral: 'Neutral',
        Lembut: 'Soft',
        Berat: 'Deep',
        Energik: 'Energetic',
        Wanita: 'Elegant'
      }
    }
  };

  const text = t[language];

  // Logic to separate content with Smart Mode Filtering
  const { narrationPreview, seoContent } = useMemo(() => {
    if (!localContent) return { narrationPreview: '', seoContent: '' };

    // 1. Split SEO Section first
    const parts = localContent.split(/--- 🚀|--- SEO|--- KELENGKAPAN/i);
    const mainScript = parts[0];
    const rawSeo = parts.length > 1 ? parts.slice(1).join('') : '';

    const lines = mainScript.split('\n');
    const cleanLines: string[] = [];

    // --- SMART KEYWORDS CONFIGURATION ---

    // Words that indicate a whole line should be removed (Tech specs, Visuals)
    const baseRemoveKeywords = [
      'Visual', 'Video', 'Gambar', 'Image', 'Footage', 'Shot', 'Frame', 'Clip', 
      'Audio', 'Suara', 'Sound', 'Musik', 'Music', 'BGM', 'Backsound', 'SFX', 'Efek', 
      'Cut to', 'Fade', 'Dissolve', 'Zoom', 'Pan', 'Tilt', 
      'Durasi', 'Duration', 'Format', 'Ratio'
    ];

    // Words that indicate a label prefix to strip (e.g. "Host: Hello" -> "Hello")
    const baseStripKeywords = [
      'Narator', 'Host', 'Presenter', 'Voiceover', 'VO', 'Speaker', 'Narrator', 
      'Man', 'Woman', 'Boy', 'Girl', 'Character', 'Penutur', 'Pencerita',
      'Pria', 'Wanita', 'Anak', 'Ibu', 'Bapak', 'Cowok', 'Cewek', 'Tokoh', 'Orang'
    ];

    // Mode Specific Additions
    if (contentType === 'Promotion') {
      baseRemoveKeywords.push('Scene', 'Adegan');
      baseStripKeywords.push(
        'Hook', 'Intro', 'Opening', 'Pembuka', 'Isi', 'Body', 'Content', 
        'Outro', 'Closing', 'Penutup', 'CTA', 'Call to Action', 
        'Headline', 'Caption', 'Text', 'Teks', 'Tulisan',
        'Problem', 'Masalah', 'Solusi', 'Solution', 'Benefit', 'Manfaat', 'Keunggulan'
      );
    } else if (contentType === 'Web Showcase') {
      baseRemoveKeywords.push('Slide', 'Layar', 'Screen', 'Kursor', 'Cursor', 'Click', 'Hover');
      baseStripKeywords.push(
        'Intro', 'Opening', 'Fitur', 'Feature', 'Demo', 'Stack', 'Teknologi', 'Technology', 
        'Closing', 'Outro', 'Step', 'Langkah', 'Bagian', 'Part'
      );
    } else if (contentType === 'Story') {
      baseRemoveKeywords.push('Act', 'Bab', 'Chapter', 'Scene', 'Adegan', 'Setting', 'Latar', 'Lokasi', 'Place', 'Context');
      // For stories, we strip generic character roles, but might keep specific names if not matched by generic regex.
      // However, the generic regex below catches most "Name:" patterns.
    }

    // Build Regex
    const removeLineRegex = new RegExp(`^(?:${baseRemoveKeywords.join('|')})(?:\\s+\\d+)?(?:[:\\-]\\s*|\\s*$)`, 'i');
    const stripLabelRegex = new RegExp(`^(?:${baseStripKeywords.join('|')})(?:\\s+\\d+)?\\s*[:\\-]\\s*`, 'i');

    for (let line of lines) {
      let trimmed = line.trim();

      if (!trimmed) continue;
      
      // Skip markdown headers & separators
      if (trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('---')) continue;
      if (trimmed.startsWith('***')) continue;

      // Remove numbering "1. ", "A. "
      trimmed = trimmed.replace(/^\d+[\.\)]\s*/, '').replace(/^[A-Z][\.\)]\s*/, '');

      // Check strictly for visual/technical lines to drop
      if (removeLineRegex.test(trimmed)) continue;

      // Skip lines fully enclosed in brackets or parens
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
          (trimmed.startsWith('(') && trimmed.endsWith(')'))) continue;

      // --- Processing Content ---
      
      // Remove inline instructions: [waving hand], (smiling)
      let processed = trimmed.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');

      // Remove Markdown formatting (*, _, `)
      processed = processed.replace(/[*#_`]/g, '');

      // Remove Emojis
      processed = processed.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); 

      // Remove Timestamps like 00:00 or (00:15)
      processed = processed.replace(/\(?\d{1,2}:\d{2}(?::\d{2})?\)?/g, '');

      // Strip Labels based on Mode
      const labelMatch = processed.match(stripLabelRegex);
      if (labelMatch) {
        processed = processed.substring(labelMatch[0].length);
      } else {
        // Fallback: Generic "Label: Content" detection
        // Useful for Character Names in stories not in the list, or random labels
        const genericMatch = processed.match(/^([A-Za-z0-9\s]+?)\s*:\s*(.+)/);
        if (genericMatch) {
             const label = genericMatch[1].trim();
             // If label is short (likely a name) and not a URL
             if (label.length < 20 && !label.toLowerCase().includes('http') && !label.includes('//')) {
                processed = genericMatch[2];
             }
        }
      }

      // Cleanup quotes and whitespace
      processed = processed.trim();
      // Remove surrounding quotes if they wrap the entire line
      if ((processed.startsWith('"') && processed.endsWith('"')) || (processed.startsWith("'") && processed.endsWith("'"))) {
        processed = processed.slice(1, -1);
      }

      processed = processed.trim();

      // Only add if there is actual text left
      if (processed.replace(/[.,;!?:"'-]/g, '').trim().length > 1) {
        cleanLines.push(processed);
      }
    }

    return {
      narrationPreview: cleanLines.join('\n\n'),
      seoContent: rawSeo
    };
  }, [localContent, contentType]);

  const VOICES = [
    { id: 'Kore', name: 'Kore', desc: text.voices.Netral },
    { id: 'Puck', name: 'Puck', desc: text.voices.Lembut },
    { id: 'Charon', name: 'Charon', desc: text.voices.Berat },
    { id: 'Fenrir', name: 'Fenrir', desc: text.voices.Energik },
    { id: 'Zephyr', name: 'Zephyr', desc: text.voices.Wanita },
  ];

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playAudio = async () => {
    if (!audioBuffer) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    } else if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    sourceNodeRef.current = source;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }
  };

  const handleDownload = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dooze-voice-${selectedVoice}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to handle speech generation using ONLY the narration preview
  const handleGenerateClick = () => {
    // Priority: Use cleaned narration preview if available, otherwise fallback to local content
    const textToSpeak = narrationPreview || localContent;
    onGenerateSpeech(textToSpeak, selectedVoice);
  };

  if (!content && !localContent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-panel rounded-3xl border-2 border-dashed border-white/10 ring-1 ring-white/5">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5">
          <Music className="w-8 h-8 text-amber-500/50" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{text.emptyTitle}</h3>
        <p className="text-slate-400 max-w-xs mx-auto">
          {text.emptyDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[750px] border border-white/10 ring-1 ring-white/5">
      
      {/* Header Tabs */}
      <div className="px-4 py-3 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('full')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'full' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {text.tabs.full}
          </button>
          <button
            onClick={() => setActiveTab('narration')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'narration' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
            {text.tabs.narration}
          </button>
          {seoContent && (
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'seo' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Rocket className="w-3.5 h-3.5" />
              {text.tabs.seo}
            </button>
          )}
        </div>

        <button 
          onClick={() => handleCopy(activeTab === 'narration' ? narrationPreview : activeTab === 'seo' ? seoContent : localContent)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? text.copied : text.copy}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-slate-900/20 overflow-hidden group">
        
        {/* Full Editor */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === 'full' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="px-6 py-2 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center gap-2">
            <Info className="w-3 h-3 text-indigo-400" />
            <p className="text-[10px] text-indigo-300/80 font-medium">{text.info}</p>
          </div>
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            className="w-full h-full p-6 resize-none focus:outline-none bg-transparent text-slate-200 leading-relaxed font-mono text-sm selection:bg-amber-500/30"
            placeholder={text.writeSomething}
          />
        </div>

        {/* Narration Preview (Teleprompter Style) */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 bg-slate-900/40 ${activeTab === 'narration' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="px-6 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3 h-3 text-amber-400" />
              <p className="text-[10px] text-amber-300/80 font-medium">{text.narrationInfo}</p>
            </div>
             <button 
              onClick={() => handleCopy(narrationPreview)}
              className="sm:hidden flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold rounded bg-white/5 border border-white/10 text-slate-300"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {text.copy}
            </button>
          </div>
          <div className="w-full h-full p-8 overflow-y-auto scroll-smooth">
             <div className="max-w-xl mx-auto space-y-8 pb-20">
                {narrationPreview.split('\n\n').map((para, i) => (
                  <p key={i} className="text-xl md:text-2xl font-medium leading-relaxed text-slate-100 text-center hover:text-amber-200 transition-colors cursor-default selection:bg-amber-500/30">
                    {para}
                  </p>
                ))}
                {narrationPreview.length === 0 && (
                  <div className="text-center text-slate-500 mt-20 italic">
                    (Narasi kosong atau belum terdeteksi)
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* SEO Data */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 bg-slate-900/40 ${activeTab === 'seo' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="px-6 py-2 bg-blue-500/5 border-b border-blue-500/10 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3 text-blue-400" />
              <p className="text-[10px] text-blue-300/80 font-medium">{text.seoInfo}</p>
            </div>
             <button 
              onClick={() => handleCopy(seoContent)}
              className="sm:hidden flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold rounded bg-white/5 border border-white/10 text-slate-300"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {text.copy}
            </button>
          </div>
          <div className="w-full h-full p-6 overflow-y-auto">
             <pre className="whitespace-pre-wrap font-mono text-sm text-blue-100/90 bg-slate-950/50 p-6 rounded-2xl border border-blue-500/20 shadow-inner">
               {seoContent.trim() || "(Tidak ada data SEO)"}
             </pre>
          </div>
        </div>

      </div>

      {/* Controls Footer */}
      <div className="p-4 sm:p-6 bg-slate-900/80 border-t border-white/5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Voice Select */}
          <div className="flex-1 min-w-[200px]">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">{text.voiceLabel}</label>
             <div className="grid grid-cols-1">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={audioStatus === AudioStatus.GENERATING}
                  className="glass-input w-full rounded-xl px-4 py-3 outline-none cursor-pointer hover:border-amber-500/50 transition text-sm font-semibold"
                >
                  {VOICES.map(v => (
                    <option className="bg-slate-900" key={v.id} value={v.id}>{v.name} — {v.desc}</option>
                  ))}
                </select>
             </div>
          </div>

          {/* Action Area */}
          <div className="flex items-end gap-2">
            {audioStatus === AudioStatus.IDLE || audioStatus === AudioStatus.ERROR ? (
              <button
                onClick={handleGenerateClick}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-xl text-sm font-bold transition shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:-translate-y-0.5"
              >
                <Volume2 className="w-4 h-4" />
                {text.doozeIt}
              </button>
            ) : null}

            {audioStatus === AudioStatus.GENERATING && (
              <div className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-bold shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{text.processing}</span>
              </div>
            )}

            {(audioStatus === AudioStatus.READY || audioStatus === AudioStatus.PLAYING) && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <button
                    onClick={handleGenerateClick}
                    className="p-3 bg-white/5 border border-white/10 hover:border-amber-500/50 text-slate-400 hover:text-amber-400 rounded-xl transition shadow-sm"
                    title="Regenerate"
                  >
                     <Volume2 className="w-4 h-4" />
                  </button>
                
                <div className="flex items-center p-1 bg-slate-950 rounded-xl shadow-lg border border-white/10">
                  <button
                    onClick={playAudio}
                    className="p-2 hover:bg-white/10 text-white rounded-lg transition"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={stopAudio}
                    className="p-2 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition"
                  >
                    <Square className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {audioBlob && (
                  <button
                    onClick={handleDownload}
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition border border-emerald-400/20"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedResult;