export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Regular' | 'VIP' | 'Staff' | 'Blacklist';

export type Member = {
  id: string;
  fullName: string;
  photo?: string;
  email: string;
  joinDate: string;
  tier: MemberTier;
  points: number;
  dob: Date;
  gender: string;
  nationality: string;
  governmentId: string;
  phone: string;
  address: string;
  expiryDate: Date;
};
