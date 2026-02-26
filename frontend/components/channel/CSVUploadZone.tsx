"use client";
import { useCallback, useState } from "react";
import Papa from "papaparse";
import { apiClient } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores/campaignStore";

interface Props {
    channel: "sms" | "whatsapp" | "email" | "voice";
}

const PHONE_COLUMNS = ["phone", "mobile", "number", "phone number", "contact"];
const EMAIL_COLUMNS = ["email", "email_address", "email address", "mail"];

export default function CSVUploadZone({ channel }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const store = useCampaignStore();

    const parseCSV = useCallback((file: File) => {
        setIsUploading(true);
        setError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const headers = results.meta.fields?.map((f) => f.toLowerCase()) || [];
                const isPhoneChannel = ["sms", "whatsapp", "voice"].includes(channel);

                // Auto-detect column
                const targetColumns = isPhoneChannel ? PHONE_COLUMNS : EMAIL_COLUMNS;
                const matchedCol = results.meta.fields?.find((f) =>
                    targetColumns.includes(f.toLowerCase())
                );

                if (!matchedCol) {
                    setError(`No ${isPhoneChannel ? "phone" : "email"} column found. Expected: ${targetColumns.join(", ")}`);
                    setIsUploading(false);
                    return;
                }

                // Parse contacts
                const contacts = results.data.map((row: any) => ({
                    name: row.name || row.Name || row.NAME || "",
                    phone: isPhoneChannel ? (row[matchedCol] || "") : undefined,
                    email: !isPhoneChannel ? (row[matchedCol] || "") : undefined,
                    company: row.company || row.Company || "",
                }));

                try {
                    const resp = await apiClient.post("/csv/upload", {
                        channel,
                        contacts,
                        filename: file.name,
                    });

                    store.setUpload(
                        resp.data.upload_id,
                        contacts,
                        resp.data.valid_count,
                        resp.data.invalid_count
                    );
                } catch (err: any) {
                    setError(err.response?.data?.detail || "Upload failed");
                }

                setIsUploading(false);
            },
            error: (err) => {
                setError(`Parse error: ${err.message}`);
                setIsUploading(false);
            },
        });
    }, [channel, store]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith(".csv")) parseCSV(file);
        else setError("Please upload a .csv file");
    }, [parseCSV]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseCSV(file);
    }, [parseCSV]);

    const downloadSample = () => {
        const isPhone = ["sms", "whatsapp", "voice"].includes(channel);
        const csv = isPhone
            ? "name,phone\nRavi Kumar,9876543210\nPriya Sharma,8765432109\nAmit Patel,7654321098"
            : "name,email\nRavi Kumar,ravi@example.com\nPriya Sharma,priya@example.com";
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sample_${channel}_contacts.csv`;
        a.click();
    };

    if (store.uploadId) {
        return (
            <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-accent-cyan text-lg">✅</span>
                    <h3 className="font-semibold font-[family-name:var(--font-syne)]">Contacts Loaded</h3>
                </div>
                <p className="text-sm text-text-muted">
                    <span className="text-accent-cyan font-medium">{store.validCount} valid</span>
                    {store.invalidCount > 0 && (
                        <span className="text-accent-red"> · {store.invalidCount} invalid</span>
                    )} contacts
                </p>
                <button
                    onClick={() => store.reset()}
                    className="mt-3 text-xs text-text-muted hover:text-accent transition-colors"
                >
                    Upload different CSV
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${isDragging
                        ? "border-accent bg-accent/5"
                        : "border-border-bright hover:border-accent/50 hover:bg-elevated/50"
                    }`}
                onClick={() => document.getElementById("csv-input")?.click()}
            >
                <input
                    id="csv-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileInput}
                />
                <div className="text-4xl mb-3">{isUploading ? "⏳" : "📄"}</div>
                <p className="text-text-primary font-medium">
                    {isUploading ? "Parsing CSV..." : "Drop CSV here or click to browse"}
                </p>
                <p className="text-sm text-text-muted mt-1">
                    Required column: {["sms", "whatsapp", "voice"].includes(channel) ? "phone" : "email"}
                </p>
            </div>

            {error && (
                <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <button onClick={downloadSample} className="text-xs text-accent hover:underline">
                📥 Download sample CSV
            </button>
        </div>
    );
}
