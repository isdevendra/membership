
'use client';

import React, { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Download, CalendarIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';

type ReportType = 'daily-new-members' | 'expiring-memberships' | 'redemption-summary' | 'member-activity';

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

  const newMembersQuery = useMemoFirebase(() => {
    if (!firestore || !dateRange?.from || reportType !== 'daily-new-members') return null;
    
    const start = startOfDay(dateRange.from);
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    
    return query(
      collection(firestore, 'memberships'),
      where('joinDate', '>=', start.toISOString()),
      where('joinDate', '<=', end.toISOString()),
      orderBy('joinDate', 'desc')
    );
  }, [firestore, dateRange, reportType]);

  const { data: newMembers, isLoading: isLoadingNewMembers } = useCollection<Member>(newMembersQuery);

  const downloadCSV = () => {
    if (!newMembers || newMembers.length === 0) return;

    const headers = ['ID', 'Full Name', 'Email', 'Tier', 'Join Date'];
    const rows = newMembers.map(member => [
      member.id,
      `"${member.fullName}"`,
      member.email,
      member.tier,
      format(toDate(member.joinDate)!, 'yyyy-MM-dd HH:mm:ss'),
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `new_members_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderReport = () => {
    switch(reportType) {
      case 'daily-new-members':
        return (
          <>
            <div className="flex justify-end">
              <Button onClick={downloadCSV} disabled={!newMembers || newMembers.length === 0}>
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
                  {isLoadingNewMembers && <TableRow><TableCell colSpan={3} className="text-center">Loading report...</TableCell></TableRow>}
                  {!isLoadingNewMembers && newMembers?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No new members in the selected date range.</TableCell></TableRow>}
                  {!isLoadingNewMembers && newMembers?.map(member => (
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
              <SelectItem value="expiring-memberships" disabled>Expiring Memberships</SelectItem>
              <SelectItem value="redemption-summary" disabled>Point Redemption Summary</SelectItem>
              <SelectItem value="member-activity" disabled>Member Activity Logs</SelectItem>
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
