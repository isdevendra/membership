
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Users,
  CalendarIcon,
  Crown,
  X,
  LogIn,
  LogOut,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Member, type MemberTier } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, Timestamp, query, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";


const tierColors: Record<MemberTier, string> = {
    Bronze: "bg-amber-700",
    Silver: "bg-slate-400",
    Gold: "bg-yellow-500",
    Platinum: "bg-sky-200 text-black",
    Regular: "bg-gray-500",
    VIP: "bg-purple-700",
    Staff: "bg-blue-700",
    Blacklist: "bg-red-700",
};

// Helper to convert Firestore Timestamp or string to Date
const toDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate();
    }
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    // Handle cases where date is already a JS Date object from form state
    if (dateValue instanceof Date) {
        return dateValue;
    }
    // Handle Firestore's seconds/nanoseconds object representation after serialization
    if (typeof dateValue === 'object' && 'seconds' in dateValue && 'nanoseconds' in dateValue) {
        return new Timestamp(dateValue.seconds, dateValue.nanoseconds).toDate();
    }
    return null;
};
  

function ManageMemberDialog({ member, children }: { member: Member, children: React.ReactNode }) {
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [tier, setTier] = React.useState<MemberTier>(member.tier);
    const [expiryDate, setExpiryDate] = React.useState<Date | undefined>(toDate(member.expiryDate) ?? undefined);

    React.useEffect(() => {
        if (isOpen) {
            setTier(member.tier);
            setExpiryDate(toDate(member.expiryDate) ?? undefined);
        }
    }, [isOpen, member]);

    const handleSave = () => {
        if (!firestore) return;
        const memberDocRef = doc(firestore, 'memberships', member.id);
        const updates: Partial<Member> = {};

        const originalExpiryDate = toDate(member.expiryDate);

        if (tier !== member.tier) {
            updates.tier = tier;
        }

        // Check if expiryDate has changed
        if (expiryDate && expiryDate.getTime() !== originalExpiryDate?.getTime()) {
             updates.expiryDate = expiryDate;
        }
        
        if (Object.keys(updates).length > 0) {
            updateDocumentNonBlocking(memberDocRef, updates);
            toast({
                title: "Member Updated",
                description: `${member.fullName}'s details have been updated.`,
            });
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {member.fullName}</DialogTitle>
            <DialogDescription>
              Update member tier or renew their membership.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tier" className="text-right">
                Tier
              </Label>
              <div className="col-span-3">
                <Select value={tier} onValueChange={(value) => setTier(value as MemberTier)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select member type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Blacklist">Blacklist</SelectItem>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiryDate" className="text-right">
                Expiry Date
              </Label>
              <div className="col-span-3">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !expiryDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={expiryDate}
                            onSelect={(date) => date && setExpiryDate(date)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

export function MemberTable() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const membersCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'memberships');
  }, [firestore, user]);

  const { data: members, isLoading: isLoadingMembers, error } = useCollection<Member>(membersCollection);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState<MemberTier | "all">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const isLoading = isUserLoading || isLoadingMembers;

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    
    return members.filter((member) => {
      // Search term filter
      const matchesSearch =
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.id && member.id.toLowerCase().includes(searchTerm.toLowerCase()));

      // Tier filter
      const matchesTier = tierFilter === 'all' || member.tier === tierFilter;

      // Date range filter
      const joinDate = toDate(member.joinDate);
      const matchesDate = !dateRange || (joinDate &&
        (!dateRange.from || joinDate >= dateRange.from) &&
        (!dateRange.to || joinDate <= dateRange.to));

      return matchesSearch && matchesTier && matchesDate;
    });
  }, [members, searchTerm, tierFilter, dateRange]);
  
  const isFiltered = tierFilter !== 'all' || dateRange !== undefined;

  const clearFilters = () => {
    setTierFilter('all');
    setDateRange(undefined);
  }

  const handleCheckIn = (member: Member) => {
    if (!firestore) return;
    const memberDocRef = doc(firestore, 'memberships', member.id);
    const checkinColRef = collection(firestore, 'memberships', member.id, 'checkins');
    const newStatus = 'Checked In';
    
    updateDocumentNonBlocking(memberDocRef, { status: newStatus });
    addDocumentNonBlocking(checkinColRef, {
        memberId: member.id,
        checkInTime: new Date().toISOString(),
    });
    toast({ title: 'Check-in Successful', description: `${member.fullName} has been checked in.` });
  };
  
  const handleCheckOut = async (member: Member) => {
    if (!firestore) return;

    const memberDocRef = doc(firestore, 'memberships', member.id);
    const newStatus = 'Checked Out';
    
    // Find the latest check-in to update
    const checkInsQuery = query(collection(firestore, 'memberships', member.id, 'checkins'), orderBy('checkInTime', 'desc'), limit(1));
    // Since we are not using useCollection, we need to get the documents manually
    // This is a one-time read, which is fine for a user action.
    const getDocs = await import('firebase/firestore').then(m => m.getDocs);
    const snapshot = await getDocs(checkInsQuery);
    const latestCheckIn = snapshot.docs.find(d => !(d.data() as any).checkOutTime);
    
    if (latestCheckIn) {
        const checkinDocRef = doc(firestore, 'memberships', member.id, 'checkins', latestCheckIn.id);
        updateDocumentNonBlocking(checkinDocRef, { checkOutTime: new Date().toISOString() });
    }

    updateDocumentNonBlocking(memberDocRef, { status: newStatus });
    toast({ title: 'Check-out Successful', description: `${member.fullName} has been checked out.` });
  };

  const handleBlock = (member: Member) => {
    if (!firestore) return;
    const memberDocRef = doc(firestore, 'memberships', member.id);
    updateDocumentNonBlocking(memberDocRef, { tier: 'Blacklist' });
    toast({ title: 'Member Blocked', description: `${member.fullName} has been moved to the blacklist.` });
  };

  const handleUnblock = (member: Member) => {
    if (!firestore) return;
    const memberDocRef = doc(firestore, 'memberships', member.id);
    updateDocumentNonBlocking(memberDocRef, { tier: 'Regular' });
    toast({ title: 'Member Unblocked', description: `${member.fullName} has been unblocked.` });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Members</CardTitle>
        <CardDescription>
          A list of all members in the casino.
        </CardDescription>
        <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search by name or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 flex-wrap">
                <Select value={tierFilter} onValueChange={(value) => setTierFilter(value as MemberTier | "all")}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by tier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Blacklist">Blacklist</SelectItem>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                    </SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal sm:w-[240px]",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Filter by join date</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
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

                {isFiltered && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" /> Clear
                    </Button>
                )}
                 <Button size="sm" className="gap-1" asChild>
                    <Link href="/enrollment">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Member
                        </span>
                    </Link>
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading members...</TableCell>
                </TableRow>
            )}
            {!isLoading && error && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-destructive">
                        Error loading members: {error.message}
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && !error && filteredMembers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        <p className="font-semibold">No members found</p>
                        <p className="text-muted-foreground text-sm">
                            Try adjusting your search or filter criteria.
                        </p>
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && !error && filteredMembers.map((member) => {
              const joinDate = toDate(member.joinDate);
              const expiryDate = toDate(member.expiryDate);
              
              return (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                       <AvatarImage src={member.photo} alt={member.fullName} />
                      <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                      <span className="font-semibold">{member.fullName}</span>
                      <span className="text-sm text-muted-foreground">{member.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-white ${tierColors[member.tier]}`}>
                    {member.tier}
                  </Badge>
                </TableCell>
                 <TableCell>
                    <Badge variant={member.status === 'Checked In' ? 'default' : 'secondary'} className={member.status === 'Checked In' ? 'bg-green-500 text-white' : ''}>
                        {member.status || 'Checked Out'}
                    </Badge>
                </TableCell>
                <TableCell>
                  {member.points.toLocaleString()}
                </TableCell>
                <TableCell>{joinDate ? format(joinDate, "MM/dd/yyyy") : 'N/A'}</TableCell>
                <TableCell>{expiryDate ? format(expiryDate, "MM/dd/yyyy") : 'N/A'}</TableCell>
                <TableCell>
                  <ManageMemberDialog member={member}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/members/${member.id}`}>View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <DialogTrigger className="w-full text-left">Manage Membership</DialogTrigger>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Redeem Rewards</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCheckIn(member)} disabled={member.status === 'Checked In'}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Check In
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCheckOut(member)} disabled={member.status !== 'Checked In'}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Check Out
                        </DropdownMenuItem>
                         <DropdownMenuSeparator />
                        {member.tier === 'Blacklist' ? (
                            <DropdownMenuItem onClick={() => handleUnblock(member)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Unblock Member
                            </DropdownMenuItem>
                        ) : (
                             <DropdownMenuItem onClick={() => handleBlock(member)} className="text-red-600 focus:text-red-600">
                                <Ban className="mr-2 h-4 w-4" />
                                Block Member
                            </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ManageMemberDialog>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

  