
export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Regular' | 'VIP' | 'Staff' | 'Blacklist';

export type MemberStatus = 'Checked In' | 'Checked Out';

export type Member = {
  id: string;
  fullName: string;
  photo?: string;
  email: string;
  joinDate: string;
  tier: MemberTier;
  points: number;
  dob: Date | string;
  gender: string;
  nationality: string;
  governmentId: string;
  phone: string;
  address: string;
  expiryDate: Date | string;
  idFront?: string;
  idBack?: string;
  status?: MemberStatus;
};

export type CheckIn = {
    id: string;
    memberId: string;
    checkInTime: string; // ISO string
    checkOutTime?: string; // ISO string
}

    