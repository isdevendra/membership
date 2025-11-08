'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { collection, doc, setDoc } from 'firebase/firestore';
import { type Member } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type UserRecord = {
    id: string;
    email: string;
    role: Role;
};

type Role = 'Admin' | 'Receptionist' | 'Manager' | 'Security' | 'Member';

const permissions: Record<Role, { createUser: boolean; deleteUser: boolean; editRole: boolean; }> = {
    Admin: { createUser: true, deleteUser: true, editRole: true },
    Manager: { createUser: false, deleteUser: false, editRole: false },
    Receptionist: { createUser: false, deleteUser: false, editRole: false },
    Security: { createUser: false, deleteUser: false, editRole: false },
    Member: { createUser: false, deleteUser: false, editRole: false },
};

// For now, we'll assume the current user is an Admin for demonstration purposes.
const currentUserRole: Role = 'Admin';


function RoleSelector({ value, onValueChange, disabled }: { value: Role; onValueChange: (role: Role) => void; disabled?: boolean; }) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as Role)} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Admin">Admin</SelectItem>
        <SelectItem value="Receptionist">Receptionist</SelectItem>
        <SelectItem value="Manager">Manager</SelectItem>
        <SelectItem value="Security">Security</SelectItem>
        <SelectItem value="Member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}

function AddUserDialog({ onUserAdded }: { onUserAdded: (user: UserRecord) => void }) {
    const auth = useAuth();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState<Role>('Member');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleAddUser = async () => {
        if (!auth || !firestore) return;
        setIsLoading(true);
        try {
            // NOTE: In a real app, you'd typically use a Cloud Function to create users
            // and set their roles (custom claims) atomically and securely.
            // Creating users directly on the client should only be done with very strict security rules.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = { id: userCredential.user.uid, email: userCredential.user.email!, role };
            
            // In a real app, you'd set the custom claim for the role on the backend here.
            // For now, we are managing roles in the client state.
            
            // Also create a member document in Firestore
            const memberDocRef = doc(firestore, 'memberships', userCredential.user.uid);
            await setDoc(memberDocRef, {
                id: userCredential.user.uid,
                email: userCredential.user.email,
                fullName: userCredential.user.email, // Use email as placeholder
                tier: 'Bronze', // Default tier
                points: 0,
                joinDate: new Date().toISOString(),
                dob: '',
                gender: '',
                nationality: '',
                governmentId: '',
                phone: '',
                address: '',
                expiryDate: '',
            });


            onUserAdded(newUser);

            toast({ title: 'User Created', description: `Successfully created user ${email} and their member profile.` });
            setIsOpen(false);
            setEmail('');
            setPassword('');
            setRole('Member');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error creating user', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm" className="ml-auto gap-1" disabled={!permissions[currentUserRole].createUser}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add User
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new user and assign them a role. Note: this creates a real Firebase Auth user and a member profile.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <div className="col-span-3">
                            <RoleSelector value={role} onValueChange={setRole} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AuthRolesPage() {
    const auth = useAuth();
    const firestore = useFirestore();

    const membersCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'memberships');
    }, [firestore]);

    const { data: members, isLoading } = useCollection<Member>(membersCollection);

    const users: UserRecord[] = React.useMemo(() => {
        if (!members) return [];
        return members.map(member => ({
            id: member.id,
            email: member.email,
            // In a real app, role would come from custom claims or Firestore.
            // For now, we default everyone to "Member".
            role: 'Member'
        }));
    }, [members]);

    const [userRoles, setUserRoles] = React.useState<Record<string, Role>>({});

    React.useEffect(() => {
        const initialRoles = users.reduce((acc, user) => {
            acc[user.id] = user.role;
            return acc;
        }, {} as Record<string, Role>);
        setUserRoles(initialRoles);
    }, [users]);
    

    const handleRoleChange = (userId: string, role: Role) => {
        setUserRoles(prev => ({ ...prev, [userId]: role }));
        const userEmail = users.find(u => u.id === userId)?.email;
        toast({ title: "Role Changed (Staged)", description: `Role for ${userEmail} set to ${role}. Click 'Save Changes' to apply.`})
    };
    
    // This function can be used to manually add a new user to the local state if needed,
    // though fetching from the collection is now the primary way users are displayed.
    const handleUserAdded = (newUser: UserRecord) => {
        // The useCollection hook will automatically update the list,
        // so we don't strictly need to manually add to a local state anymore.
        // This function can be kept for optimistic updates if desired.
    };

    const handleSaveChanges = (userId: string) => {
        const newRole = userRoles[userId];
        const userEmail = users.find(u => u.id === userId)?.email;
        // In a real app, you would call a backend function to set a custom claim.
        // For now, we just show a toast.
        toast({
            title: "Changes Saved (Simulated)",
            description: `Role for ${userEmail} is now ${newRole}. A backend function would be needed to make this permanent.`,
        });
    };

    const handleRemoveUser = (userId: string, userEmail: string) => {
        if (!auth) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
            return;
        }

        // This action is highly sensitive and in a production app should be handled by a secure backend function
        // that verifies the current user's admin privileges before deleting another user.
        // Client-side user deletion is not possible for other users.
        if (auth.currentUser?.uid === userId) {
            toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'You cannot remove your own account from this panel.' });
            return;
        }
        
        // In a real app, you'd call a backend function to delete the user.
        // We're simulating this by just showing a toast. The user will still exist in Auth.
        // To also remove from the view, we would need to delete the firestore doc.
        toast({ title: 'User Removed (Simulated)', description: `User ${userEmail} removed from the list. A backend function is needed to delete the actual Firebase user and their data.` });
    };


    return (
        <div>
        <PageHeader title="Authentication & Roles" />
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>User Role Management</CardTitle>
                    <CardDescription>
                        Assign roles to users to control their access. User management requires backend functions for full security.
                    </CardDescription>
                </div>
                 <AddUserDialog onUserAdded={handleUserAdded} />
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         Array.from({ length: 3 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-[180px]" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No users found. Use the "Add User" button to create one.
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>
                                    <RoleSelector
                                        value={userRoles[user.id] || user.role}
                                        onValueChange={(role) => handleRoleChange(user.id, role)}
                                        disabled={!permissions[currentUserRole].editRole}
                                    />
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleSaveChanges(user.id)}>Save Changes</DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleRemoveUser(user.id, user.email)}
                                            disabled={!permissions[currentUserRole].deleteUser}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            Remove User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        </div>
    );
}
