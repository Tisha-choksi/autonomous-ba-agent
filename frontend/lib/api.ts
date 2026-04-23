const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Request failed");
    }
    return res.json();
}

export const api = {
    uploadFile: async (file: File) => {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
    },
    uploadPaste: (rawText: string, fmt: "csv" | "json" = "csv", name = "pasted_data") =>
        request("/api/upload/paste", { method: "POST", body: JSON.stringify({ raw_text: rawText, fmt, name }) }),
    uploadFromURL: (url: string) =>
        request("/api/upload/url", { method: "POST", body: JSON.stringify({ url }) }),
    uploadSQLite: async (file: File, tableName?: string) => {
        const form = new FormData();
        form.append("file", file);
        if (tableName) form.append("table_name", tableName);
        const res = await fetch(`${BASE_URL}/api/upload/sqlite`, { method: "POST", body: form });
        if (!res.ok) throw new Error("SQLite upload failed");
        return res.json();
    },
    getSessions: () => request("/api/sessions"),
    getSession: (id: string) => request(`/api/sessions/${id}`),
    deleteSession: (id: string) => request(`/api/sessions/${id}`, { method: "DELETE" }),
    reloadSession: (id: string) => request(`/api/sessions/${id}/reload`, { method: "POST" }),
    getEDA: (id: string) => request(`/api/eda/${id}`),
    getKPIs: (id: string) => request(`/api/kpis/${id}`),
    getInsights: (id: string) => request(`/api/insights/${id}`),
    refreshInsights: (id: string) => request(`/api/insights/${id}/refresh`, { method: "POST" }),
    getDataQuality: (id: string) => request(`/api/quality/${id}`),
    getData: (id: string, page = 1, pageSize = 50, search?: string, sortCol?: string, sortDesc = false) => {
        const p = new URLSearchParams({ page: String(page), page_size: String(pageSize), sort_desc: String(sortDesc), ...(search && { search }), ...(sortCol && { sort_col: sortCol }) });
        return request(`/api/data/${id}?${p}`);
    },
    createViz: (params: { session_id: string; chart_type: string; x_col?: string; y_col?: string; color_col?: string; title?: string }) =>
        request("/api/visualize", { method: "POST", body: JSON.stringify(params) }),
    chat: (sessionId: string, message: string, provider = "groq") =>
        request("/api/chat", { method: "POST", body: JSON.stringify({ session_id: sessionId, message, provider }) }),
    getChatHistory: (id: string) => request(`/api/chat/${id}/history`),
    forecast: (sessionId: string, valueCol: string, periods = 12) =>
        request("/api/forecast", { method: "POST", body: JSON.stringify({ session_id: sessionId, value_col: valueCol, periods }) }),
    segment: (sessionId: string, nClusters = 4, columns?: string[]) =>
        request("/api/segment", { method: "POST", body: JSON.stringify({ session_id: sessionId, n_clusters: nClusters, columns }) }),
    cleanData: (sessionId: string, operations: string[]) =>
        request("/api/clean", { method: "POST", body: JSON.stringify({ session_id: sessionId, operations }) }),
    generatePDF: (id: string) => request(`/api/reports/pdf/${id}`, { method: "POST" }),
    generateExcel: (id: string) => request(`/api/reports/excel/${id}`, { method: "POST" }),
    listReports: (id: string) => request(`/api/reports/${id}`),
    getDownloadURL: (fileName: string) => `${BASE_URL}/api/reports/download/${fileName}`,
};