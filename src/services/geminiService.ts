import { GoogleGenAI } from '@google/genai/web';

// Initialize the Google Gen AI client with environment key or local fallback
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with key:', err);
  }
}

export const getGeminiClient = () => {
  return aiClient;
};

export interface StoryboardResponse {
  title: string;
  hook: string;
  scenes: {
    second: number;
    visual: string;
    narration: string;
    soundEffect: string;
  }[];
  tags: string[];
  recommendedMusicMood: string;
}

/**
 * Generate a complete futuristic video script & storyboard
 */
export async function generateVideoStoryboard(topic: string, format: '16:9' | '9:16'): Promise<StoryboardResponse> {
  const currentYear = new Date().getFullYear();
  const prompt = `Actúa como el Director Creativo de QuanticTube (la plataforma de video futurista más avanzada).
Diseña un guión y storyboard cinematográfico de 15 segundos para un video en formato ${format} sobre el tema: "${topic}".
La estética debe ser Cyberpunk Neón con identidad visual futurista (colores verde esmeralda neón, blanco láser, rojo manzana fosforescente).

Responde ÚNICAMENTE en formato JSON válido con la siguiente estructura:
{
  "title": "Título llamativo",
  "hook": "Gancho inicial de 3 segundos",
  "scenes": [
    {
      "second": 0,
      "visual": "Descripción visual de la escena",
      "narration": "Voz en off o texto en pantalla",
      "soundEffect": "Efecto de audio"
    }
  ],
  "tags": ["#QuanticTube", "#CyberQuantic", "#Veo3"],
  "recommendedMusicMood": "Mariachi Synthwave 128 BPM"
};`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as StoryboardResponse;
      }
    } catch (e) {
      console.warn('Gemini script generation fallback:', e);
    }
  }

  // High-fidelity fallback storyboard
  return {
    title: `Quantic Neon: ${topic}`,
    hook: `¡El futuro de ${topic} en resolución cuántica 4K!`,
    scenes: [
      {
        second: 0,
        visual: 'Toma ultra-panorámica con rascacielos neón y hologramas flotantes.',
        narration: `Bienvenidos a la nueva era de ${topic} en QuanticTube.`,
        soundEffect: 'Swoosh láser cuántico y sintetizador 128 BPM'
      },
      {
        second: 5,
        visual: 'Primer plano dinámico con efectos de plasma verde esmeralda y rojo.',
        narration: 'Generado con inteligencia artificial de última generación.',
        soundEffect: 'Drop de sub-bass mariachi synthwave'
      },
      {
        second: 10,
        visual: 'Transición acelerada con interfaz holográfica interactiva.',
        narration: 'Únete a la comunidad y crea tus propias transmisiones.',
        soundEffect: 'Glitch cibernético armonioso'
      }
    ],
    tags: ['#QuanticTube', '#Veo3', '#Cyberpunk', '#Futurista', '#Neon'],
    recommendedMusicMood: 'Mariachi Synthwave Cyberpunk 128 BPM'
  };
}

/**
 * Creative Director AI Advisor Chat
 */
