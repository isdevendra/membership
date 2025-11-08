'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// This is placeholder data. We will connect this to live Firebase Auth users later.
const users = [
  { id: 'user1', email: 'admin@example.com', role: 'Admin' },
  { id: 'user2', email: 'reception@example.com', role: 'Receptionist' },
  { id: 'user3', email: 'manager@example.com', role: 'Manager' },
  { id: 'user4', email: 'security@example.com', role: 'Security' },
  { id: 'user5', email: 'jane.doe@example.com', role: 'Member' },
];

type Role = 'Admin' | 'Receptionist' | 'Manager' | 'Security' | 'Member';

function RoleSelector({ value, onValueChange }: { value: Role; onValueChange: (role: Role) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as Role)}>
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

export default function AuthRolesPage() {
    const [userRoles, setUserRoles] = React.useState<Record<string, Role>>(
        users.reduce((acc, user) => ({ ...acc, [user.id]: user.role as Role }), {})
    );

    const handleRoleChange = (userId: string, role: Role) => {
        setUserRoles(prev => ({ ...prev, [userId]: role }));
        // In a real app, you would call a function here to update the user's role in Firestore.
    };

    return (
        <div>
        <PageHeader title="Authentication & Roles" />
        <Card>
            <CardHeader>
            <CardTitle>User Role Management</CardTitle>
            <CardDescription>
                Assign roles to users to control their access to different parts of the application.
            </CardDescription>
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
                    {users.map((user) => (
                        <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                            <RoleSelector
                                value={userRoles[user.id]}
                                onValueChange={(role) => handleRoleChange(user.id, role)}
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
                                <DropdownMenuItem>Save Changes</DropdownMenuItem>
                                <DropdownMenuItem>Remove User</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        </div>
    );
}
