
import { ForgotPasswordForm } from "@/components/form/forgot-password";
import { Suspense } from "react";


export default function ForgotPasswordPage() {
    return (<main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Suspense fallback={<div>Loading forgot password form...</div>}>
            <ForgotPasswordForm />
        </Suspense> </main>
    );
}
