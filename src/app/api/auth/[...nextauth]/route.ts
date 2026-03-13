import NextAuth from 'next-auth';
import { getAuthOptions } from '@/auth';

type AuthRouteContext = { params: Promise<{ nextauth: string[] }> };

const handler = (request: Request, context: AuthRouteContext) => NextAuth(getAuthOptions())(request, context);

export { handler as GET, handler as POST };
