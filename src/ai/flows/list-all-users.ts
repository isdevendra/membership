
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { Role } from '@/lib/roles';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const UserRecordSchema = z.object({
  uid: z.string(),
  email: z.string(),
  fullName: z.string().optional(),
  role: z.nativeEnum(Role),
  companyId: z.string().optional(),
});

export const ListAllUsersOutputSchema = z.object({
  users: z.array(UserRecordSchema),
});
export type ListAllUsersOutput = z.infer<typeof ListAllUsersOutputSchema>;

export async function listAllUsers(): Promise<ListAllUsersOutput> {
  return listAllUsersFlow();
}

const listAllUsersFlow = ai.defineFlow(
  {
    name: 'listAllUsersFlow',
    inputSchema: z.void(),
    outputSchema: ListAllUsersOutputSchema,
  },
  async () => {
    const auth = getAuth();
    const userRecords = await auth.listUsers();

    const users = userRecords.users.map(user => {
      const role = (user.customClaims?.role as Role) || 'Security';
      const companyId = user.customClaims?.companyId as string | undefined;

      return {
        uid: user.uid,
        email: user.email || 'No email',
        fullName: user.displayName || user.email || 'Unnamed User',
        role: role,
        companyId: companyId,
      };
    });

    return { users };
  }
);
