import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [users, setUsers] = useState([]);

  async function getUsers() {
    const { data } = await supabase.from("users").select();
    if (data) {
      setUsers(data);
    }
  }

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
