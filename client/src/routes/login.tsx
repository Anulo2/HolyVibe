import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
  beforeLoad: ({ context }) => {
    if (context.auth.session) {
      throw redirect({
        to: '/dashboard',
      })
    }
  }
});

function LoginComponent() {
  const { signIn } = useAuth();
  return <LoginPage onSignIn={signIn} />;
} 