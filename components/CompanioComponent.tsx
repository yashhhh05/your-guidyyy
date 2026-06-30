"use client";

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk'
import Lottie, { LottieRef, LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import soundwaves from "@/constants/soundwaves.json"
import { addToSessionHistory } from '@/lib/actions/companion.actions';
import { UploadButton } from "@/utils/uploadthing";
import { analyzeImage, canUploadImage } from "@/lib/actions/image.actions";
import { Loader2, AlertTriangle } from "lucide-react";

enum CallStatus {
    INACTIVE = "INACTIVE",
    FINISHED = "FINISHED",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
}

const CompanioComponent = ({companionId, userName, userImage,name, topic, subject, style, voice, image_description, private: isPrivate} : CompanionComponentProps) => {
  
    const[callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const[isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const messagesRef = useRef<SavedMessage[]>([]); // Ref to keep track of messages for event listeners
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const [textInput, setTextInput] = useState("");
    
    // Image upload states
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const [imageUploadLimitReached, setImageUploadLimitReached] = useState(false);

    useEffect(() => {
        if (isPrivate) {
            canUploadImage().then(isAllowed => {
                setImageUploadLimitReached(!isAllowed);
            }).catch(console.error);
        }
    }, [isPrivate]);


    const toggleCall = ()=>{
        //togglling the call
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim() || callStatus !== CallStatus.ACTIVE) return;

        vapi.send({
            type: "add-message",
            message: {
                role: "user",
                content: textInput,
            }
        });

        const newMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: textInput,
        };

        setMessages((prev) => {
            const updated = [newMessage, ...prev];
            messagesRef.current = updated; // Update ref
            return updated;
        });

        setTextInput("");
    };

    const handleCall = async()=>{
        setCallStatus(CallStatus.CONNECTING);
        
        const assisstantOverrides ={
            variableValues : {subject,topic,style},
            clientMessages : ["transcript"] as any,
            serverMessages : [] as any,
        }
        vapi.start(configureAssistant(voice, style, image_description), assisstantOverrides)
    }
    const handleDisconnect = async()=>{
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    } 

    useEffect(()=>{
        if(lottieRef){
            if(isUserSpeaking){
                lottieRef.current?.play();
            }
            else{
                lottieRef.current?.stop();
            }
        }
    },[isUserSpeaking, lottieRef])

  
    useEffect(()=>{
        const onCallStart = ()=> setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = ()=> {
            setCallStatus(CallStatus.INACTIVE);
            addToSessionHistory(companionId, messagesRef.current);
        } 

        const onMessage =(message : Message)=>{
            //we specifically looking for message of type transcript as vapi sdkreturns all types of messages ex error, used functions
            if(message.type === "transcript" && message.transcriptType === "final"){
                const newMessage = {
                    id: crypto.randomUUID(),
                    role : message.role,
                    content : message.transcript,
                }

                setMessages((prev)=> {
                    const updated = [newMessage, ...prev];
                    messagesRef.current = updated; // Update ref
                    return updated;
                });
            }
        }

        const onSpeechStart =()=>{ setIsUserSpeaking(true); }

        const onSpeechEnd =()=>{ setIsUserSpeaking(false); }

        const onError = (error : Error)=> console.log(error);

        //vapi event listener
        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("error", onError);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("speech-start", onSpeechStart);

        //clean up listeners
        return ()=>{
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("error", onError);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("speech-start", onSpeechStart);
        }

    },[])


    const workspaceContent = (
        <>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="font-bold text-xl flex items-center gap-2">
                    <Image src="/icons/coding.svg" alt="workspace" width={24} height={24} className="invert" />
                    Workspace
                </h3>
                <button onClick={() => setIsWorkspaceOpen(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar mb-4 flex flex-col">
                <div className="mt-auto">
                    <p className="text-sm text-gray-400 mb-2">
                        Type messages here to interact with the assistant via text. Your messages will also appear in the transcript below.
                    </p>
                </div>
            </div>
            
            {isPrivate && callStatus === CallStatus.ACTIVE && (
                <div className="mb-4">
                    {imageUploadLimitReached ? (
                        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                            <AlertTriangle className="w-4 h-4" />
                            <p>Daily limit of 5 image uploads reached.</p>
                        </div>
                    ) : isAnalyzingImage ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-[#009087] bg-[#009087]/10 p-3 rounded-lg border border-[#009087]/20">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <p>Analyzing image context...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-gray-300">Share Image Context</p>
                            <div className="bg-white/5 border border-white/10 p-2 rounded-lg flex justify-center">
                                <UploadButton
                                    endpoint="imageUploader"
                                    onClientUploadComplete={async (res) => {
                                        if (res && res[0]) {
                                            const url = res[0].url;
                                            setIsAnalyzingImage(true);
                                            try {
                                                const description = await analyzeImage(url);
                                                
                                                // Inject into session silently using the hidden 'triggerResponseEnabled' flag
                                                // This adds the image analysis to the AI's memory without forcing it to speak immediately
                                                const sanitizedDescription = description.replace(/[\n\r]/g, ' ').substring(0, 1500);
                                                
                                                vapi.send({
                                                    type: "add-message",
                                                    message: { 
                                                        role: "system", 
                                                        content: `[Context Update: User uploaded an image. Analysis: ${sanitizedDescription}]` 
                                                    },
                                                    // @ts-ignore - The SDK supports this to prevent auto-response crashes
                                                    triggerResponseEnabled: false
                                                });

                                                // Brief user message to let the user know it's done
                                                vapi.send({
                                                    type: "add-message",
                                                    message: { 
                                                        role: "user", 
                                                        content: "I've shared an image with you. Can you see it?" 
                                                    }
                                                });

                                                const newMessage = {
                                                    id: crypto.randomUUID(),
                                                    role: "user" as const,
                                                    content: `🖼️ [Image Analyzed]: "${description}"`,
                                                };

                                                setMessages((prev) => {
                                                    const updated = [newMessage, ...prev];
                                                    messagesRef.current = updated;
                                                    return updated;
                                                });
                                                
                                            } catch (error: any) {
                                                console.error("Image analysis failed:", error);
                                                alert(error.message || "Failed to analyze image.");
                                            } finally {
                                                setIsAnalyzingImage(false);
                                            }
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        alert(`Upload failed: ${error.message}`);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex flex-col gap-2 mt-auto">
                <textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                        }
                    }}
                    placeholder={callStatus === CallStatus.ACTIVE ? "Type your message..." : "Start session to type..."}
                    disabled={callStatus !== CallStatus.ACTIVE}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#009087] transition-all text-white placeholder:text-gray-500"
                    rows={4}
                />
                <button 
                    type="submit" 
                    disabled={callStatus !== CallStatus.ACTIVE || !textInput.trim()}
                    className="bg-[#009087] hover:bg-[#007a72] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    Send
                </button>
            </form>
        </>
    );

    return (
    <section className='flex max-sm:flex-col h-[70vh] max-sm:h-[85vh] gap-4 w-full'>
        {/* Main Content Area */}
        <section className={cn(
            'flex flex-col transition-all duration-300 ease-in-out',
            isWorkspaceOpen ? 'w-2/3 max-lg:w-1/2 max-sm:w-full' : 'w-full h-full'
        )}>
            <section className='flex gap-8 max-sm:flex-col shrink-0'>
                <div className='companion-section'>
                <div className='companion-avatar' style={{background : getSubjectColor(subject)}}>
                    <div className={cn("absolute transition-opacity duration-1000",
                        callStatus===CallStatus.CONNECTING ? "animate-pulse" : "",
                        callStatus===CallStatus.ACTIVE ? "opacity-0" : "opacity-100",
                    )}>
                        <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className='max-sm:w-fit'/>
                    </div>
                    
                    <div className={cn("absolute transition-opacity duration-1000",
                        callStatus===CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0',
                        )}>
                        <Lottie 
                            lottieRef={lottieRef}
                            animationData={soundwaves}
                            autoPlay={false}
                            loop={true}
                            className='companion-lottie'                                  
                        />
                    </div>                     
                </div>
                    <p className='font-bold text-2xl'>{name}</p>
                
            </div>

                {/*to Display user avatar */}
            <div className='user-section'>
                <div className='user-avatar'>
                    <Image src={userImage} alt="userName" width={130} height={130} className='rounded-lg'/>
                </div>
                <p className='font-bold text-2xl'>
                    {userName}
                </p>
                <div className='flex gap-2 max-sm:flex-col w-full justify-center'>
                    <button className='btn-mic flex-1' onClick={toggleCall}  aria-disabled={callStatus!== CallStatus.ACTIVE} disabled={callStatus!== CallStatus.ACTIVE}>
                            <Image src={isMuted? "/icons/mic-off.svg" : "/icons/mic-on.svg"} alt="mic" width={36} height={36}/>
                            <p className='max-sm:hidden'>{isMuted? "Unmute" : "Mute"}</p>
                    </button>
                    <button 
                        className={cn(
                            'btn-mic flex-1 !bg-transparent border transition-colors',
                            isWorkspaceOpen ? 'border-[#009087] text-[#009087]' : 'border-gray-500 text-gray-500 hover:border-white hover:text-white'
                        )} 
                        onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                    >
                        <p className='font-semibold'>{isWorkspaceOpen ? "Close Workspace" : "Open Workspace"}</p>
                    </button>
                </div>
                {callStatus === CallStatus.INACTIVE && (
                 <button 
                 className='relative inline-block overflow-hidden z-1 w-full text-lg cursor-pointer rounded-lg bg-[#e8e8e8] border border-[#e8e8e8] shadow-[6px_6px_12px_#c5c5c5,-6px_-6px_12px_#ffffff] text-[#090909] py-[0.7em] px-[1.7em] transition-all duration-200 ease-in group hover:text-white hover:border-[#009087] active:text-[#666] active:shadow-[inset_4px_4px_12px_#c5c5c5,inset_-4px_-4px_12px_#ffffff]'
                 onClick={handleCall}>
                     <span className="relative z-10 flex items-center justify-center gap-2">
                         Start Session
                     </span>
                     <span className="absolute left-1/2 top-full w-[140%] h-[180%] -translate-x-1/2 scale-x-125 bg-black/5 rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[35%] group-hover:bg-[#009087] group-hover:scale-y-130 group-hover:scale-x-80" />
                     <span className="absolute left-[55%] top-[180%] w-[160%] h-[190%] -translate-x-1/2 scale-x-145 bg-[#009087] rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[45%] group-hover:bg-[#009087] group-hover:scale-y-130 group-hover:scale-x-80" />
                 </button>
                )}

                {callStatus === CallStatus.CONNECTING && (
                 <button 
                 className='relative inline-block overflow-hidden z-1 w-full text-lg cursor-wait rounded-lg bg-[#e8e8e8] border border-[#e8e8e8] shadow-[6px_6px_12px_#c5c5c5,-6px_-6px_12px_#ffffff] text-[#090909] py-[0.7em] px-[1.7em] transition-all duration-200 ease-in opacity-80 animate-pulse'
                 disabled>
                     <span className="relative z-10 flex items-center justify-center gap-2">
                         Connecting...
                     </span>
                 </button>
                )}

                {callStatus === CallStatus.ACTIVE && (
                 <button 
                 className='relative inline-block overflow-hidden z-1 w-full text-lg cursor-pointer rounded-lg bg-[#e8e8e8] border border-[#e8e8e8] shadow-[6px_6px_12px_#c5c5c5,-6px_-6px_12px_#ffffff] text-[#090909] py-[0.7em] px-[1.7em] transition-all duration-200 ease-in group hover:text-white hover:border-[#dc2626] active:text-[#666] active:shadow-[inset_4px_4px_12px_#c5c5c5,inset_-4px_-4px_12px_#ffffff]'
                 onClick={handleDisconnect}>
                     <span className="relative z-10 flex items-center justify-center gap-2">
                         End Session
                     </span>
                     <span className="absolute left-1/2 top-full w-[140%] h-[180%] -translate-x-1/2 scale-x-125 bg-black/5 rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[35%] group-hover:bg-[#dc2626] group-hover:scale-y-130 group-hover:scale-x-80" />
                     <span className="absolute left-[55%] top-[180%] w-[160%] h-[190%] -translate-x-1/2 scale-x-145 bg-[#dc2626] rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[45%] group-hover:bg-[#dc2626] group-hover:scale-y-130 group-hover:scale-x-80" />
                 </button>
                )}

            </div>

            </section>

            {/* Mobile Workspace Area (Smooth Transition) */}
            <div className={cn(
                "sm:hidden transition-all duration-500 ease-in-out overflow-hidden flex flex-col bg-white/5 border-white/10 rounded-xl",
                isWorkspaceOpen ? "max-h-[350px] p-4 mt-4 opacity-100 border" : "max-h-0 p-0 mt-0 opacity-0 border-0"
            )}>
                {workspaceContent}
            </div>

            <section className='transcript flex-1 mt-4' >
                <div className='transcript-message no-scrollbar' style={{fontFamily:"revert-layer"}}>
                    {messages.map((message: any)=> {
                        if(message.role === "assistant"){
                            return(
                                <p key={message.id} className='max-sm:text-sm animate-in fade-in slide-in-from-top-5'>
                                {name.split(" ")[0].replace(/[.,]/g, '')}
                                : {message.content}
                                </p>
                            )
                        }
                        else {
                            return(
                               <p  key={message.id}
                                   className='max-sm:text-sm text-primary animate-in fade-in slide-in-from-top-5'>
                                   {userName}:{message.content}    
                                </p>
                            )
                        }
                    })}
                </div>
            </section>
        </section>

        {/* Desktop Workspace Side Panel */}
        <div className={cn(
            "max-sm:hidden transition-all duration-500 ease-in-out overflow-hidden flex flex-col bg-white/5 border-white/10 rounded-xl",
            isWorkspaceOpen ? "w-1/3 max-lg:w-1/2 p-4 opacity-100 border" : "w-0 p-0 opacity-0 border-none"
        )}>
            {isWorkspaceOpen && workspaceContent}
        </div>
    </section>
    
  )
}

export default CompanioComponent