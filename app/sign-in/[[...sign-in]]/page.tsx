import { SignIn } from "@clerk/nextjs";

export default function Page(){
    return (
        <main className="flex justify-center items-center min-h-screen bg-background p-4">
            <SignIn />
        </main>
    )
}