function cloneAnswerBlock(){
    const output=document.querySelector("#gpt-output");
    const template=document.querySelector("#chat-template");
    const clone=template.cloneNode(true);
    clone.id="";
    clone.classList.remove("hidden");
    
    // Ensure the cloned message has the correct container classes
    const messageContainer = clone.querySelector('.flex');
    messageContainer.classList.add('gap-6', 'w-full', 'max-w-5xl');
    
    // Add to output container which is now centered
    output.appendChild(clone);
    // Return the actual text container, not the avatar
    return clone.querySelector(".text-sm.leading-relaxed");
}

function addToLog(message, isUser = false){
    // Remove welcome screen if it exists
    const welcomeScreen = document.querySelector('.flex.flex-col.items-center.justify-center.h-full');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }
    
    const messageText = cloneAnswerBlock();
    const messageDiv = messageText.closest('.flex');
    const messageAvatar = messageDiv.querySelector('.w-8.h-8');
    
    // Debug: Check if elements exist
    if (!messageText || !messageDiv || !messageAvatar) {
        console.error('Message elements not found:', { messageText, messageDiv, messageAvatar });
        return null;
    }
    
    // Set message type and styling
    if (isUser) {
        messageDiv.classList.add('justify-end', 'flex-row-reverse');
        messageAvatar.classList.add('bg-primary', 'text-primary-foreground');
        messageAvatar.innerHTML = '<i class="fas fa-user"></i>';
        messageText.parentElement.classList.add('bg-primary/10', 'border-primary/20');
    } else {
        messageDiv.classList.add('justify-start');
        messageAvatar.classList.add('bg-secondary', 'text-secondary-foreground');
        messageAvatar.innerHTML = '<i class="fas fa-robot"></i>';
        messageText.parentElement.classList.add('bg-card');
    }
    
    messageText.innerText = message;
    return messageText;
}

function getChatHistory(){
    const messageTexts=document.querySelectorAll(".text-sm.leading-relaxed:not(#chat-template .text-sm.leading-relaxed)");
    return Array.from(messageTexts).map(block=>block.innerText);
}

function setPrompt(text) {
    const promptInput = document.querySelector('#prompt');
    promptInput.value = text;
    promptInput.focus();
    // Auto-resize
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 128) + 'px';
}

function startNewChat() {
    const output = document.querySelector('#gpt-output');
    output.innerHTML = '';
    
    // Add welcome screen back
    const welcomeHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center">
            <div class="mb-8">
                <img src="/static/logo (3).png" alt="FlaskGPT Logo" class="w-48 h-48">
            </div>
            <h1 class="text-3xl font-bold mb-2">Welcome to FlaskGPT</h1>
            <p class="text-muted-foreground mb-8 max-w-md">Your professional AI assistant powered by Google Gemini. Ask me anything, from coding help to creative writing.</p>
            
            <div class="flex flex-wrap gap-2 justify-center max-w-lg">
                <button onclick="setPrompt('Help me write a Python function to...')" class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                    <i class="fas fa-code text-xs"></i>
                    Code Help
                </button>
                <button onclick="setPrompt('Explain machine learning concepts...')" class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                    <i class="fas fa-brain text-xs"></i>
                    Learn ML
                </button>
                <button onclick="setPrompt('Help me debug this error...')" class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                    <i class="fas fa-bug text-xs"></i>
                    Debug Code
                </button>
                <button onclick="setPrompt('Write a story about...')" class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                    <i class="fas fa-pen text-xs"></i>
                    Creative Writing
                </button>
            </div>
        </div>
    `;
    output.innerHTML = welcomeHTML;
    
    // Clear input
    document.querySelector('#prompt').value = '';
    document.querySelector('#prompt').style.height = 'auto';
}
async  function fetchPromptResponse(){
        const response=await fetch("/prompt",{
        method:"POST" ,
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({"messages":getChatHistory()})

    })
    return response.body.getReader();
}
async function readResponseChunks(reader, answerBlock){
    const decoder=new TextDecoder();
    const converter=new showdown.Converter();
    let chunks="";
    const output = document.querySelector("#gpt-output");
    
    while (true){
        const {done,value}=await reader.read();
        if(done){
            break;
        }
        chunks+=decoder.decode(value);
        answerBlock.innerHTML=converter.makeHtml(chunks);
        output.scrollTop = output.scrollHeight;
    }
}

document.addEventListener("DOMContentLoaded", ()=>{
    const form=document.querySelector("#prompt-form");
    const sendButton=document.querySelector("#send-button");
    const promptInput=document.querySelector("#prompt");
    
    // Auto-resize textarea
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 128) + 'px';
    });
    
    form.addEventListener("submit",async (event)=>{
        event.preventDefault();
        console.log('Form submitted');
        
        const prompt = promptInput.value.trim();
        console.log('Prompt:', prompt);
        if (!prompt) return;
        
        // Disable input and show loading state
        sendButton.disabled = true;
        sendButton.innerHTML = '<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
        promptInput.disabled = true;
        
        console.log('Adding user message...');
        // Add user message
        const userMessage = addToLog(prompt, true);
        console.log('User message added:', userMessage);
        
        promptInput.value = "";
        promptInput.style.height = 'auto';
        
        console.log('Adding AI response placeholder...');
        // Add AI response placeholder
        const answerBlock=addToLog("Thinking...");
        console.log('AI placeholder added:', answerBlock);
        
        try {
            console.log('Fetching AI response...');
            const reader= await fetchPromptResponse();
            console.log('Got reader, processing response...');
            await readResponseChunks(reader, answerBlock);
            console.log('Response processed');
            hljs.highlightAll();
        } catch (error) {
            console.error('Error in chat:', error);
            answerBlock.innerHTML = "<span style='color: hsl(var(--destructive));'>Sorry, I encountered an error. Please try again.</span>";
        } finally {
            // Reset UI state
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane text-sm"></i>';
            promptInput.disabled = false;
            promptInput.focus();
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            startNewChat();
        }
    });
});