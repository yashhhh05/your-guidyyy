"use client";

import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { generateStudyNotes, getSessionNotes } from "@/lib/actions/study.actions";
import { Loader2, Sparkles, BookOpen, Brain, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Flashcard } from "./Flashcard";
import { toast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


interface StudyTabProps {
    sessionId: string;
}

export const StudyTab = ({ sessionId }: StudyTabProps) => {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatingType, setGeneratingType] = useState<'summary' | 'flashcard' | null>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const data = await getSessionNotes(sessionId);
                setNotes(data || []);
            } catch (error) {
                console.error("Failed to load notes", error);
            }
        };
        if(sessionId) fetchNotes();
    }, [sessionId]);

    const handleGenerate = async (type: 'summary' | 'flashcard') => {
        setLoading(true);
        setGeneratingType(type);
        try {
            const result = await generateStudyNotes(sessionId, type);
            
            if (result.success && result.data) {
                setNotes((prev) => [result.data, ...prev]);
                toast({
                    title: "Study Material Generated",
                    description: `Successfully created ${type === 'summary' ? 'summary' : 'flashcards'}.`
                });
            } else {
                // Handle specific error codes return by server action
                if (result.error === "NO_CONTENT") {
                    toast({
                        variant: "default", 
                        className: "bg-orange-100 border-orange-200 text-orange-800",
                        title: "Not enough content",
                        description: "This session doesn't have enough educational content to generate notes yet. Try discussing a topic first!"
                    });
                } else {
                     toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to generate study materials. Please try again."
                    });
                }
            }
        } catch (error) {
            console.error("Unexpected error", error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred."
            })
        } finally {
            setLoading(false);
            setGeneratingType(null);
        }
    };


    const summaries = notes.filter(n => n.type === 'summary');
    const flashcardSets = notes.filter(n => n.type === 'flashcard');

    return (
        <TabsContent value="study" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Empty State / Call to Action */}
            {notes.length === 0 && !loading && (
                 <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <div className="bg-indigo-50 p-4 rounded-full mb-6">
                        <Brain className="w-12 h-12 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Generate Study Materials</h3>
                    <p className="text-muted-foreground max-w-md mb-8 text-lg">
                        Turn this conversation into concise summaries or flashcards to verify your learning.
                    </p>
                    <div className="flex gap-4">
                         <Button size="lg" onClick={() => handleGenerate('summary')} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            <BookOpen className="w-5 h-5 mr-2" />
                            {loading && generatingType === 'summary' ? "Generating..." : "Generate Summary"}
                        </Button>
                         <Button size="lg" variant="outline" onClick={() => handleGenerate('flashcard')} disabled={loading} className="border-slate-300 hover:bg-slate-50 text-slate-700">
                            <RefreshCw className="w-5 h-5 mr-2" />
                            {loading && generatingType === 'flashcard' ? "Generating..." : "Generate Flashcards"}
                        </Button>
                    </div>
                 </div>
            )}

             {/* Generation Toolbar (If notes exist) */}
             {notes.length > 0 && (
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                     <p className="text-sm text-muted-foreground font-medium">Study Aids</p>
                     <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleGenerate('summary')} disabled={loading} className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                            <Sparkles className="w-4 h-4 mr-2" />
                            New Summary
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerate('flashcard')} disabled={loading} className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                            <Sparkles className="w-4 h-4 mr-2" />
                            New Flashcards
                        </Button>
                    </div>
                </div>
             )}

            {/* Summaries Section */}
            <div className="space-y-6">
                {summaries.map((note) => (
                    <div key={note.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center text-slate-800">
                                <span className="bg-indigo-100 p-2 rounded-lg mr-3">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                </span>
                                Session Summary
                            </h3>
                            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-500 rounded-full">
                                {new Date(note.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <ul className="space-y-4">
                            {/* Handle both "notes" object wrapper and direct array if legacy data exists */}
                            {(note.content.notes || note.content).map((point: string, i: number) => (
                                <li key={i} className="flex gap-4 items-start text-base text-slate-600 leading-relaxed">
                                    <span className="min-w-[8px] h-2 w-2 rounded-full bg-indigo-400 mt-2.5 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Flashcards Section */}
            <div className="space-y-8">
                {flashcardSets.map((note) => (
                    <div key={note.id} className="space-y-6">
                         <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold flex items-center text-slate-800">
                                <span className="bg-emerald-100 p-2 rounded-lg mr-3">
                                    <RefreshCw className="w-5 h-5 text-emerald-600" />
                                </span>
                                Flashcard Deck
                            </h3>
                            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-500 rounded-full">
                                {new Date(note.created_at).toLocaleDateString()} - {(note.content.notes || note.content).length} cards
                            </span>
                        </div>
                        
                        <Carousel className="w-full max-w-lg mx-auto pb-4">
                            <CarouselContent>
                                {(note.content.notes || note.content).map((card: any, i: number) => (
                                    <CarouselItem key={i} className="p-4">
                                        <Flashcard question={card.question} answer={card.answer} />
                                        <div className="text-center text-xs font-medium text-slate-400 mt-4 tracking-wider uppercase">
                                            Card {i + 1} of {(note.content.notes || note.content).length}
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="-left-12 border-slate-200 text-slate-400 hover:text-slate-800" />
                            <CarouselNext className="-right-12 border-slate-200 text-slate-400 hover:text-slate-800" />
                        </Carousel>
                        
                        <div className="h-px bg-slate-100 w-full" />
                    </div>
                ))}
            </div>

             {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                    <p className="text-slate-600 font-medium animate-pulse">Generating your study materials...</p>
                </div>
             )}
        </TabsContent>
    )
}
