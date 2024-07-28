import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const { userId } = auth();
        const { courseId } = params;
        const values = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorised", { status: 401 });
        }

        const course = await db.course.update({
            where: {
                id: courseId,
                userId: userId
            },
            data: {
                ...values
            }
        });

        return NextResponse.json(course);
    }
    catch (e) {
        console.log("[COURSE_ID]", e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}