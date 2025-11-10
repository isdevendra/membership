
'use client';

import React from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { type Member } from '@/lib/types';
import { MembershipCard } from './components/membership-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { EditMemberDialog } from './components/edit-member-dialog';
import { Skeleton } from '@/components/ui/skeleton';

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

  const { data: member, isLoading, setData } = useDoc<Member>(memberDocRef);
  
  const handleMemberUpdate = (updatedData: Partial<Member>) => {
    if (member) {
        setData({ ...member, ...updatedData });
    }
  };


  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading Member..." />
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-8">
                <Skeleton className="h-[235px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
            <div className="lg:col-span-2">
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
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
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline">Member Details</CardTitle>
                    <EditMemberDialog member={member} onUpdate={handleMemberUpdate} />
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border">
                            <AvatarImage src={member.photo || ''} alt={member.fullName} />
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

                   <Separator />

                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-medium">ID Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}



    
