import { addCacheBuster } from "@/lib/utils/cache-buster";
import { useState, useEffect, useCallback } from "react";
import { buildApiHeaders } from "@/lib/utils/api-headers";
import env from "@/env.ts";


export interface WSPlatformInfo {
    isDesktop: boolean;
    isLinux: boolean;
    isMacOS: boolean;
    isMobile: boolean;
    isPhone: boolean;
    isTablet: boolean;
    isWin: boolean;
}

export interface WSClientInfo {
    uid: string;
    nickname: string;
    clientName: string;
    clientType: string;
    clientVersion: string;
    platformInfo: WSPlatformInfo;
    remoteAddr: string;
    startTime: string;
    traceId: string;
    tokenId: number;
}

export function useWSClientInfo() {
    const [clients, setClients] = useState<WSClientInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const token = localStorage.getItem("token");

    const fetchWSClientInfo = useCallback(async (isActive?: { current: boolean }) => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/ws_clients"), {
                method: "GET",
                headers: buildApiHeaders({
                    token,
                    includeDomain: false,
                }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const res = await response.json();
            if (isActive && !isActive.current) {
                return;
            }
            if (res.code === 1 || res.status === true) {
                setClients(res.data || []);
            } else {
                setError(res.message || "Failed to get WS clients");
            }
        } catch (err: unknown) {
            if (isActive && !isActive.current) {
                return;
            }
            const error = err as Error;
            if (error.name === "AbortError") {
                return;
            }
            setError("Failed to get WS clients");
            console.error("WS client fetch error:", error);
        } finally {
            if (!isActive || isActive.current) {
                setIsLoading(false);
            }
        }
    }, [token]);

    const kickClient = useCallback(async (traceId: string) => {
        if (!token) return;
        try {
            const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/ws_client/" + traceId), {
                method: "DELETE",
                headers: buildApiHeaders({
                    token,
                    includeDomain: false,
                }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const res = await response.json();
            if (res.code === 1 || res.status === true) {
                fetchWSClientInfo();
                return true;
            } else {
                throw new Error(res.message || "Failed to kick client");
            }
        } catch (err: unknown) {
            console.error("WS client kick error:", err);
            throw err;
        }
    }, [token, fetchWSClientInfo]);

    useEffect(() => {
        const isActive = { current: true };
        fetchWSClientInfo(isActive);
        return () => {
            isActive.current = false;
        };
    }, [fetchWSClientInfo]);

    return {
        clients,
        isLoading,
        error,
        refresh: fetchWSClientInfo,
        kickClient
    };
}
