import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded videos statically
app.use('/uploads', express.static(uploadsDir), (_req, res) => {
  res.status(404).json({ error: 'Video file not found' });
});

// Endpoint to upload a video via Base64 JSON
app.post('/api/upload-video', (req, res) => {
  try {
    const { id, base64Data, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No video data' });
    }
    const cleanId = (id || `vid-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = path.extname(filename || 'video.mp4') || '.mp4';
    const filePath = path.join(uploadsDir, `${cleanId}${ext}`);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const videoUrl = `/uploads/${cleanId}${ext}`;
    return res.json({ success: true, url: videoUrl, id: cleanId });
  } catch (err: any) {
    console.error('Video upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Server-side voice audio transcription & intent endpoint
app.post('/api/gemini/process-voice', async (req, res) => {
  try {
    const { base64Audio, mimeType, userName } = req.body;

    if (!base64Audio) {
      return res.status(400).json({ error: 'No audio data received' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API not configured on server',
        userTranscript: '',
        aiResponse: '',
      });
    }

    const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();
    const cleanUser = userName || 'Memo';

    let userTranscript = '';
    let aiResponse = '';

    // Step 1: Transcribe audio using gemini-3.5-transcribe (recommended audio model)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: base64Audio,
              },
            },
            {
              text: 'Transcribe literalmente el audio en español del usuario.',
            },
          ],
        },
      });

      // Safely extract transcript without triggering non-text parts concatenation warning
      const parts = response?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          userTranscript += part.text + ' ';
        } else if ((part as any).audioTranscription) {
          const at = (part as any).audioTranscription;
          userTranscript += (typeof at === 'string' ? at : at.text || '') + ' ';
        }
      }
      userTranscript = userTranscript.trim();
    } catch (_err) {
      // Handled cleanly without noisy console warnings
    }

    // Step 2: If transcription captured user's intent, handle special intents (like creator query)
    if (userTranscript) {
      const lower = userTranscript.toLowerCase();
      const isCreatorQuery =
        lower.includes('creador') ||
        lower.includes('creo') ||
        lower.includes('creó') ||
        lower.includes('hizo') ||
        lower.includes('desarroll') ||
        lower.includes('invento') ||
        lower.includes('inventó') ||
        lower.includes('quién eres tú') ||
        lower.includes('de quién es') ||
        lower.includes('who created');

      if (isCreatorQuery) {
        aiResponse = `El Creador de esta pagina es Guillermo Lopez, el gran Inventor, Escritor, Desarrollador, Innovador, Pintor, Escultor, Editor, y Empresario Emprendedor, el fue quien con su conocimiento en desarrollo Web, desarrollo esta innovadora, sofisticada y futurista pagina, empoderada con la mejor y mas poderosa IA de Google.`;
      }
    }

    return res.json({
      userTranscript: userTranscript || '',
      aiResponse: aiResponse || '',
    });
  } catch (_err) {
    return res.status(200).json({ userTranscript: '', aiResponse: '' });
  }
});

// Helper: Wrap 16-bit PCM Little Endian into universal WAV audio container
function pcmToWav(pcmBase64: string, sampleRate = 24000): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]).toString('base64');
}

// Server-side Studio / Neural HD Voice Engine (Natural human cadence, micro-pauses, expressive Spanish)
app.post('/api/gemini/speak-voice', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text required' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini not configured' });
    }

    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'Empty text after cleaning' });
    }

    // Try specialized Studio Neural HD models (gemini-3.8-flash-tts, fallback to gemini-3.8-flash-lite-tts)
    const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
    let pcmBase64 = '';

    for (const modelName of ttsModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: cleanText,
                  speechMetadata: {
                    speaker: 'Quantum AI',
                    style:
                      'Voz Neuronal de Estudio (Studio / Neural HD). Locutor profesional masculino, tono cálido, carismático y sofisticado. Sin sonido robótico ni sintético, con cadencia humana natural, micro-pausas sutiles, entonaciones expresivas según el contexto y pronunciación perfectamente fluida en español.',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Charon' },
              },
            },
          },
        });

        pcmBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
        if (pcmBase64) {
          break;
        }
      } catch (_e) {
        // Fall through to next model cleanly
      }
    }

    if (!pcmBase64) {
      return res.status(500).json({ error: 'No audio generated' });
    }

    // Verify if Gemini audio is already a formatted WAV container
    const firstBytes = Buffer.from(pcmBase64.slice(0, 16), 'base64');
    let finalAudioBase64 = pcmBase64;
    if (firstBytes.slice(0, 4).toString('ascii') !== 'RIFF') {
      finalAudioBase64 = pcmToWav(pcmBase64, 24000);
    }

    return res.json({
      audioBase64: finalAudioBase64,
      mimeType: 'audio/wav',
      voice: 'Studio-Neural-HD',
    });
  } catch (_err) {
    return res.status(500).json({ error: 'TTS generation failed' });
  }
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
