"use client" //as we dealing wih browser events ex- form submissions
//Zod is to validate input from users
import { maxLength, minLength, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjects } from "@/constants";
import { createCompanion } from "@/lib/actions/companion.actions";
import { redirect } from "next/navigation";

const formSchema = z.object({
    name : z.string().min(1,{message:" Companion name is required"}),
    subject : z.string().min(1,{message:" Subject name is required"}),
    topic : z.string().min(1,{message:" Topic name is required"}),
    voice : z.string().min(1,{message:" Voice name is required"}),
    style : z.string().min(1,{message:" Style name is required"}),
    duration : z.coerce.number().min(1,{message:" Duration is required"})
})

const CompanionForm = () => {

    //define form
     const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:"",
      subject:"",
      topic:"",
      voice:"",
      style:"",
      duration:15,
    },
  })

  //Define a submit handler - what happens on submit the form
  const onSubmit = async(values: z.infer<typeof formSchema>): void => {
    //pass values to server actions
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
    <Button type="submit" className="w-full cursor-pointer">Build your companion</Button>
  </form>
</Form>
  )
}

export default CompanionForm