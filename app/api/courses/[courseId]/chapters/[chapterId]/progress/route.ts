import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(
    req: Request,
    {params}: {params: {courseId: string; chapterId: string}}
) {
    try {
        const {userId} = auth();
        const {isCompleted} = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorised", {status: 401});
        }

        const userProgress = await db.userProgress.upsert({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId: params.chapterId
                }
            },
            update: {
                isCompleted
            },
            create: {
                userId,
                chapterId: params.chapterId,
                isCompleted
            }
        });

        return NextResponse.json(userProgress);
    }
    catch (e) {
        console.log("[CHAPTER_ID_PROGRESS]", e);
        return new NextResponse("Internal Error", {status: 500});
    }
};