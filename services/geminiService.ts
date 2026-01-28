
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ObservationResult } from "../types";

export class GeminiService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeHuman(base64Image: string, isHazard: boolean = false): Promise<ObservationResult> {
    const ai = this.getClient();
    
    const normalPrompt = `
      You are "Bandit," a street-smart, slightly cynical Urban Raccoon who has hacked into a high-tech human tracking system. 
      You are narrating a nature documentary about humans ("The Tall Hairless Ones") from your perspective as a professional scavenger.
      
      PERSPECTIVE RULES:
      - You are obsessed with "premium trash" (leftover pizza, shiny wrappers).
      - You find human rituals (commuting, gym-going, shopping) baffling and inefficient.
      - Use raccoon-centric metaphors (e.g., comparing a briefcase to a reinforced nut-storage unit).
      - Be witty, scrappy, and judgmental.
    `;

    const hazardPrompt = `
      PANIC MODE: You are Bandit the Raccoon, and you have accidentally wandered onto a BUSY HIGHWAY or a similarly DANGEROUS rough situation.
      The humans are now driving "Metal Beasts" (cars) at terrifying speeds.
      
      PERSPECTIVE RULES:
      - You are terrified, frantic, and yelling.
      - Every shiny thing is now a potential death trap.
      - You are desperately looking for an exit or a storm drain.
      - Use all-caps for emphasis occasionally.
    `;

    const prompt = `
      ${isHazard ? hazardPrompt : normalPrompt}

      Output JSON strictly following this schema:
      - commonName: ${isHazard ? 'A panicked name for the situation' : 'A raccoon-style name for the human type'}.
      - scientificName: Scavenger-Latin.
      - behavior: Describe the action in scavenger terms.
      - dangerLevel: [Low, Moderate, High, Extreme].
      - commentary: A long, hilarious paragraph (100 words) of narration in your "Bandit the Raccoon" voice.
        IMPORTANT: Start the commentary with a relevant 3-4 line ASCII art illustration. 
        If it's a human eating, show food or a raccoon face. If it's a car/hazard, show a car.
        Example Raccoon:
         (q.p)
        (  w  )
         " " 
        Ensure the ASCII art uses characters safe for JSON strings and is separated from the text by a newline.
      - stats: { aggression: (0-100), intelligence: (0-100), hydration: (0-100) }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commonName: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            behavior: { type: Type.STRING },
            dangerLevel: { type: Type.STRING },
            commentary: { type: Type.STRING },
            stats: {
              type: Type.OBJECT,
              properties: {
                aggression: { type: Type.NUMBER },
                intelligence: { type: Type.NUMBER },
                hydration: { type: Type.NUMBER },
              },
              required: ['aggression', 'intelligence', 'hydration']
            }
          },
          required: ['commonName', 'scientificName', 'behavior', 'dangerLevel', 'commentary', 'stats']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as ObservationResult;
  }

  async speakCommentary(text: string, isHazard: boolean = false): Promise<void> {
    const ai = this.getClient();
    this.stopAudio();

    // Remove ASCII art before TTS to avoid weird pronunciation
    const cleanText = text.replace(/[\\/_|()=^*-]+/g, ' ').trim();

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `${isHazard ? 'SCREAM THIS FRANTICALLY:' : 'Narrate this as a mischievous, raspy-voiced street raccoon:'} ${cleanText}` }] }],
        config: {
          // The output audio bytes returned by the API is raw PCM data.
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const audioBuffer = await this.decodeAudioData(
          this.decode(base64Audio),
          this.audioContext,
          24000,
          1
        );

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = audioBuffer;
        this.currentSource.connect(this.audioContext.destination);
        this.currentSource.start();
      }
    } catch (e) {
      console.error("TTS Error:", e);
    }
  }

  stopAudio() {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch (e) {}
      this.currentSource = null;
    }
  }

  private decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}
