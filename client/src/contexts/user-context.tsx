import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Employee } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface UserContextType {
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Use the authenticated user's employee profile if available
        if (isAuthenticated && authUser?.employeeProfile) {
          setCurrentUser(authUser.employeeProfile);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, [authUser, isAuthenticated]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}