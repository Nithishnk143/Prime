"use client";

import posthog from "posthog-js";

if (typeof window !== "undefined") {
  posthog.init("phc_v1zGl740rSRNUNCouxKTzOdK31AIcRRWXNf4VMpfa4y", {
    api_host: "https://us.i.posthog.com",
    defaults: "2025-05-24",
  });
}
