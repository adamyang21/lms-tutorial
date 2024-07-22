import { db } from "@/lib/db";
import { ClerkProvider, UserButton } from "@clerk/nextjs"

export default function Home() {
    return (
        <div>
            <UserButton/>
        </div>
    );
}
