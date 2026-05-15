import { useState, useCallback, useEffect, useRef } from "react";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { buildApiHeaders } from "@/lib/utils/api-headers";
import { useTranslation } from "react-i18next";
import env from "@/env.ts";


export interface SupportRecord {
    amount: string;
    item: string;
    message: string;
    name: string;
    time: string;
    unit: string;
}

export interface SupportPager {
    page: number;
    pageSize: number;
    totalRows: number;
}

export function useSupport() {
    const { i18n } = useTranslation();
    const [supportList, setSupportList] = useState<SupportRecord[]>([]);
    const [pager, setPager] = useState<SupportPager>({ page: 1, pageSize: 15, totalRows: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const activeRequestIdRef = useRef<number>(0);

    const fetchSupport = useCallback(async (page: number = 1, pageSize: number = 15, sortBy: string = "amount", sortOrder: string = "desc") => {
        const requestId = ++activeRequestIdRef.current;

        setIsLoading(true);
        setError(null);
        try {
            const pageStr = Math.floor(page).toString();
            const pageSizeStr = Math.floor(pageSize).toString();
            let url = `${env.API_URL}/api/support?page=${pageStr}&pageSize=${pageSizeStr}&lang=${i18n.language}`;
            if (sortBy) url += `&sortBy=${sortBy}`;
            if (sortOrder) url += `&sortOrder=${sortOrder}`;

            const response = await fetch(addCacheBuster(url), {
                method: "GET",
                headers: buildApiHeaders({
                    token: null,
                    includeDomain: false,
                }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const res = await response.json();
            if (activeRequestIdRef.current !== requestId) {
                return;
            }
            if (res.code === 0 || (res.code < 100 && res.code > 0)) {
                if (res.data && Array.isArray(res.data.list)) {
                    setSupportList(res.data.list || []);
                    setPager(res.data.pager || { page, pageSize, totalRows: 0 });
                } else if (Array.isArray(res.data)) {
                    setSupportList(res.data || []);
                    setPager({ page: 1, pageSize: res.data.length, totalRows: res.data.length });
                } else {
                    setSupportList([]);
                    setPager({ page, pageSize, totalRows: 0 });
                }
            } else {
                setError(res.message || "Failed to get support records");
            }
        } catch (error) {
            if (activeRequestIdRef.current !== requestId) {
                return;
            }
            setError("Failed to get support records");
            console.error("Support fetch error:", error);
        } finally {
            if (activeRequestIdRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [i18n.language]);

    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            activeRequestIdRef.current++;
        };
    }, []);

    return {
        supportList,
        pager,
        isLoading,
        error,
        refresh: fetchSupport
    };
}
