"use client";

import { useEffect } from "react";

export default function AdminCursorOff() {
  useEffect(() => {
    document.documentElement.classList.add("vc-admin");
    return () => document.documentElement.classList.remove("vc-admin");
  }, []);
  return null;
}
