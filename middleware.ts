import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/uploadthing']);

export default clerkMiddleware((auth, request) => {
    const requestUrl = request.url;
    console.log('Request URL:', requestUrl);

    // Check if the request URL matches a public route
    if (!isPublicRoute(request)) {
        auth().protect();
    }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};