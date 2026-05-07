"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCompanionSessions } from "@/lib/actions/companion.actions";
import { format } from "date-fns";
import { Loader2, MessageSquare, History } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

interface TranscriptModalProps {
  companionId: string;
  name: string;
}

export const TranscriptModal = ({ companionId, name }: TranscriptModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getCompanionSessions(companionId)
        .then((data) => {
          setSessions(data || []);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, companionId]);

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
            className="overflow-x-visible relative w-10 h-10 overflow-y-clip group text-center cursor-pointer mr-1"
        >
            <div
                className="flex justify-center items-center w-10 h-10 rounded-full bg-[#009087] transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
            >
                <History className="w-5 h-5" />
            </div>
            <div
                className="absolute font-bold -bottom-10 left-1/2 text-xs text-center text-black whitespace-nowrap transition-all duration-300 transform -translate-x-1/2 group-hover:bottom-0"
            >
                History
            </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Session History - {name}</DialogTitle>
          <DialogDescription>
            View transcripts from your past conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-4 min-h-0">
          {/* Session List */}
          <div className="w-1/3 border-r pr-4 flex flex-col gap-2">
            <h3 className="font-semibold mb-2">Sessions</h3>
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center p-4">
                  No sessions found.
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                      selectedSession?.id === session.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p>{format(new Date(session.created_at), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.created_at), "h:mm a")}
                    </p>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Transcript View */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">Transcript</h3>
            <ScrollArea className="h-full border rounded-md p-4 bg-muted/30">
              {selectedSession ? (
                selectedSession.transcript && selectedSession.transcript.length > 0 ? (
                  <div className="space-y-4">
                    {selectedSession.transcript.slice().reverse().map((msg: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="font-semibold text-xs mb-1 opacity-70">
                            {msg.role === "user" ? "You" : name}
                          </p>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                    <p>No transcript available for this session.</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                  <p>Select a session to view the transcript</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
