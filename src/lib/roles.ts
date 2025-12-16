export const Role = {
    SuperAdmin: 'Super Admin',
    Admin: 'Admin',
    Manager: 'Manager',
    Receptionist: 'Receptionist',
    Security: 'Security',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const permissions: Record<Role, { createUser: boolean; deleteUser: boolean; editRole: boolean; editUser: boolean; viewReports: boolean; }> = {
    "Super Admin": { createUser: true, deleteUser: true, editRole: true, editUser: true, viewReports: true },
    Admin: { createUser: true, deleteUser: true, editRole: true, editUser: true, viewReports: true },
    Manager: { createUser: true, deleteUser: false, editRole: false, editUser: true, viewReports: true },
    Receptionist: { createUser: true, deleteUser: false, editRole: false, editUser: false, viewReports: false },
    Security: { createUser: false, deleteUser: false, editRole: false, editUser: false, viewReports: false },
};
