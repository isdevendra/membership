
'use client';

import React, { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, endOfDay, parseISO, differenceInDays } from 'date-fns';
import { Download, CalendarIcon, Cake } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import { type Member, type CheckIn } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type ReportType = 'daily-new-members' | 'checked-in-now' | 'banned-members' | 'member-activity-logs' | 'expiring-memberships' | 'redemption-summary' | 'member-birthdays';

type ActivityLog = CheckIn & { memberFullName?: string; memberEmail?: string; };


// Helper to convert various date formats to a Date object
const toDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue.toDate) return dateValue.toDate(); // Firestore Timestamp
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return !isNaN(date.getTime()) ? date : null;
    }
    if (dateValue instanceof Date) return dateValue;
    return null;
};

export function ReportingTool() {
  const firestore = useFirestore();
  const [reportType, setReportType] = useState<ReportType>('daily-new-members');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

    const membersQuery = useMemoFirebase(() => {
        if (!firestore) return null;

        const baseQuery = collection(firestore, 'memberships');

        switch(reportType) {
            case 'daily-new-members':
                if (!dateRange?.from) return null;
                const startJoin = startOfDay(dateRange.from);
                const endJoin = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
                return query(baseQuery, where('joinDate', '>=', startJoin.toISOString()), where('joinDate', '<=', endJoin.toISOString()), orderBy('joinDate', 'desc'));
            
            case 'checked-in-now':
                 return query(baseQuery, where('status', '==', 'Checked In'));
            
            case 'banned-members':
                 return query(baseQuery, where('tier', '==', 'Blacklist'));
            
            case 'member-birthdays':
                 return query(baseQuery, orderBy('fullName'));
            
            default:
                return null;
        }
    }, [firestore, reportType, dateRange]);

    const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersQuery);

    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);

    // Manual fetch for activity logs since it's a collectionGroup query
    React.useEffect(() => {
        const fetchActivityLogs = async () => {
            if (reportType !== 'member-activity-logs' || !firestore || !dateRange?.from) return;
            
            setIsLoadingActivity(true);
            setActivityLogs([]);

            const start = startOfDay(dateRange.from);
            const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

            const q = query(
                collectionGroup(firestore, 'checkins'), 
                where('checkInTime', '>=', start.toISOString()), 
                where('checkInTime', '<=', end.toISOString()),
                orderBy('checkInTime', 'desc')
            );
            
            try {
                const querySnapshot = await getDocs(q);
                const logs: ActivityLog[] = [];
                // We need member details, so we can fetch them or assume they're already loaded elsewhere
                // For simplicity, we'll do a quick fetch here if needed. A better approach might be to have members loaded in a context.
                const allMembersSnapshot = await getDocs(collection(firestore, 'memberships'));
                const membersMap = new Map(allMembersSnapshot.docs.map(doc => [doc.id, doc.data() as Member]));
                
                querySnapshot.forEach(doc => {
                    const log = doc.data() as CheckIn;
                    const member = membersMap.get(log.memberId);
                    logs.push({
                        ...log,
                        id: doc.id,
                        memberFullName: member?.fullName,
                        memberEmail: member?.email
                    });
                });
                setActivityLogs(logs);
            } catch (error) {
                console.error("Error fetching activity logs:", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not fetch activity logs." });
            } finally {
                setIsLoadingActivity(false);
            }
        };

        fetchActivityLogs();
    }, [reportType, dateRange, firestore]);
    
  const downloadCSV = (data: any[], headers: string[], filename: string) => {
    if (!data || data.length === 0) {
        toast({ variant: 'destructive', title: 'No data to export' });
        return;
    };

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + data.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const birthdayReportData = useMemo(() => {
    if (reportType !== 'member-birthdays' || !members) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return members
        .map(member => {
            const dob = toDate(member.dob);
            if (!dob) return null;

            let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            
            const daysUntil = differenceInDays(nextBirthday, today);
            return { ...member, dobDate: dob, daysUntilNextBirthday: daysUntil };
        })
        .filter(Boolean)
        .sort((a, b) => a!.daysUntilNextBirthday - b!.daysUntilNextBirthday) as (Member & { dobDate: Date; daysUntilNextBirthday: number })[];
    
  }, [reportType, members]);


  const renderReport = () => {
    const isLoading = isLoadingMembers || isLoadingActivity;
    
    switch(reportType) {
      case 'daily-new-members':
        return (
          <>
            <div className="flex justify-end">
              <Button onClick={() => downloadCSV(
                  members?.map(m => [m.id, `"${m.fullName}"`, m.email, m.tier, format(toDate(m.joinDate)!, 'yyyy-MM-dd HH:mm:ss')]) ?? [],
                  ['ID', 'Full Name', 'Email', 'Tier', 'Join Date'],
                  'new_members_report'
              )} disabled={!members || members.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading report...</TableCell></TableRow>}
                  {!isLoading && members?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No new members in the selected date range.</TableCell></TableRow>}
                  {!isLoading && members?.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </TableCell>
                      <TableCell>{member.tier}</TableCell>
                      <TableCell>{format(toDate(member.joinDate)!, 'PPP p')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        );

    case 'checked-in-now':
        return (
            <>
              <div className="flex justify-end">
                <Button onClick={() => downloadCSV(
                    members?.map(m => [m.id, `"${m.fullName}"`, m.email, m.tier, m.status]) ?? [],
                    ['ID', 'Full Name', 'Email', 'Tier', 'Status'],
                    'checked_in_report'
                )} disabled={!members || members.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading report...</TableCell></TableRow>}
                    {!isLoading && members?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No members are currently checked in.</TableCell></TableRow>}
                    {!isLoading && members?.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </TableCell>
                        <TableCell>{member.tier}</TableCell>
                        <TableCell>
                            <Badge variant="default" className="bg-green-500">{member.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          );
      case 'banned-members':
        return (
            <>
              <div className="flex justify-end">
                <Button onClick={() => downloadCSV(
                    members?.map(m => [m.id, `"${m.fullName}"`, m.email, format(toDate(m.joinDate)!, 'yyyy-MM-dd')]) ?? [],
                    ['ID', 'Full Name', 'Email', 'Join Date'],
                    'banned_members_report'
                )} disabled={!members || members.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Tier</TableHead>
                       <TableHead>Join Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading report...</TableCell></TableRow>}
                    {!isLoading && members?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No members are banned.</TableCell></TableRow>}
                    {!isLoading && members?.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="destructive">{member.tier}</Badge>
                        </TableCell>
                        <TableCell>{format(toDate(member.joinDate)!, 'PPP')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          );
      case 'member-activity-logs':
         return (
            <>
              <div className="flex justify-end">
                <Button onClick={() => downloadCSV(
                    activityLogs?.map(log => {
                        const checkIn = toDate(log.checkInTime);
                        const checkOut = toDate(log.checkOutTime);
                        return [log.memberId, `"${log.memberFullName}"`, log.memberEmail, checkIn ? format(checkIn, 'yyyy-MM-dd HH:mm:ss') : '', checkOut ? format(checkOut, 'yyyy-MM-dd HH:mm:ss') : ''];
                    }) ?? [],
                    ['Member ID', 'Full Name', 'Email', 'Check-in Time', 'Check-out Time'],
                    'activity_log_report'
                )} disabled={!activityLogs || activityLogs.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Check-in Time</TableHead>
                       <TableHead>Check-out Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading report...</TableCell></TableRow>}
                    {!isLoading && activityLogs?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No activity in the selected date range.</TableCell></TableRow>}
                    {!isLoading && activityLogs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.memberFullName}</div>
                          <div className="text-sm text-muted-foreground">{log.memberEmail || log.memberId}</div>
                        </TableCell>
                        <TableCell>{format(toDate(log.checkInTime)!, 'PPP p')}</TableCell>
                        <TableCell>{log.checkOutTime ? format(toDate(log.checkOutTime)!, 'PPP p') : 'Still Checked In'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          );
    case 'member-birthdays':
        return (
        <>
            <div className="flex justify-end">
            <Button onClick={() => downloadCSV(
                birthdayReportData?.map(m => [`"${m.fullName}"`, format(m.dobDate, 'yyyy-MM-dd')]) ?? [],
                ['Full Name', 'Date of Birth'],
                'member_birthdays_report'
            )} disabled={!birthdayReportData || birthdayReportData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
            </Button>
            </div>
            <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Days Until Next Birthday</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading report...</TableCell></TableRow>}
                {!isLoading && birthdayReportData?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No members found or no members have a date of birth set.</TableCell></TableRow>}
                {!isLoading && birthdayReportData?.map(member => (
                    <TableRow key={member.id}>
                    <TableCell>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                    </TableCell>
                    <TableCell>{format(member.dobDate, 'MMMM do')}</TableCell>
                    <TableCell>
                        {member.daysUntilNextBirthday === 0 ? (
                            <Badge className="bg-primary hover:bg-primary"><Cake className="mr-2 h-4 w-4"/> Today!</Badge>
                        ) : (
                            `${member.daysUntilNextBirthday} days`
                        )}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
        </>
        );
      default:
        return (
          <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">This report is not yet available.</p>
          </div>
        );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Report Generator</CardTitle>
        <CardDescription>Select a report type and date range to generate a report.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Select a report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily-new-members">Daily New Members</SelectItem>
              <SelectItem value="checked-in-now">Currently Checked-in</SelectItem>
              <SelectItem value="banned-members">Banned Members</SelectItem>
              <SelectItem value="member-activity-logs">Member Activity Logs</SelectItem>
              <SelectItem value="member-birthdays">Member Birthdays</SelectItem>
              <SelectItem value="expiring-memberships" disabled>Expiring Memberships</SelectItem>
              <SelectItem value="redemption-summary" disabled>Point Redemption Summary</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal md:w-[300px]",
                  !dateRange && "text-muted-foreground"
                )}
                disabled={reportType === 'member-birthdays' || reportType === 'checked-in-now' || reportType === 'banned-members'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          {renderReport()}
        </div>
      </CardContent>
    </Card>
  );
}
