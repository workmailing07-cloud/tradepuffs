import { redirect } from "next/navigation";

// Landing page removed — send all visitors straight to login.
export default function RootPage() {
    redirect("/auth/login");
}
