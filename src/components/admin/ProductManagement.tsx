"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { Upload, Plus, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProductManagement() {
    const qc = useQueryClient();
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const productsQuery = useQuery({
        queryKey: ["admin-products"],
        queryFn: () => adminService.getProducts(),
    });

    const createMutation = useMutation({
        mutationFn: (body: { name: string; image: string }) => adminService.createProduct(body),
        onSuccess: async () => {
            toast.success("Product added");
            setName("");
            setImage("");
            await qc.invalidateQueries({ queryKey: ["admin-products"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const patchMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => adminService.updateProduct(id, body),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["admin-products"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteProduct(id),
        onSuccess: async () => {
            toast.success("Product deleted");
            await qc.invalidateQueries({ queryKey: ["admin-products"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload/product-image", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            setImage(data.secureUrl || "");
            toast.success("Image uploaded");
        } catch (e: any) {
            toast.error(e.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 sm:p-8 space-y-7">
            <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary">Add Product For Spinner</h3>
                <div className="grid md:grid-cols-3 gap-3">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Product name"
                        className="px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl text-sm outline-none focus:border-primary/40"
                    />
                    <input
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Image URL"
                        className="px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl text-sm outline-none focus:border-primary/40"
                    />
                    <div className="flex gap-2">
                        <label className="flex-1 px-4 py-3 bg-secondary/10 hover:bg-secondary/20 rounded-2xl text-sm font-bold cursor-pointer flex items-center justify-center gap-2">
                            <Upload size={16} />
                            {isUploading ? "Uploading..." : "Upload"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handleUpload(file);
                                }}
                            />
                        </label>
                        <button
                            onClick={() => createMutation.mutate({ name: name.trim(), image: image.trim() })}
                            disabled={createMutation.isPending || !name.trim() || !image.trim()}
                            className="px-4 py-3 bg-primary text-white rounded-2xl font-bold text-sm disabled:opacity-50 cursor-pointer"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
                {image && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-secondary/10">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-secondary">Product Catalog</h3>
                    <button onClick={() => productsQuery.refetch()} className="p-2 rounded-xl hover:bg-secondary/10 cursor-pointer">
                        <RefreshCw size={16} className={cn(productsQuery.isFetching && "animate-spin")} />
                    </button>
                </div>
                {productsQuery.isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-secondary/10 rounded-xl animate-pulse" />)}
                    </div>
                ) : (productsQuery.data || []).length === 0 ? (
                    <div className="py-10 text-center text-secondary">No products added yet.</div>
                ) : (
                    <div className="space-y-2">
                        {(productsQuery.data || []).map((p: any) => (
                            <div key={p._id} className="flex items-center gap-3 p-3 bg-secondary/5 border border-secondary/10 rounded-2xl">
                                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-secondary/10" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate">{p.name}</div>
                                    <div className="text-xs text-secondary">{p.isActive ? "Active" : "Hidden"}</div>
                                </div>
                                <button
                                    onClick={() => patchMutation.mutate({ id: p._id, body: { isActive: !p.isActive } })}
                                    className="p-2 rounded-xl bg-secondary/10 hover:bg-secondary/20 cursor-pointer"
                                    title={p.isActive ? "Hide" : "Show"}
                                >
                                    {p.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate(p._id)}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
