export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type Member = {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  joinDate: string;
  tier: MemberTier;
  points: number;
};
