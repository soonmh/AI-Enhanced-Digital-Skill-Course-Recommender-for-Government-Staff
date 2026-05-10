"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useUsers, deleteUser, createUser, updateUser, assignCoursesToUser, unassignCoursesFromUser, useCourses, useAssignedCourses } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";
import { Users, Search, ChevronUp, ChevronDown, Trash2, Plus, Eye, Pencil, ShieldCheck, UserCog, Crown, GraduationCap, BookOpen } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SortField = "name" | "email" | "role" | "created_at";
type SortDir = "asc" | "desc";

const ROLES = ["Admin", "Staff", "Top Management", "Trainer"];

export default function AdminUsersPage() {
  const { users, isLoading, mutate } = useUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Modal state
  const [viewUser, setViewUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Form state for Add/Edit
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [assignUser, setAssignUser] = useState<any>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<{ courseId: number; title: string } | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const { courses: allCourses } = useCourses();
  const { assignedCourseIds, mutate: mutateAssigned } = useAssignedCourses(assignUser ? String(assignUser.id) : null);

  const allUsers = useMemo(() => users || [], [users]);

  const roles = Array.from(new Set(allUsers.map((u: any) => u.role).filter(Boolean))) as string[];

  const filtered = useMemo(() => {
    return allUsers
      .filter((u: any) => {
        const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || u.role === roleFilter;
        return matchSearch && matchRole;
      })
      .sort((a: any, b: any) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [allUsers, search, roleFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((u: any) => u.id)));
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} users?`)) return;
    try {
      for (const id of Array.from(selected)) await deleteUser(String(id));
      toast.success(`Deleted ${selected.size} users`);
      setSelected(new Set());
      mutate();
    } catch {
      toast.error("Failed to delete users");
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await createUser(form);
      toast.success("User created successfully");
      setShowAdd(false);
      setForm({});
      mutate();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateUser(String(editUser.id), form);
      toast.success("User updated successfully");
      setEditUser(null);
      setForm({});
      mutate();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignUser || selectedCourses.size === 0) return;
    setSaving(true);
    try {
      await assignCoursesToUser(String(assignUser.id), Array.from(selectedCourses));
      toast.success(`Assigned ${selectedCourses.size} course(s) to ${assignUser.name}`);
      setAssignUser(null);
      setSelectedCourses(new Set());
      mutate();
    } catch {
      toast.error("Failed to assign courses");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: any) => {
    setForm({
      name: u.name || "",
      email: u.email || "",
      working_field: u.working_field || "",
      job_level: u.job_level || "",
      role: u.role || "Staff",
      is_active: u.is_active ? "1" : "0",
    });
    setEditUser(u);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field ? (sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : null
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Skeleton className="h-9 w-48 mb-1" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl mb-8" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-100 text-red-700";
      case "Staff": return "bg-blue-100 text-blue-700";
      case "Trainer": return "bg-green-100 text-green-700";
      case "Top Management": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-500";
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-MY", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
          <Button onClick={() => { setForm({}); setShowAdd(true); }}>
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card><CardContent className="p-5"><div className="flex items-center gap-3"><div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm"><Users className="w-5 h-5 text-white" /></div><div><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold">{allUsers.length}</p></div></div></CardContent></Card>
          {roles.map((role: string) => {
            const count = allUsers.filter((u: any) => u.role === role).length;
            const cfg: Record<string, { icon: any; gradient: string; label: string }> = {
              "Admin": { icon: ShieldCheck, gradient: "from-red-500 to-rose-600", label: "Admins" },
              "Staff": { icon: UserCog, gradient: "from-sky-500 to-cyan-600", label: "Staff" },
              "Top Management": { icon: Crown, gradient: "from-amber-500 to-orange-500", label: "Top Management" },
              "Trainer": { icon: GraduationCap, gradient: "from-emerald-500 to-teal-600", label: "Trainers" },
            };
            const c = cfg[role] || { icon: Users, gradient: "from-gray-400 to-gray-500", label: role };
            const Icon = c.icon;
            return (
              <Card key={role}><CardContent className="p-5"><div className="flex items-center gap-3"><div className={`p-3 bg-gradient-to-br ${c.gradient} rounded-xl shadow-sm`}><Icon className="w-5 h-5 text-white" /></div><div><p className="text-sm text-gray-500">{c.label}</p><p className="text-2xl font-bold">{count}</p></div></div></CardContent></Card>
            );
          }).slice(0, 3)}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm">
                <option value="">All Roles</option>
                {roles.map((r: string) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-base font-semibold text-gray-900">User Directory</h2>
              <span className="text-sm text-gray-500">{filtered.length} users</span>
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-b text-sm">
                <span className="font-medium text-blue-700">{selected.size} selected</span>
                <button onClick={handleBulkDelete} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 w-10">
                      <input type="checkbox" checked={paged.length > 0 && selected.size === paged.length} onChange={toggleAll} className="rounded" />
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                      <span className="flex items-center gap-1">User <SortIcon field="name" /></span>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 cursor-pointer select-none" onClick={() => toggleSort("email")}>
                      <span className="flex items-center gap-1">Email <SortIcon field="email" /></span>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 cursor-pointer select-none" onClick={() => toggleSort("role")}>
                      <span className="flex items-center gap-1">Role <SortIcon field="role" /></span>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">Field</th>
                    <th className="text-left p-4 font-medium text-gray-700 cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                      <span className="flex items-center gap-1">Date Joined <SortIcon field="created_at" /></span>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">No users found</td></tr>
                  ) : (
                    paged.map((u: any) => (
                      <tr key={u.id} className={`border-b hover:bg-gray-50 transition-colors ${selected.has(u.id) ? "bg-blue-50" : ""}`}>
                        <td className="p-4">
                          <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="rounded" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <UserAvatar name={u.name} size={36} />
                              <OnlineIndicator userId={u.id} />
                            </div>
                            <span className="font-medium text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">{u.working_field || "-"}</td>
                        <td className="p-4 text-gray-600">{formatDate(u.created_at)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(u.is_active ?? true)}`}>
                            {(u.is_active ?? true) ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewUser(u)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setAssignUser(u); setSelectedCourses(new Set()); setAssignSearch(""); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-violet-600 transition-colors" title="Assign Course">
                              <BookOpen className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {[10, 25, 50].map((n) => (
                  <button key={n} onClick={() => { setPageSize(n); setPage(1); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${pageSize === n ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>{n}</button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">&laquo;</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">&lsaquo;</button>
                <span className="px-3 text-gray-600">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">&rsaquo;</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">&raquo;</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View User Modal */}
      <Dialog open={!!viewUser} onOpenChange={(open) => { if (!open) setViewUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View user account information</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="grid gap-3 py-2">
              <div className="flex items-center gap-3 pb-3 border-b">
                <UserAvatar name={viewUser.name} size={48} />
                <div>
                  <p className="font-semibold text-gray-900">{viewUser.name}</p>
                  <p className="text-sm text-gray-500">{viewUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Role</span><p className="font-medium">{viewUser.role || "-"}</p></div>
                <div><span className="text-gray-500">Status</span><p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(viewUser.is_active ?? true)}`}>{(viewUser.is_active ?? true) ? "Active" : "Inactive"}</span></p></div>
                <div><span className="text-gray-500">Working Field</span><p className="font-medium">{viewUser.working_field || "-"}</p></div>
                <div><span className="text-gray-500">Job Level</span><p className="font-medium">{viewUser.job_level || "-"}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Date Joined</span><p className="font-medium">{formatDate(viewUser.created_at)}</p></div>
              </div>
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) setShowAdd(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="add-name">Name</Label>
              <Input id="add-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-email">Email</Label>
              <Input id="add-email" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-password">Password</Label>
              <Input id="add-password" type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="add-role">Role</Label>
                <select id="add-role" value={form.role || "Staff"} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="add-field">Working Field</Label>
                <Input id="add-field" value={form.working_field || ""} onChange={(e) => setForm({ ...form, working_field: e.target.value })} placeholder="e.g. IT" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="add-level">Job Level</Label>
                <Input id="add-level" value={form.job_level || ""} onChange={(e) => setForm({ ...form, job_level: e.target.value })} placeholder="e.g. Manager" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.name || !form.email || !form.password}>
              {saving ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) { setEditUser(null); setForm({}); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-role">Role</Label>
                <select id="edit-role" value={form.role || "Staff"} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-status">Status</Label>
                <select id="edit-status" value={form.is_active ?? "1"} onChange={(e) => setForm({ ...form, is_active: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-field">Working Field</Label>
                <Input id="edit-field" value={form.working_field || ""} onChange={(e) => setForm({ ...form, working_field: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-level">Job Level</Label>
                <Input id="edit-level" value={form.job_level || ""} onChange={(e) => setForm({ ...form, job_level: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditUser(null); setForm({}); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Course Modal */}
      <Dialog open={!!assignUser} onOpenChange={(open) => { if (!open) { setAssignUser(null); setSelectedCourses(new Set()); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Courses</DialogTitle>
            <DialogDescription>Select courses to assign to {assignUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              type="text"
              placeholder="Search courses..."
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(allCourses || [])
                .filter((c: any) => !assignSearch || c.title?.toLowerCase().includes(assignSearch.toLowerCase()))
                .map((c: any) => {
                  const isAssigned = assignedCourseIds.includes(c.id);
                  return (
                    <label key={c.id} className={`flex items-center gap-3 p-2 rounded-lg ${isAssigned ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={isAssigned || selectedCourses.has(c.id)}
                        disabled={isAssigned}
                        onChange={() => {
                          setSelectedCourses((prev) => {
                            const next = new Set(prev);
                            if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                            return next;
                          });
                        }}
                        className="rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                        {c.level && <p className="text-xs text-gray-500">{c.level}</p>}
                      </div>
                      {isAssigned && (
                        <button
                          onClick={() => setRemoveTarget({ courseId: c.id, title: c.title })}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </label>
                  );
                })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignUser(null); setSelectedCourses(new Set()); }}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || selectedCourses.size === 0}>
              {saving ? "Assigning..." : `Assign ${selectedCourses.size} Course(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Course Confirmation */}
      <Dialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeTarget?.title}</strong> from <strong>{assignUser?.name}</strong>?
              The course will be moved to their Archived tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!removeTarget || !assignUser) return;
                try {
                  await unassignCoursesFromUser(String(assignUser.id), [removeTarget.courseId]);
                  toast.success(`Removed ${removeTarget.title} from ${assignUser.name}`);
                  mutateAssigned();
                  setRemoveTarget(null);
                } catch {
                  toast.error("Failed to remove course");
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