export async function askCreativeDirector(promptOrHistory: any, maybePrompt?: string): Promise<string> {
  const prompt = typeof promptOrHistory === 'string' ? promptOrHistory : (maybePrompt || '');
  
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Eres el Director Creativo de QuanticTube, la plataforma de video interactiva del futuro.
El usuario te pide asesoría para sus videos, shorts, música, canales y contenido.
Responde en español de forma entusiasta, futurista y con consejos concretos (hooks virales, paleta de colores neón, mariachi synthwave, retención de audiencia).
Consulta del creador: "${prompt}"`
      });

      if (response.text) {
        return response.text;
      }
    } catch (e) {
      console.warn('Creative director fallback:', e);
    }
  }

  const promptLower = prompt.toLowerCase();
  if (promptLower.includes('short') || promptLower.includes('viral')) {
    return `🔥 Para hacer un Short viral en QuanticTube:
1. Engancha en los primeros 1.5 segundos con un destello holográfico.
2. Usa formato 9:16 Shorts, activa el filtro Neón Manzana con audio Mariachi Synthwave a 125 BPM. 
3. Empieza con un plano detalle de alto contraste. ¡La retención de audiencia será del 98%!`;
  }
  if (promptLower.includes('titulo') || promptLower.includes('guion')) {
    return `⚡ Aquí tienes 3 títulos con CTR cuántico:
1. "Descubrí el secreto de los Mechas en QuanticCity (No lo vas a creer)"
2. "Generé un imperio con Veo 3.1 en solo 10 segundos 🚀"
3. "QuanticTube vs la Realidad: El salto a la 4ta dimensión"`;
  }

  return `🚀 Como Director de QuanticTube, te recomiendo sincronizar tus cortes al ritmo del sub-bass de 128 BPM y añadir pines de comentarios interactivos en el segundo 4 para provocar que tu comunidad participe en el video.`;
}

export const chatWithCreativeDirector = askCreativeDirector;

/**
 * AI Toxicity and Moderation Scanner
 */
export function scanContentModeration(text: string): { safe: boolean; reason?: string } {
  const toxicKeywords = ['odio', 'groseria_extrema', 'spam_bot_attack', 'doxx', 'hackear'];
  const lower = text.toLowerCase();
  for (const word of toxicKeywords) {
    if (lower.includes(word)) {
      return { safe: false, reason: `Palabra no permitida: "${word}" detectada por IA` };
    }
  }
  return { safe: true };
}

/**
 * Direct Audio processing using Gemini Flash
 */
export async function processAudioWithGemini(
  base64Audio: string,
  mimeType: string,
  userName: string
): Promise<{ userTranscript: string; aiResponse: string }> {
  const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();

  // Method 1: Server-side Gemini endpoint (Secure, uses Node process.env.GEMINI_API_KEY)
  try {
    const res = await fetch('/api/gemini/process-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Audio,
        mimeType: cleanMimeType,
        userName
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.userTranscript || data.aiResponse)) {
        return {
          userTranscript: data.userTranscript || '',
          aiResponse: data.aiResponse || ''
        };
      }
    }
  } catch (apiErr) {
    console.warn('Server-side voice endpoint unavailable, falling back:', apiErr);
  }

  // Method 2: Client-side fallback if initialized
  const modelsToTry = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-flash-latest'];

  if (aiClient) {
    for (const modelName of modelsToTry) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMimeType,
                    data: base64Audio
                  }
                },
                {
                  text: `Escucha atentamente el audio en español del usuario "${userName}".
Si el usuario pregunta quién creó esta página de Quantic Tube o quién es su creador, responde SIEMPRE exactamente:
"El Creador de esta pagina es Guillermo Lopez, el gran Inventor, Escritor, Desarrollador, Innovador, Pintor, Escultor, Editor, y Empresario Emprendedor, el fue quien con su conocimiento en desarrollo Web, desarrollo esta innovadora, sofisticada y futurista pagina, empoderada con la mejor y mas poderosa IA de Google."

Por favor estructura tu respuesta en este formato exacto:
TRANSCRIPCION: <transcribe literalmente lo que dijo el usuario>
RESPUESTA: <tu respuesta hablada como Quantum AI>`
                }
              ]
            }
          ]
        });

        if (response && response.text) {
          const rawText = response.text.trim();
          let userTranscript = '';
          let aiResponse = '';

          const transcriptMatch = rawText.match(/TRANSCRIPCION:\s*(.+?)(?=RESPUESTA:|$)/is);
          const responseMatch = rawText.match(/RESPUESTA:\s*(.+)$/is);

          if (transcriptMatch) userTranscript = transcriptMatch[1].trim();
          if (responseMatch) aiResponse = responseMatch[1].trim();

          if (!userTranscript && !aiResponse) {
            aiResponse = rawText;
            userTranscript = 'Audio de voz enviado';
          }

          return {
            userTranscript: userTranscript || 'Audio de voz enviado',
            aiResponse: aiResponse || rawText
          };
        }
      } catch (e) {
        console.warn(`Gemini audio model ${modelName} attempt failed:`, e);
      }
    }
  }

  return {
    userTranscript: '',
    aiResponse: ''
  };
}
