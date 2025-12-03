import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; 
import { Loader2 } from "lucide-react"; // Import a spinner icon

const ConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  continueText = 'Continue',
  variant = 'default', // 'default' | 'destructive'
  isLoading = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Disable cancel while loading */}
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault(); // Prevent auto-closing
              onConfirm();
            }}
            disabled={isLoading}
            className={`${
              variant === 'destructive' 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white' 
                : ''
            }`}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {continueText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;