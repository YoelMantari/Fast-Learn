class FastLearnApp {
    constructor() {
        // GitHub API configuration
        this.githubApiBase = "https://api.github.com/repos/YoelMantari/FastLearnApp/contents";
        this.rawBase = "https://raw.githubusercontent.com/YoelMantari/FastLearnApp/main";
        
        // App state
        this.questions = [];
        this.currentIndex = 0;
        
        // DOM elements
        this.elements = {};
        
        this.init();
    }
    
    init() {
        this.bindElements();
        this.bindEvents();
        this.showScreen('home-screen');
    }
    
    bindElements() {
        // Screens
        this.elements.homeScreen = document.getElementById('home-screen');
        this.elements.questionScreen = document.getElementById('question-screen');
        
        // Buttons
        this.elements.btnGitHub = document.getElementById('btnGitHub');
        this.elements.btnEnviar = document.getElementById('btnEnviar');
        this.elements.btnContinuar = document.getElementById('btnContinuar');
        
        // Question elements
        this.elements.tvPregunta = document.getElementById('tvPregunta');
        this.elements.rgOpciones = document.getElementById('rgOpciones');
        this.elements.tvFeedback = document.getElementById('tvFeedback');
        this.elements.tvExplicacion = document.getElementById('tvExplicacion');
        
        // Modal elements
        this.elements.directoryModal = document.getElementById('directoryModal');
        this.elements.modalTitle = document.getElementById('modalTitle');
        this.elements.modalClose = document.getElementById('modalClose');
        this.elements.directoryList = document.getElementById('directoryList');
        
        // Loading and toast
        this.elements.loading = document.getElementById('loading');
        this.elements.toast = document.getElementById('toast');
        this.elements.toastMessage = document.getElementById('toastMessage');
    }
    
    bindEvents() {
        this.elements.btnGitHub.addEventListener('click', () => this.listDirectory(''));
        this.elements.btnEnviar.addEventListener('click', () => this.checkAnswer());
        this.elements.btnContinuar.addEventListener('click', () => this.nextQuestion());
        this.elements.modalClose.addEventListener('click', () => this.hideModal());
        
        // Close modal when clicking outside
        this.elements.directoryModal.addEventListener('click', (e) => {
            if (e.target === this.elements.directoryModal) {
                this.hideModal();
            }
        });
        
        // Handle option selection using event delegation for better touch support
        this.elements.rgOpciones.addEventListener('click', (e) => {
            // Find closest option if we clicked anywhere in the option area
            const optionDiv = e.target.closest('.option');
            if (optionDiv && !optionDiv.classList.contains('disabled')) {
                // Find the radio within the div
                const radio = optionDiv.querySelector('input[type="radio"]');
                if (radio && !radio.disabled) {
                    // Check the radio
                    radio.checked = true;
                    
                    // Enable submit button
                    this.elements.btnEnviar.disabled = false;
                    
                    // Update the visual selection
                    this.updateOptionSelection(radio);
                }
            }
        });
        
        // Also keep the original change handler for direct radio button interactions
        this.elements.rgOpciones.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.elements.btnEnviar.disabled = false;
                this.updateOptionSelection(e.target);
            }
        });
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
    }
    
    showLoading() {
        this.elements.loading.classList.remove('hidden');
    }
    
    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }
    
    showModal() {
        this.elements.directoryModal.classList.remove('hidden');
    }
    
    hideModal() {
        this.elements.directoryModal.classList.add('hidden');
    }
    
    showToast(message, duration = 3000) {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.toast.classList.add('hidden');
        }, duration);
    }
    
    async listDirectory(path) {
        this.showLoading();
        
        try {
            const apiUrl = path ? `${this.githubApiBase}/${path}` : this.githubApiBase;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const items = data.map(item => ({
                name: item.name,
                type: item.type,
                downloadUrl: item.download_url || ''
            }));
            
            this.hideLoading();
            this.showDirectoryDialog(path, items);
            
        } catch (error) {
            console.error('Error reading GitHub:', error);
            this.hideLoading();
            this.showToast('Error leyendo GitHub');
        }
    }
    
    showDirectoryDialog(path, items) {
        this.elements.modalTitle.textContent = path || 'Repositorio raíz';
        this.elements.directoryList.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'directory-item';
            
            const icon = document.createElement('span');
            icon.className = 'icon';
            icon.textContent = item.type === 'dir' ? '📁' : '📄';
            
            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = item.name;
            
            itemElement.appendChild(icon);
            itemElement.appendChild(name);
            
            itemElement.addEventListener('click', () => {
                this.handleDirectoryItemClick(path, item);
            });
            
            this.elements.directoryList.appendChild(itemElement);
        });
        
        this.showModal();
    }
    
    handleDirectoryItemClick(currentPath, item) {
        this.hideModal();
        
        if (item.type === 'dir' && item.name) {
            const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            this.listDirectory(newPath);
        } else if (item.type === 'file' && (item.name.endsWith('.txt') || item.name.endsWith('.md'))) {
            this.loadFromUrl(item.downloadUrl);
        } else {
            this.showToast('Solo .txt, .md o carpetas');
        }
    }
    
    async loadFromUrl(rawUrl) {
        this.showLoading();
        
        try {
            const response = await fetch(rawUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            this.questions = this.shuffle(this.parseQuestions(text));
            this.currentIndex = 0;
            
            this.hideLoading();
            
            if (this.questions.length === 0) {
                this.showToast('Sin preguntas válidas');
            } else {
                this.elements.btnEnviar.disabled = false;
                this.showScreen('question-screen');
                this.showQuestion();
            }
            
        } catch (error) {
            console.error('Error downloading file:', error);
            this.hideLoading();
            this.showToast('Error descargando archivo');
        }
    }
    
    parseQuestions(text) {
        // Remove markdown bold markers
        const clean = text.replace(/\*\*/g, '');
        
        // Split by question blocks
        const blocks = clean.split(/🧠 Pregunta\s*\d+/).slice(1);
        
        return blocks.map(block => {
            const lines = block.trim().split('\n');
            const questionLines = [];
            const options = [];
            let correct = null;
            let explanation = '';
            let inExplanation = false;
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (/^[A-D]\./.test(trimmedLine)) {
                    // Options A-D
                    const [letter, ...textParts] = trimmedLine.split('.');
                    const text = textParts.join('.').trim();
                    options.push({ letter, text });
                } else if (trimmedLine.startsWith('✅') && trimmedLine.includes('Correcta')) {
                    // Correct answer
                    correct = trimmedLine.split(':')[1]?.trim();
                    inExplanation = false;
                } else if (trimmedLine.startsWith('🧾') && trimmedLine.includes('Explicación')) {
                    // Explanation
                    explanation = trimmedLine.split(':')[1]?.trim() || '';
                    inExplanation = true;
                } else if (inExplanation && trimmedLine) {
                    // Continuation of explanation
                    explanation += ' ' + trimmedLine;
                } else if (trimmedLine) {
                    // Part of question text
                    questionLines.push(trimmedLine);
                }
            }
            
            const questionText = questionLines.join('\n').trim();
            
            if (questionText && options.length > 0 && correct) {
                return {
                    enunciado: questionText,
                    opciones: this.shuffle(options),
                    correcta: correct,
                    explicacion: explanation
                };
            }
            
            return null;
        }).filter(q => q !== null);
    }
    
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    showQuestion() {
        const question = this.questions[this.currentIndex];
        
        // Set question text
        this.elements.tvPregunta.textContent = question.enunciado;
        
        // Clear feedback
        this.elements.tvFeedback.textContent = '';
        this.elements.tvFeedback.className = 'feedback';
        this.elements.tvExplicacion.textContent = '';
        
        // Hide continue button and enable submit
        this.elements.btnContinuar.style.display = 'none';
        this.elements.btnEnviar.disabled = true;
        
        // Clear and populate options
        this.elements.rgOpciones.innerHTML = '';
        
        question.opciones.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.setAttribute('data-letter', option.letter);
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'opciones';
            radio.value = option.letter;
            radio.id = `option-${index}`;
            
            const label = document.createElement('label');
            label.htmlFor = `option-${index}`;
            label.className = 'option-text';
            label.textContent = `${option.letter}. ${option.text}`;
            
            optionDiv.appendChild(radio);
            optionDiv.appendChild(label);
            
            // Make the whole div clickable - improved for mobile touch
            optionDiv.addEventListener('click', (e) => {
                if (!radio.disabled) {
                    // Even if we click on the label or the div itself, select the radio
                    radio.checked = true;
                    
                    // Trigger the change event to update the UI
                    const changeEvent = new Event('change', { bubbles: true });
                    radio.dispatchEvent(changeEvent);
                    
                    // Enable the submit button
                    this.elements.btnEnviar.disabled = false;
                    
                    // Update selection visually
                    this.updateOptionSelection(radio);
                }
            });
            
            this.elements.rgOpciones.appendChild(optionDiv);
        });
    }
    
    updateOptionSelection(selectedRadio) {
        // Update visual selection
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Find the parent option div and add selected class
        if (selectedRadio && selectedRadio.closest) {
            const optionDiv = selectedRadio.closest('.option');
            if (optionDiv) {
                optionDiv.classList.add('selected');
            }
        }
    }
    
    checkAnswer() {
        const selectedRadio = this.elements.rgOpciones.querySelector('input[name="opciones"]:checked');
        
        if (!selectedRadio) {
            this.showToast('Selecciona una opción');
            return;
        }
        
        const selectedLetter = selectedRadio.value;
        const question = this.questions[this.currentIndex];
        
        // Disable all options
        document.querySelectorAll('.option').forEach(option => {
            option.classList.add('disabled');
        });
        document.querySelectorAll('input[name="opciones"]').forEach(radio => {
            radio.disabled = true;
        });
        
        this.elements.btnEnviar.disabled = true;
        
        // Show feedback
        if (selectedLetter === question.correcta) {
            this.elements.tvFeedback.textContent = '✓ Correcto';
            this.elements.tvFeedback.className = 'feedback correct';
        } else {
            this.elements.tvFeedback.textContent = `✗ Incorrecto. La correcta es ${question.correcta}`;
            this.elements.tvFeedback.className = 'feedback incorrect';
        }
        
        // Show explanation
        this.elements.tvExplicacion.textContent = question.explicacion;
        
        // Show continue button
        this.elements.btnContinuar.style.display = 'block';
    }
    
    nextQuestion() {
        this.currentIndex++;
        
        if (this.currentIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showToast('¡Has completado todas las preguntas!', 5000);
            // Return to home screen
            setTimeout(() => {
                this.showScreen('home-screen');
                this.questions = [];
                this.currentIndex = 0;
            }, 2000);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FastLearnApp();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
