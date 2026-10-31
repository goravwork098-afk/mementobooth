import { auth } from "@/auth";
import { LandingView } from "./components/landing-view";

export default async function Page() {
  const session = await auth();

  return (
    <LandingView
      isAuthenticated={!!session?.user}
      userName={session?.user?.name ?? null}
    />
  );
}
