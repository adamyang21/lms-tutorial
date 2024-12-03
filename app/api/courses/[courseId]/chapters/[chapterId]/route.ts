import Mux from "@mux/mux-node";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
});


export async function PATCH(
    req: Request,
    {params}: {params: {courseId: string, chapterId: string}}
) {
    try {
        const {userId} = auth();
        const {iPublished, ...values} = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorised", {status: 401});
        }
        
        const ownCourse = await db.course.findUnique({
            where: {
                id: params.courseId,
                userId
            }
        });

        if (!ownCourse) {
            return new NextResponse("Unauthorised", {status: 401});
        }

        const chapter = await db.chapter.update({
            where: {
                id: params.chapterId,
                courseId: params.courseId
            },
            data: {
                ...values
            }
        });

        if (values.videoUrl) {
            const existingMuxData = await db.muxData.findFirst({
                where: {
                    chapterId: params.chapterId
                }
            });

            if (existingMuxData) {
                await mux.video.assets.delete(existingMuxData.assetId);
                await db.muxData.delete({
                    where: {
                        id: existingMuxData.id
                    }
                });
            }

            let asset = await mux.video.assets.create({
                input: values.videoUrl,
                test: false
            });

            const playbackId = mux.video.assets.createPlaybackId(asset.id, {
                policy: "public"
            });

            asset = await mux.video.assets.retrieve(asset.id);

            console.log(asset.playback_ids);

            await db.muxData.create({
                data: {
                    chapterId: params.chapterId,
                    assetId: asset.id,
                    playbackId: asset.playback_ids?.[0]?.id
                }
            });
        }

        return NextResponse.json(chapter);
    }
    catch (e) {
        console.log("[COURSES_CHAPTER_ID]", e);
        return new NextResponse("Internal Error", {status: 500});
    }
};


export async function DELETE(
    req: Request,
    {params}: {params: {courseId: string, chapterId: string}}
) {
    try {
        const {userId} = auth();

        if (!userId) {
            return new NextResponse("Unauthorised", {status: 401});
        }

        const ownCourse = await db.course.findUnique({
            where: {
                id: params.courseId,
                userId
            }
        });

        if (!ownCourse) {
            return new NextResponse("Unauthorised", {status: 401});
        }

        const chapter = await db.chapter.findUnique({
            where: {
                id: params.chapterId,
                courseId: params.courseId
            }
        });

        if (!chapter) {
            return new NextResponse("Not Found", {status: 404});
        }

        if (chapter.videoUrl) {
            const existingMuxData = await db.muxData.findFirst({
                where: {
                    chapterId: params.chapterId
                }
            });

            if (existingMuxData) {
                await mux.video.assets.delete(existingMuxData.assetId);
                await db.muxData.delete({
                    where: {
                        id: existingMuxData.id
                    }
                });
            }
        }

        const deletedChapter = await db.chapter.delete({
            where: {
                id: params.chapterId
            }
        });

        const publishedChaptersInCourse = await db.chapter.findMany({
            where: {
                courseId: params.courseId,
                isPublished: true
            }
        });

        if (!publishedChaptersInCourse.length) {
            await db.course.update({
                where: {
                    id: params.courseId
                },
                data: {
                    isPublished: false
                }
            });
        }

        return NextResponse.json(deletedChapter);
    }
    catch (e) {
        console.log("[CHAPTER_ID_DELETE]", e);
        return new NextResponse("Internal Error", {status: 500});
    }
};