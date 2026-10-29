import ReactGA4 from "react-ga4";
import * as Sentry from "@sentry/react";

function CommonProcess(Component) {
  return function WrappedComponent(props) {
    if (import.meta.env.VITE_APP_ENV === "production") {
      // Google Analytics
      ReactGA4.initialize("G-2KTSFPN6HG");
      ReactGA4.event({
        category: "Engagement",
        action: "page_view",
        label: window.location.pathname,
      });

      // Sentry
      Sentry.init({
        dsn: "https://6be2c2b04c884bba843a65c847bc9f2b@o466285.ingest.sentry.io/4505171611418624",
        integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      });
    }
    return <Component {...props} />;
  };
}

export default CommonProcess;
