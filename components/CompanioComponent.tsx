"use client";

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk'
import Lottie, { LottieRef, LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import soundwaves from "@/constants/soundwaves.json"
import { addToSessionHistory } from '@/lib/actions/companion.actions';

enum CallStatus {
    INACTIVE = "INACTIVE",
    FINISHED = "FINISHED",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
}

const CompanioComponent = ({companionId, userName, userImage,name, topic, subject, style, voice} : CompanionComponentProps) => {
  
    const[callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const[isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const messagesRef = useRef<SavedMessage[]>([]); // Ref to keep track of messages for event listeners


    const toggleCall = ()=>{
        //togglling the call
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
    }

    const handleCall = async()=>{
        setCallStatus(CallStatus.CONNECTING);
        
        const assisstantOverrides ={
            variableValues : {subject,topic,style},
            clientMessages : ["transcript"] as any,
            serverMessages : [] as any,
        }
        vapi.start(configureAssistant(voice, style), assisstantOverrides)
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


    return (
    <section className='flex flex-col h-[70vh]'>
        <section className='flex gap-8 max-sm:flex-col'>
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
                <button className='btn-mic' onClick={toggleCall}  aria-disabled={callStatus!== CallStatus.ACTIVE} disabled={callStatus!== CallStatus.ACTIVE}>
                        <Image src={isMuted? "/icons/mic-off.svg" : "/icons/mic-on.svg"} alt="mic" width={36} height={36}/>
                        <p className='max-sm:hidden'>{isMuted? "Unmute" : "Mute"}</p>
                </button>
                {callStatus === CallStatus.INACTIVE ? (
                 <button 
                 className='relative inline-block overflow-hidden z-1 w-full text-lg cursor-pointer rounded-lg bg-[#e8e8e8] border border-[#e8e8e8] shadow-[6px_6px_12px_#c5c5c5,-6px_-6px_12px_#ffffff] text-[#090909] py-[0.7em] px-[1.7em] transition-all duration-200 ease-in group hover:text-white hover:border-[#009087] active:text-[#666] active:shadow-[inset_4px_4px_12px_#c5c5c5,inset_-4px_-4px_12px_#ffffff]'
                 onClick={handleCall}>
                     <span className="relative z-10 flex items-center justify-center gap-2">
                         Start Session
                     </span>
                     <span className="absolute left-1/2 top-full w-[140%] h-[180%] -translate-x-1/2 scale-x-125 bg-black/5 rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[35%] group-hover:bg-[#009087] group-hover:scale-y-130 group-hover:scale-x-80" />
                     <span className="absolute left-[55%] top-[180%] w-[160%] h-[190%] -translate-x-1/2 scale-x-145 bg-[#009087] rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[45%] group-hover:bg-[#009087] group-hover:scale-y-130 group-hover:scale-x-80" />
                 </button>
                ) : (
                <button className={cn("rounded-lg py-2 cursor-pointer transition-colors w-full text-white",callStatus == CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', callStatus === CallStatus.CONNECTING && "animate-pulse")}
                onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}>
                        {callStatus === CallStatus.ACTIVE ? "End Session" : "Connecting..."}
                </button>
                )}

            </div>

        </section>

        <section className='transcript' >
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
    
  )
}

export default CompanioComponent