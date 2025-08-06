"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Users, Save, X, Edit, Trash2 } from "lucide-react"

interface User {
  id: string
  user_id?: string
  full_name: string
  email: string
  role: "admin" | "cashier" | "kitchen"
  is_active: boolean
  created_at: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "cashier" as "admin" | "cashier" | "kitchen",
    password: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const showSuccess = (message: string) => {
    toast({ title: "Success", description: message, variant: "default" })
  }

  const showError = (message: string) => {
    toast({ title: "Error", description: message, variant: "destructive" })
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      showError("Failed to fetch users.")
    } finally {
      setLoading(false)
    }
  }

  const saveUser = async () => {
    if (!newUser.email || !newUser.full_name) {
      showError("Please fill in all required fields.")
      return
    }
    if (!editingUser && !newUser.password) {
      showError("Password is required for new users.")
      return
    }
    setSaving(true)
    try {
      if (editingUser) {
        const { error } = await supabase
          .from("staff_profiles")
          .update({
            full_name: newUser.full_name,
            role: newUser.role,
            is_active: newUser.is_active,
          })
          .eq("id", editingUser.id)
        if (error) throw error
        showSuccess("User updated successfully!")
      } else {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
            full_name: newUser.full_name,
            role: newUser.role,
            is_active: newUser.is_active,
          }),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Failed to create user');
        }
        
        showSuccess("User created successfully!")
      }
      cancelEdit()
      fetchUsers()
    } catch (error: any) {
      console.error("Error saving user:", error)
      showError(error.message || "Failed to save user.")
    } finally {
      setSaving(false)
    }
  }
  
  const deleteUser = async (user: User) => {
     if (!window.confirm(`Are you sure you want to delete user ${user.full_name}? This will also remove their authentication record and cannot be undone.`)) {
      return
    }
    try {
      if (!user.user_id) {
        throw new Error ("User does not have an associated auth ID.")
      }
      
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.user_id }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to delete user');
      }

      showSuccess("User deleted successfully.")
      fetchUsers()
    } catch(error: any) {
      console.error("Error deleting user:", error)
      showError(error.message || "Failed to delete user.")
    }
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setNewUser({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: "",
      is_active: user.is_active,
    })
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setNewUser({
      full_name: "",
      email: "",
      role: "cashier",
      password: "",
      is_active: true,
    })
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add/Edit User Form */}
        <Card className="md:col-span-1 bg-white border-brand-caramel/20 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-brand-navy flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {editingUser ? "Edit User" : "Add New User"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userName" className="text-brand-navy font-medium">
                Full Name *
              </Label>
              <Input
                id="userName"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                className="border-brand-caramel/30 focus:border-brand-caramel"
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <Label htmlFor="userEmail" className="text-brand-navy font-medium">
                Email *
              </Label>
              <Input
                id="userEmail"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="border-brand-caramel/30 focus:border-brand-caramel"
                placeholder="e.g., user@example.com"
                disabled={!!editingUser}
              />
            </div>
            {!editingUser && (
                <div>
                  <Label htmlFor="userPassword">Password *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={newUser.password || ""}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 8 characters"
                  />
                </div>
            )}
            <div>
              <Label htmlFor="userRole" className="text-brand-navy font-medium">
                Role *
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value: "admin" | "cashier" | "kitchen") =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="user-active"
                checked={newUser.is_active}
                onCheckedChange={(checked) => setNewUser({ ...newUser, is_active: checked })}
              />
              <Label htmlFor="user-active">User is Active</Label>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button onClick={saveUser} disabled={saving} className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white">
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />{editingUser ? "Update User" : "Add User"}</>
                )}
              </Button>
              {editingUser && (
                <Button onClick={cancelEdit} variant="outline">
                  <X className="h-4 w-4 mr-2" />Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="md:col-span-2 bg-white border-brand-caramel/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-brand-navy">Current Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-brand-navy">{user.full_name}</h3>
                        <Badge className={`${user.is_active ? "bg-green-500" : "bg-gray-500"} text-white capitalize`}>{user.role}</Badge>
                        <Badge className={`${user.is_active ? "bg-green-500" : "bg-gray-500"} text-white`}>{user.is_active ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-block">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUser(user)}
                                disabled={!user.user_id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!user.user_id && (
                            <TooltipContent>
                              <p>Cannot delete users without an auth record.</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    </div>
                    <p className="text-sm text-brand-medium-brown">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
} 