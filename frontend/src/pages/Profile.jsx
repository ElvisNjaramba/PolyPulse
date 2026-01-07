import { useEffect, useState } from "react";
import { fetchProfile } from "../api/profile";

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile().then(res => setProfile(res.data));
  }, []);

  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <h2>{profile.username}</h2>
      <p>Email: {profile.email}</p>
      <p>Balance: {profile.balance}</p>
    </div>
  );
};

export default Profile;
