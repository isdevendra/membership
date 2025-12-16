
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { Role } from '@/lib/roles';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const SetRoleInputSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(Role),
  companyId: z.string().optional(),
});
export type SetRoleInput = z.infer<typeof SetRoleInputSchema>;

export async function setRole(input: SetRoleInput): Promise<{ success: boolean }> {
  return setRoleFlow(input);
}

const setRoleFlow = ai.defineFlow(
  {
    name: 'setRoleFlow',
    inputSchema: SetRoleInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ userId, role, companyId }) => {
    const auth = getAuth();
    try {
      const existingUser = await auth.getUser(userId);
      const existingClaims = existingUser.customClaims || {};
      
      const newClaims = {
        ...existingClaims,
        role: role,
        companyId: companyId,
      };

      if (companyId === undefined) {
        delete newClaims.companyId;
      }

      await auth.setCustomUserClaims(userId, newClaims);
      return { success: true };
    } catch (error) {
      console.error('Error setting custom claims:', error);
      // In a real app, you'd want more robust error handling.
      return { success: false };
    }
  }
);
