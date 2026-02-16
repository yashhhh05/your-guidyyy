"use client" //as we dealing wih browser events ex- form submissions
//Zod is to validate input from users
import { maxLength, minLength, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import { Button } from "./ui/button";
import LaunchButton from "./LaunchButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjects } from "@/constants";
import { createCompanion } from "@/lib/actions/companion.actions";
import { redirect } from "next/navigation";
import { UploadButton } from "@/utils/uploadthing";
import { analyzeImage } from "@/lib/actions/image.actions";
import { Loader2 } from "lucide-react";

interface CompanionFormProps {
  type?: string;
}

const formSchema = z.object({
    name : z.string().min(1,{message:" Companion name is required"}),
    subject : z.string().min(1,{message:" Subject name is required"}),
    topic : z.string().min(1,{message:" Topic name is required"}),
    voice : z.string().min(1,{message:" Voice name is required"}),
    style : z.string().min(1,{message:" Style name is required"}),
    duration : z.coerce.number().min(5).max(60),
    private: z.boolean().default(false),
    image_description: z.string().optional(),
    image_url: z.string().optional(),
})

const CompanionForm = ({ type }: CompanionFormProps) => {
    const isPrivate = type === 'private';
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState("");
    const [uploadedImageUrl, setUploadedImageUrl] = useState("");

    //define form
     const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name:"",
      subject:"",
      topic:"",
      voice:"",
      style:"",
      duration:15,
      private: isPrivate,
      image_description: "",
      image_url: "",
    },
  })

  // Reset image-related state when component mounts to prevent stale data
  useEffect(() => {
    setUploadedImageUrl("");
    setAnalysisResult("");
    form.setValue("image_description", "");
    form.setValue("image_url", "");
  }, []); // Empty dependency array = runs once on mount

  //Define a submit handler - what happens on submit the form
  const onSubmit = async(values: z.infer<typeof formSchema>) => {
    //pass values to server actions
    console.log(values);
    
    // Ensure image description is in values if analyzed
    if (analysisResult) {
        values.image_description = analysisResult;
    }
    if (uploadedImageUrl) {
        values.image_url = uploadedImageUrl;
    }

    const companion = await createCompanion(values);

    //if companion is created redirect to companion page
    if(companion){
        redirect(`/companion/${companion.id}`);
    }else{
        console.log("Companion not created");
        redirect("/");
    }
  }

  return (
    <Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
    {/*Fields for different fields */}
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Companion Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter the companion name" {...field} className="input" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="subject"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Subject</FormLabel>
          <Select 
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger className="capitalize">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
                {subjects.map((sub)=>(
                    <SelectItem 
                    value={sub}
                    key={sub}
                    className="capitalize"
                    >
                   {sub}
                    </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="topic"
      render={({ field }) => (
        <FormItem>
          <FormLabel>What should the companion help with</FormLabel>
          <FormControl>
            <Textarea placeholder="Ex. Derivatives & Integrals" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {isPrivate && (
        <FormItem>
            <FormLabel>Upload Context Image (Optional)</FormLabel>
            <FormControl>
                <div className="flex flex-col items-center justify-center w-full gap-4 border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {!uploadedImageUrl ? (
                         <div className="w-full h-full flex flex-col items-center">
                            <UploadButton
                                endpoint="imageUploader"
                                onClientUploadComplete={async (res) => {
                                    // Do something with the response
                                    console.log("Files: ", res);
                                    if(res && res[0]) {
                                        const url = res[0].url;
                                        setUploadedImageUrl(url);
                                        form.setValue("image_url", url); // Save URL to form
                                        setIsAnalyzing(true);
                                        try {
                                            const description = await analyzeImage(url);
                                            setAnalysisResult(description);
                                            form.setValue("image_description", description);
                                            console.log("Analysis:", description);
                                        } catch (error) {
                                            console.error("Analysis failed", error);
                                        } finally {
                                            setIsAnalyzing(false);
                                        }
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    // Do something with the error.
                                    alert(`ERROR! ${error.message}`);
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-2">SVG, PNG, JPG or GIF (MAX. 4MB)</p>
                         </div>
                    ) : (
                        <div className="flex flex-col items-center w-full">
                            <p className="text-green-600 font-semibold mb-2">Image Uploaded!</p>
                            {/* Optionally show preview */}
                            {isAnalyzing ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="animate-spin w-4 h-4"/> Analyzing image...
                                </div>
                            ) : (
                                <div className="w-full">
                                    <p className="text-sm font-semibold mb-1">AI Analysis:</p>
                                    <div className="bg-muted p-3 rounded-md text-sm max-h-32 overflow-y-auto">
                                        {analysisResult || "No description generated."}
                                    </div>
                                </div>
                            )}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setUploadedImageUrl("");
                                    setAnalysisResult("");
                                    form.setValue("image_description", "");
                                }}
                            >
                                Remove Image
                            </Button>
                        </div>
                    )}
                </div>
            </FormControl>
            <FormDescription>
                Upload an image to provide context for your companion (e.g., a math problem). The AI will analyze it automatically.
            </FormDescription>
        </FormItem>
    )}

    <FormField
      control={form.control}
      name="voice"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Voice</FormLabel>
          <Select 
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger className="input">
                <SelectValue placeholder="Select the voice" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
                <SelectItem value="male">
                    Male
                </SelectItem>
                <SelectItem value="female">
                    Female
                </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="style"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Style</FormLabel>
          <Select 
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger className="input">
                <SelectValue placeholder="Select the style" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
                <SelectItem value="formal">
                    Formal
                </SelectItem>
                <SelectItem value="casual">
                    Casual
                </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="duration"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Estimated session duration in minutes</FormLabel>
          <FormControl>
            <Input type="number" placeholder="15" {...field} className="input" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <LaunchButton type="submit" className="w-full md:w-auto md:px-12 md:max-w-md mx-auto">Build your companion</LaunchButton>
  </form>
</Form>
  )
}

export default CompanionForm