import { type Member, type MemberTier } from '@/lib/types';
import { subDays, format } from 'date-fns';

const tiers: MemberTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export const members: Member[] = [
  {
    id: 'M-1001',
    name: 'Eleanora Vance',
    avatarUrl: 'https://picsum.photos/seed/1/100/100',
    email: 'eleanora.vance@example.com',
    joinDate: format(subDays(new Date(), 45), 'MM/dd/yyyy'),
    tier: 'Gold',
    points: 75000,
  },
  {
    id: 'M-1002',
    name: 'Bartholomew "Barty" Higgins',
    avatarUrl: 'https://picsum.photos/seed/2/100/100',
    email: 'barty.higgins@example.com',
    joinDate: format(subDays(new Date(), 120), 'MM/dd/yyyy'),
    tier: 'Platinum',
    points: 250000,
  },
  {
    id: 'M-1003',
    name: 'Seraphina Monroe',
    avatarUrl: 'https://picsum.photos/seed/3/100/100',
    email: 'seraphina.monroe@example.com',
    joinDate: format(subDays(new Date(), 12), 'MM/dd/yyyy'),
    tier: 'Bronze',
    points: 5000,
  },
  {
    id: 'M-1004',
    name: 'Jasper Knight',
    avatarUrl: 'https://picsum.photos/seed/4/100/100',
    email: 'jasper.knight@example.com',
    joinDate: format(subDays(new Date(), 200), 'MM/dd/yyyy'),
    tier: 'Silver',
    points: 25000,
  },
  {
    id: 'M-1005',
    name: 'Isabella Dubois',
    avatarUrl: 'https://picsum.photos/seed/5/100/100',
    email: 'isabella.dubois@example.com',
    joinDate: format(subDays(new Date(), 5), 'MM/dd/yyyy'),
    tier: 'Bronze',
    points: 1200,
  },
  {
    id: 'M-1006',
    name: 'Maximilian Sterling',
    avatarUrl: 'https://picsum.photos/seed/6/100/100',
    email: 'maximilian.sterling@example.com',
    joinDate: format(subDays(new Date(), 365), 'MM/dd/yyyy'),
    tier: 'Platinum',
    points: 550000,
  },
    {
    id: 'M-1007',
    name: 'Cassandra Bell',
    avatarUrl: 'https://picsum.photos/seed/7/100/100',
    email: 'cassandra.bell@example.com',
    joinDate: format(subDays(new Date(), 90), 'MM/dd/yyyy'),
    tier: 'Silver',
    points: 32000,
  },
  {
    id: 'M-1008',
    name: 'Leo Maxwell',
    avatarUrl: 'https://picsum.photos/seed/8/100/100',
    email: 'leo.maxwell@example.com',
    joinDate: format(subDays(new Date(), 28), 'MM/dd/yyyy'),
    tier: 'Gold',
    points: 82500,
  },
];
