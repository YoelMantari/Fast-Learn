/**
 * Servicio de idiomas para FastLearn App
 * Maneja texto-a-voz y procesamiento de conversaciones
 */
class LanguageService {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
  }

  /**
   * Verifica si el navegador soporta síntesis de voz
   */
  isSpeechSynthesisSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Convierte texto a audio usando el TTS nativo del navegador
   */
  async convertTextToSpeech(conversationText, language = 'en-US') {
    if (!this.isSpeechSynthesisSupported()) {
      throw new Error('Tu navegador no soporta síntesis de voz');
    }

    try {
      // Limpiar el texto de la conversación
      const cleanText = this.cleanConversationText(conversationText);
      
      if (!cleanText || cleanText.trim().length === 0) {
        throw new Error('No hay texto válido para convertir a audio');
      }

      return {
        text: cleanText,
        language: language,
        ready: true
      };
    } catch (error) {
      console.error('Error en conversión texto-a-voz:', error);
      throw error;
    }
  }

  /**
   * Inicializa el servicio de idiomas
   */
  initialize() {
    if (!this.isSpeechSynthesisSupported()) {
      console.warn('Síntesis de voz no soportada en este navegador');
      return false;
    }

    try {
      // Cargar voces cuando estén disponibles
      const loadVoices = () => {
        const voices = this.speechSynthesis.getVoices();
        console.log(`Voces disponibles: ${voices.length}`);
        
        if (voices.length > 0) {
          // Buscar voces en inglés
          const englishVoices = voices.filter(voice => 
            voice.lang.includes('en') || voice.lang.includes('EN')
          );
          console.log(`Voces en inglés: ${englishVoices.length}`);
          
          if (englishVoices.length > 0) {
            console.log('Voces en inglés disponibles:', englishVoices.map(v => v.name));
          }
        }
      };

      // Cargar voces inmediatamente si están disponibles
      loadVoices();

      // También escuchar el evento de voces cambiadas
      this.speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return true;
    } catch (error) {
      console.error('Error inicializando servicio de idiomas:', error);
      return false;
    }
  }

  /**
   * Limpia el texto de conversación removiendo elementos no necesarios para el audio
   */
  cleanConversationText(text) {
    if (!text) return '';

    console.log('Texto original para limpiar:', text);

    // Detectar patrones de conversación más amplios
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Patrones para diferentes formatos de conversación
    const conversationPatterns = [
      /^[AB]:\s*.+/,                    // A: ... B: ...
      /^(Person\s+)?[AB]:\s*.+/i,       // Person A: ... Person B: ...
      /^[A-Z][a-z]+:\s*.+/              // Nombre: ... (Isabel:, Hugo:, etc.)
    ];

    // Verificar si alguna línea coincide con patrones de conversación
    const conversationLines = lines.filter(line => {
      return conversationPatterns.some(pattern => pattern.test(line));
    });

    // Si ya tenemos líneas de conversación identificadas, usarlas directamente
    if (conversationLines.length > 0) {
      console.log('Conversación detectada directamente:', conversationLines);
      return conversationLines.join('\n');
    }

    // Limpiar texto más complejo si no se detectó conversación directa
    let cleanText = text
      .replace(/🧠\s*Pregunta\s*\d+/gi, '') // Remover marcadores de pregunta
      .replace(/\[Audio de conversación\]/gi, '') // Remover placeholder de audio
      .replace(/¿.*?\?/g, '') // Remover preguntas en español
      .replace(/[A-D]\.\s*.*/g, '') // Remover opciones completas A, B, C, D
      .replace(/✅\s*Correcta:\s*[A-D]/gi, '') // Remover marcador de respuesta correcta
      .replace(/📋\s*Explicación:.*$/gim, '') // Remover explicación completa
      .replace(/🧾\s*Explicación:.*$/gim, '') // Remover explicación completa (emoji alternativo)
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '') // Remover emojis
      .trim();

    // Intentar extraer líneas de conversación del texto limpio
    const cleanedLines = cleanText.split('\n')
      .map(line => line.trim())
      .filter(line => {
        if (line.length === 0) return false;
        
        // Buscar cualquier patrón de conversación
        return conversationPatterns.some(pattern => pattern.test(line));
      });

    const result = cleanedLines.join('\n');
    console.log('Texto limpio para audio:', result);
    
    // Si no se encontró conversación, devolver el texto original limpio
    if (result.trim().length === 0) {
      console.warn('No se detectó conversación, usando texto limpio original');
      return cleanText.replace(/\s+/g, ' ').trim();
    }
    
    return result;
  }

  /**
   * Reproduce audio usando Web Speech API
   */
  async playAudio(text, language = 'en-US') {
    try {
      // Detener cualquier reproducción anterior
      this.stopAudio();

      const cleanText = this.cleanConversationText(text);
      
      if (!cleanText || cleanText.trim().length === 0) {
        throw new Error('No hay texto válido para reproducir');
      }

      // Esperar a que las voces estén disponibles
      const voices = await this.waitForVoices();

      // Crear nueva utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language;
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Seleccionar la mejor voz disponible
      const bestVoice = this.getBestEnglishVoice(voices);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      // Configurar eventos
      utterance.onstart = () => {
        this.isPlaying = true;
        this.updateAudioStatus('Reproduciendo audio...');
        console.log('Iniciando reproducción de audio');
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.updateAudioStatus('Audio completado');
        this.resetAudioControls();
        console.log('Reproducción de audio completada');
      };

      utterance.onerror = (error) => {
        console.error('Error en reproducción de audio:', error);
        this.isPlaying = false;
        this.isPaused = false;
        this.updateAudioStatus('Error en la reproducción');
        this.resetAudioControls();
      };

      // Iniciar reproducción
      this.currentUtterance = utterance;
      this.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      this.updateAudioStatus('Error: ' + error.message);
      throw error;
    }
  }

  /**
   * Pausa la reproducción de audio
   */
  pauseAudio() {
    try {
      if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
        this.speechSynthesis.pause();
        this.isPaused = true;
        this.updateAudioStatus('Audio pausado');
        console.log('Audio pausado');
      }
    } catch (error) {
      console.error('Error pausando audio:', error);
    }
  }

  /**
   * Reanuda la reproducción de audio
   */
  resumeAudio() {
    try {
      if (this.speechSynthesis.paused) {
        this.speechSynthesis.resume();
        this.isPaused = false;
        this.updateAudioStatus('Reproduciendo audio...');
        console.log('Audio reanudado');
      }
    } catch (error) {
      console.error('Error reanudando audio:', error);
    }
  }

  /**
   * Detiene la reproducción de audio
   */
  stopAudio() {
    try {
      if (this.speechSynthesis.speaking) {
        this.speechSynthesis.cancel();
      }
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.resetAudioControls();
      console.log('Audio detenido');
    } catch (error) {
      console.error('Error deteniendo audio:', error);
    }
  }

  /**
   * Espera a que las voces estén disponibles
   */
  async waitForVoices() {
    return new Promise((resolve) => {
      const voices = this.speechSynthesis.getVoices();
      
      // Si ya hay voces disponibles, resolver inmediatamente
      if (voices.length > 0) {
        console.log('Voces ya disponibles:', voices.length);
        resolve(voices);
        return;
      }

      let resolved = false;
      
      // Timeout para evitar esperar indefinidamente
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('Timeout esperando voces, usando voces por defecto');
          resolve(this.speechSynthesis.getVoices());
        }
      }, 3000);

      // Escuchar evento de voces cargadas
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const newVoices = this.speechSynthesis.getVoices();
          console.log('Voces cargadas:', newVoices.length);
          resolve(newVoices);
        }
      }, { once: true });

      // Intentar forzar la carga de voces después de un breve delay
      setTimeout(() => {
        const forceVoices = this.speechSynthesis.getVoices();
        if (forceVoices.length > 0 && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('Voces forzadas:', forceVoices.length);
          resolve(forceVoices);
        }
      }, 100);
    });
  }

  /**
   * Obtiene la mejor voz disponible para inglés
   */
  getBestEnglishVoice(voices) {
    if (!voices || voices.length === 0) {
      console.warn('No hay voces disponibles');
      return null;
    }

    // Buscar voces en inglés por orden de preferencia
    const englishPatterns = [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en'
    ];

    for (const pattern of englishPatterns) {
      const voice = voices.find(v => 
        v.lang.toLowerCase().includes(pattern.toLowerCase())
      );
      if (voice) {
        console.log(`Usando voz: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }

    // Si no hay voces en inglés, usar la primera disponible
    const fallbackVoice = voices[0];
    console.log(`Usando voz por defecto: ${fallbackVoice.name} (${fallbackVoice.lang})`);
    return fallbackVoice;
  }

  /**
   * Resetea los controles de audio
   */
  resetAudioControls() {
    const playBtn = document.getElementById('btnPlayAudio');
    const pauseBtn = document.getElementById('btnPauseAudio');
    
    if (playBtn) playBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
  }

  /**
   * Actualiza el estado del audio en la interfaz
   */
  updateAudioStatus(message) {
    const statusElement = document.getElementById('audioStatus');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  /**
   * Extrae solo la conversación (A: ... B: ... o Nombre: ...) de un texto de pregunta
   */
  extractConversationFromQuestion(questionText) {
    const lines = questionText.split('\n');
    const conversationLines = [];

    // Patrones para diferentes formatos de conversación
    const conversationPatterns = [
      /^(Person\s+)?[AB]:\s*/i,         // A: ... B: ... o Person A: ... Person B: ...
      /^[A-Z][a-z]+:\s*/                // Nombre: ... (Isabel:, Hugo:, etc.)
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Verificar si la línea coincide con algún patrón de conversación
      if (conversationPatterns.some(pattern => pattern.test(trimmedLine))) {
        conversationLines.push(trimmedLine);
      }
    }

    return conversationLines.join('\n');
  }

  /**
   * Genera preguntas automáticamente desde una conversación simple
   */
  generateQuestionsFromConversation(conversationText) {
    const lines = conversationText.trim().split('\n');
    const questions = [];
    let questionNumber = 1;

    // Buscar patrones de conversación A: ... B: ...
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();

      // Detectar si es un diálogo entre A y B (o Person A y Person B)
      const currentMatch = currentLine.match(/^(Person\s+)?([AB]):\s*(.+)$/i);
      const nextMatch = nextLine?.match(/^(Person\s+)?([AB]):\s*(.+)$/i);

      if (currentMatch && nextMatch && currentMatch[2] !== nextMatch[2]) {
        const speakerA = currentMatch[2].toUpperCase();
        const speakerB = nextMatch[2].toUpperCase();
        const textA = currentMatch[3];
        const textB = nextMatch[3];

        // Generar pregunta de comprensión
        const question = this.createComprehensionQuestion(
          questionNumber,
          speakerA,
          speakerB,
          textA,
          textB
        );

        if (question) {
          questions.push(question);
          questionNumber++;
        }
      }
    }

    return questions;
  }

  /**
   * Crea una pregunta de comprensión basada en un intercambio de diálogo
   */
  createComprehensionQuestion(number, speakerA, speakerB, textA, textB) {
    // Analizar el contenido para crear preguntas más inteligentes
    const questionTypes = [];

    // Detectar tipo de pregunta basado en el contenido
    if (textA.toLowerCase().includes('name') || textA.toLowerCase().includes('called')) {
      questionTypes.push({
        question: `¿Qué preguntó la persona ${speakerA}?`,
        correct: textA,
        wrongOptions: [
          "What's your last name?",
          "What's your favorite color?",
          "Where do you live?"
        ],
        explanation: `La persona ${speakerA} preguntó por el nombre, no por otra información personal.`
      });
    }

    if (textA.toLowerCase().includes('how are you') || textA.toLowerCase().includes('how do you')) {
      questionTypes.push({
        question: `¿Cómo saludó la persona ${speakerA}?`,
        correct: textA,
        wrongOptions: [
          "Good morning!",
          "See you later!",
          "Have a nice day!"
        ],
        explanation: `La persona ${speakerA} usó una forma común de saludo preguntando cómo está la otra persona.`
      });
    }

    if (textB.toLowerCase().includes('well') || textB.toLowerCase().includes('fine') || textB.toLowerCase().includes('good')) {
      questionTypes.push({
        question: `¿Cómo respondió la persona ${speakerB}?`,
        correct: textB,
        wrongOptions: [
          "I'm feeling terrible today",
          "I don't want to talk",
          "I'm very busy right now"
        ],
        explanation: `La persona ${speakerB} dio una respuesta positiva sobre cómo se siente.`
      });
    }

    // Pregunta genérica si no hay tipos específicos
    if (questionTypes.length === 0) {
      questionTypes.push({
        question: `¿Qué dijo la persona ${speakerA}?`,
        correct: textA,
        wrongOptions: [
          "Nice to meet you",
          "Goodbye everyone",
          "Thank you very much"
        ],
        explanation: `La persona ${speakerA} dijo exactamente: "${textA}"`
      });
    }

    // Seleccionar un tipo de pregunta aleatoriamente
    const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    // Crear opciones múltiples mezcladas
    const allOptions = [
      selectedType.correct,
      ...selectedType.wrongOptions
    ];

    // Mezclar y tomar solo 3 opciones
    const shuffledOptions = this.shuffleArray(allOptions).slice(0, 3);
    
    // Asignar letras A, B, C
    const options = shuffledOptions.map((option, index) => ({
      letter: String.fromCharCode(65 + index), // A, B, C
      text: option
    }));

    // Encontrar la letra de la respuesta correcta
    const correctLetter = options.find(opt => opt.text === selectedType.correct).letter;

    return `🧠 Pregunta ${number}

${speakerA}: ${textA}
${speakerB}: ${textB}

${selectedType.question}

A. ${options[0].text}
B. ${options[1].text}
C. ${options[2].text}

✅ Correcta: ${correctLetter}
📋 Explicación: ${selectedType.explanation}`;
  }

  parseAudioQuestions(text) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Verificar si el texto ya está en formato de preguntas (contiene 🧠 Pregunta)
    if (text.includes('🧠 Pregunta')) {
      // Texto ya formateado, parsearlo directamente
      return this.parseFormattedQuestions(text);
    } else {
      // Conversación simple, generar preguntas automáticamente
      const generatedQuestions = this.generateQuestionsFromConversation(text);
      
      if (generatedQuestions.length === 0) {
        console.warn('No se pudieron generar preguntas de la conversación');
        return [];
      }

      // Convertir las preguntas generadas a formato de texto y luego parsearlas
      const formattedText = generatedQuestions.join('\n\n');
      return this.parseFormattedQuestions(formattedText);
    }
  }

  /**
   * Parsea preguntas que ya están en el formato correcto
   */
  parseFormattedQuestions(text) {
    // Usar el mismo parser que las preguntas normales pero agregando audio
    const clean = text.replace(/\*\*/g, "");
    const blocks = clean.split(/🧠 Pregunta\s*\d+/).slice(1);

    return blocks
      .map((block) => {
        const lines = block.trim().split("\n");
        const questionLines = [];
        const options = [];
        let correct = null;
        let explanation = "";
        let inExplanation = false;

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (/^[A-D]\./.test(trimmedLine)) {
            // Options A-D
            const [letter, ...textParts] = trimmedLine.split(".");
            const text = textParts.join(".").trim();
            options.push({ letter, text });
          } else if (
            trimmedLine.startsWith("✅") &&
            trimmedLine.includes("Correcta")
          ) {
            // Correct answer
            correct = trimmedLine.split(":")[1]?.trim();
            inExplanation = false;
          } else if (
            (trimmedLine.startsWith("📋") || trimmedLine.startsWith("🧾")) &&
            trimmedLine.includes("Explicación")
          ) {
            // Explanation
            explanation = trimmedLine.split(":")[1]?.trim() || "";
            inExplanation = true;
          } else if (inExplanation && trimmedLine) {
            // Continuation of explanation
            explanation += " " + trimmedLine;
          } else if (trimmedLine && !trimmedLine.includes('[Audio de conversación]')) {
            // Part of question text (excluding audio placeholder)
            questionLines.push(trimmedLine);
          }
        }

        const questionText = questionLines.join("\n").trim();
        
        // Extraer solo la conversación para el audio
        const conversationText = this.extractConversationFromQuestion(questionText);

        if (questionText && options.length > 0 && correct) {
          return {
            enunciado: questionText,
            opciones: this.shuffleArray(options),
            correcta: correct,
            explicacion: explanation,
            audioText: conversationText || questionText, // Usar conversación extraída o texto completo como fallback
            hasAudio: true
          };
        }

        return null;
      })
      .filter((q) => q !== null);
  }

  /**
   * Mezcla un array (Fisher-Yates shuffle)
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Crear instancia global del servicio de idiomas
window.languageService = new LanguageService();