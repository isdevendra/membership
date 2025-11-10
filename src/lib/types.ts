
import { Timestamp } from 'firebase/firestore';

export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Regular' | 'VIP' | 'Staff' | 'Blacklist';

export type MemberStatus = 'Checked In' | 'Checked Out';

export type Member = {
  id: string;
  fullName: string;
  photo?: string;
  email: string;
  joinDate: Timestamp | string;
  tier: MemberTier;
  points: number;
  dob: Timestamp | Date | string;
  gender: string;
  nationality: string;
  governmentId: string;
  phone: string;
  address: string;
  expiryDate: Timestamp | Date | string;
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

    
