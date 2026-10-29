import React, { lazy, Suspense } from "react";
import Loader from "@/Components/Loader";

const WelcomeLayout = lazy(() => import("@/Layouts/WelcomeLayout"));

export default function Welcome({
  auth,
  laravelVersion,
  phpVersion,
  appVersion,
}) {
  return (
    <Suspense fallback={<Loader />}>
      <WelcomeLayout
        user={auth.user}
        laravelVersion={laravelVersion}
        phpVersion={phpVersion}
        appVersion={appVersion}
      />
    </Suspense>
  );
}
