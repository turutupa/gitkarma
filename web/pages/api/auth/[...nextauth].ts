import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Request scopes to access user data and repositories. Adjust as needed.
      authorization: { params: { scope: 'read:user repo' } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // This value should match the backend's JWT_SECRET.
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore
      session.accessToken = token.accessToken;
      return { ...token, ...session };
    },
  },
});
