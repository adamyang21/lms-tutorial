import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { auth } from "@clerk/nextjs/server";
import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
});


export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const { userId } = auth();
        const { courseId } = params;
        const values = await req.json();

        if (!userId || !isTeacher(userId)) {
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


export async function DELETE(
    req: Request,
    {params}: {params: {courseId: string}}
) {
    try {
        const {userId} = auth();

        if (!userId || !isTeacher(userId)) {
            return new NextResponse("Unauthorised", {status: 401});
        }

        const course = await db.course.findUnique({
            where: {
                id: params.courseId,
                userId: userId
            },
            include: {
                chapters: {
                    include: {
                        muxData: true
                    }
                }
            }
        });

        if (!course) {
            return new NextResponse("Course not found", {status: 404});
        }

        for (const chapter of course.chapters) {
            if (!chapter.muxData?.assetId) {
                if (chapter.muxData != null) {
                    await mux.video.assets.delete(chapter.muxData.assetId);
                }
            }
        }

        const deletedCourse = await db.course.delete({
            where: {
                id: params.courseId
            }
        });

        return NextResponse.json(deletedCourse);
    }
    catch (e) {
        console.log("[COURSE_ID_DELETE]", e);
        return new NextResponse("Internal Error", {status: 500});
    }
};