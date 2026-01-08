function cloneAnswerBlock(){
    const output=document.querySelector("#gpt-output");
    const template=document.querySelector("#chat-template");
    const clone=template.cloneNode(true);
    clone.id="";
    output.appendChild(clone);
    clone.classList.remove("hidden");
    return clone.querySelector(".message");

}
function addToLog(message){
    const answerBlock=cloneAnswerBlock();
    answerBlock.innerText=message;
    return answerBlock;
}
function getChatHistory(){
    const messageBlocks=document.querySelectorAll(".message:not(#chat-template .message)");
    return Array.from(messageBlocks).map(block=>block.innerHTML);
}
async  function fetchPromptResponse(){
        const response=await fetch("/prompt",{
        method:"POST" ,
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({"messages":getChatHistory()})

    })
    return response.body.getReader();
}
async function readResponseChunks(reader,answerblocks){
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
        answerblocks.innerHTML=converter.makeHtml(chunks);
        output.scrollTop = output.scrollHeight;
    }
}
document.addEventListener("DOMContentLoaded", ()=>{
    const form=document.querySelector("#prompt-form");
    const SpinnerIcon=document.querySelector("#spinner-icon");
    const sendIcon=document.querySelector("#send-icon");
    form.addEventListener("submit",async (event)=>{
        event.preventDefault();
        SpinnerIcon.classList.remove("hidden");
        sendIcon.classList.add("hidden");
        prompt=form.elements.prompt.value;
        form.elements.prompt.value="";
        addToLog(prompt)
        const answerBlock=addToLog(("..."));
        const reader= await fetchPromptResponse();
        await readResponseChunks(reader,answerBlock);
        SpinnerIcon.classList.add("hidden")
        sendIcon.classList.remove("hidden");
        hljs.highlightAll();

    })


});