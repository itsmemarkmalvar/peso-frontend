"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getDepartments } from "@/lib/api/departments";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface Department {
  id: number;
  name: string;
  code: string | null;
}

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationRequest: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  onApprove: (role: string, departmentId: number | null) => Promise<void>;
}

export function ApprovalModal({
  open,
  onOpenChange,
  registrationRequest,
  onApprove,
}: ApprovalModalProps) {
  const { user } = useAuth();
  const isSupervisor = user?.role === "supervisor";
  const [role, setRole] = useState<string>("intern");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadDepartments();
      // Reset form when modal opens
      setRole(isSupervisor ? "intern" : "intern");
      setDepartmentId("");
    }
  }, [open, isSupervisor]);

  const loadDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleApprove = async () => {
    if (!registrationRequest) return;

    // Validate: Department is required for intern and GIP roles
    if ((role === "intern" || role === "gip") && !departmentId) {
      alert(`Please select a department for ${role} role.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove(isSupervisor ? "intern" : role, departmentId ? parseInt(departmentId) : null);
      onOpenChange(false);
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Approve Registration Request</DialogTitle>
          <DialogDescription>
            Assign a role and department for <span className="font-medium text-slate-900">{registrationRequest.full_name}</span> ({registrationRequest.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="role" className="text-sm font-semibold text-slate-700">
              Role <span className="text-red-600">*</span>
            </Label>
            {isSupervisor ? (
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">Role is fixed for supervisors</span>
                <Badge variant="secondary">Intern</Badge>
              </div>
            ) : (
              <>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <option value="admin">Administrator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="gip">GIP</option>
                  <option value="intern">Intern</option>
                </Select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Select the role for this user account
                </p>
              </>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="department" className="text-sm font-semibold text-slate-700">
              Department / Office {(role === "intern" || role === "gip") && <span className="text-red-600">*</span>}
            </Label>
            <Select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={isSubmitting || isLoadingDepartments}
              placeholder={
                isLoadingDepartments
                  ? "Loading departments..."
                  : "Select a department"
              }
              className="w-full"
            >
              {departments.length === 0 && !isLoadingDepartments && (
                <option value="" disabled>
                  No departments available
                </option>
              )}
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name} {dept.code && `(${dept.code})`}
                </option>
              ))}
            </Select>
            <p className="text-xs text-slate-500 mt-1.5">
              {(role === "intern" || role === "gip")
                ? `Required: Select the department where this ${role} will be deployed`
                : "Optional: Assign to a specific department"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="min-w-[100px] border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting || ((role === "intern" || role === "gip") && !departmentId)}
            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
          >
            {isSubmitting ? "Processing..." : "Confirm Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
