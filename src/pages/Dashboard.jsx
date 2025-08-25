import { useAuth } from "../AuthProvider";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("Signed out!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={handleLogout}>Sign Out</button>
    </div>
  );
}
