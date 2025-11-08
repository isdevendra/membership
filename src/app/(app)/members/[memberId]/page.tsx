

'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { type Member } from '@/lib/types';
import { MembershipCard } from './components/membership-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const toDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue.toDate) { // Firestore Timestamp
      return dateValue.toDate();
    }
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
     if (dateValue instanceof Date) {
        return dateValue;
    }
    return null;
  };
  

export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.memberId as string;
  const firestore = useFirestore();

  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !memberId) return null;
    return doc(firestore, 'memberships', memberId);
  }, [firestore, memberId]);

  const { data: member, isLoading } = useDoc<Member>(memberDocRef);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading Member..." />
        <p>Loading member details...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div>
        <PageHeader title="Member Not Found" />
        <p>Could not find a member with the ID: {memberId}</p>
      </div>
    );
  }

  const joinDate = toDate(member.joinDate);
  const expiryDate = toDate(member.expiryDate);
  const dob = toDate(member.dob);

  return (
    <div>
      <PageHeader title="Member Profile" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
            <MembershipCard member={member} />

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">ID Documents</CardTitle>
                    <CardDescription>Scanned ID documents for verification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">ID Front</p>
                        <div className="mt-2 w-full aspect-video border rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            {member.idFront ? <Image src={member.idFront} alt="ID Front" width={300} height={189} className="object-contain"/> : <span className="text-muted-foreground text-sm">Not provided</span>}
                        </div>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">ID Back</p>
                        <div className="mt-2 w-full aspect-video border rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            {member.idBack ? <Image src={member.idBack} alt="ID Back" width={300} height={189} className="object-contain"/> : <span className="text-muted-foreground text-sm">Not provided</span>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Member Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border">
                            <AvatarImage src={member.photo} alt={member.fullName} />
                            <AvatarFallback className="text-2xl">{member.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold">{member.fullName}</h2>
                            <p className="text-muted-foreground">{member.id}</p>
                        </div>
                   </div>

                   <Separator />

                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Tier</p>
                            <p className="font-semibold">{member.tier}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Points</p>
                            <p className="font-semibold">{member.points.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-semibold">{member.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-semibold">{member.phone}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Date of Birth</p>
                            <p className="font-semibold">{dob ? format(dob, 'PPP') : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Gender</p>
                            <p className="font-semibold">{member.gender}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Nationality</p>
                            <p className="font-semibold">{member.nationality}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Government ID</p>
                            <p className="font-semibold">{member.governmentId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Join Date</p>
                            <p className="font-semibold">{joinDate ? format(joinDate, 'PPP') : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Expiry Date</p>
                            <p className="font-semibold">{expiryDate ? format(expiryDate, 'PPP') : 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-semibold">{member.address}</p>
                        </div>
                   </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

