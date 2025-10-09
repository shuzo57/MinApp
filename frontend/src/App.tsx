import { onAuthStateChanged, signOut, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "./auth/firebase";
import LoginScreen from "./components/LoginScreen";
import MainApp from "./components/MainApp";
import Spinner from "./components/Spinner";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    // クリーンアップ関数
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <Spinner />
        <p className="ml-4 text-lg text-gray-600">認証情報を確認中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {user ? (
        <MainApp user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen />
      )}
    </div>
  );
};

export default App;