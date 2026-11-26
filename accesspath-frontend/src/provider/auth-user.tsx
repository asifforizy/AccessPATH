import { Navbar } from "@/components/shared/navbar";
import { getMe } from "@/services/getMe";

export const AuthUser = async () => {
  const user = await getMe();

  return <Navbar user={user} />;
};
