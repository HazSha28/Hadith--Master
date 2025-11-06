import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const userData = { email: foundUser.email, fullName: foundUser.fullName };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return { error: null };
      }
      
      return { error: { message: "Invalid email or password" } };
    } catch (error) {
      return { error: { message: "An error occurred during login" } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      if (users.find((u: any) => u.email === email)) {
        return { error: { message: "Email already exists" } };
      }
      
      const newUser = { email, password, fullName };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      
      const userData = { email, fullName };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return { error: null };
    } catch (error) {
      return { error: { message: "An error occurred during signup" } };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem("user");
      return { error: null };
    } catch (error) {
      return { error: { message: "An error occurred during logout" } };
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
