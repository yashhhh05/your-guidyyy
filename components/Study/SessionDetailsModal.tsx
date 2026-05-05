"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StudyTab } from "./StudyTab";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SessionDetailsModalProps {
  sessionId: string;
  companionName: string;
  trigger: React.ReactNode;
}

export const SessionDetailsModal = ({ sessionId, companionName, trigger }: SessionDetailsModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-slate-50/50">
        <div className="p-6 border-b bg-white">
            <DialogHeader>
            <DialogTitle className="text-xl">Study Session: {companionName}</DialogTitle>
            <DialogDescription>
                Review your conversation and generate study materials.
            </DialogDescription>
            </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
             <Tabs defaultValue="study" className="w-full">
                <TabsList className="grid w-full grid-cols-1 mb-6">
                    <TabsTrigger value="study">Study Materials</TabsTrigger>
                </TabsList>
                <StudyTab sessionId={sessionId} />
             </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
