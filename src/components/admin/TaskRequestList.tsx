"use client";

import { useState } from "react";
import { CheckCircle, Settings, Plus, Trash2, XCircle } from "lucide-react";

interface TaskRequestListProps {
    requests: any[];
    onApprove: (userId: string, comboConfig: any[]) => Promise<boolean>;
    onCancel: (userId: string) => Promise<boolean>;
    isUpdating: boolean;
}

export function TaskRequestList({ requests, onApprove, onCancel, isUpdating }: TaskRequestListProps) {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [comboConfigs, setComboConfigs] = useState<any[]>([]);

    const handleApprove = async () => {
        const success = await onApprove(selectedUser._id, comboConfigs);
        if (success) {
            setSelectedUser(null);
            setComboConfigs([]);
        }
    };

    const handleCancel = async (userId: string) => {
        const success = await onCancel(userId);
        if (success && selectedUser?._id === userId) {
            setSelectedUser(null);
            setComboConfigs([]);
        }
    };

    const addCombo = () => {
        setComboConfigs([...comboConfigs, { grabIndex: 1, requiredDeposit: 0 }]);
    };

    const removeCombo = (idx: number) => {
        setComboConfigs(comboConfigs.filter((_, i) => i !== idx));
    };

    const updateCombo = (idx: number, field: string, value: number) => {
        const newConfigs = [...comboConfigs];
        const safeValue = Number.isFinite(value) ? value : 0;
        newConfigs[idx][field] = safeValue;
        setComboConfigs(newConfigs);
    };

    if (requests.length === 0 && !selectedUser) {
        return (
            <div className="p-12 text-center space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-secondary/5 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-secondary opacity-20" size={32} />
                </div>
                <p className="text-secondary font-medium italic">No pending task requests...</p>
            </div>
        );
    }

    if (selectedUser) {
        return (
            <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <button onClick={() => setSelectedUser(null)} className="mb-6 text-sm font-bold text-secondary hover:text-primary flex items-center gap-1 transition-all">
                    ← Back to selection
                </button>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-xl font-bold">
                        {selectedUser.name[0]}
                    </div>
                    <div>
                        <h3 className="text-xl font-black">{selectedUser.name}</h3>
                        <p className="text-secondary text-sm">{selectedUser.email}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold flex items-center gap-2">
                            <Settings size={18} /> Configure Combine Orders
                        </h4>
                        <button onClick={addCombo} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold flex items-center gap-1 transition-all">
                            <Plus size={14} /> Add Combo Position
                        </button>
                    </div>

                    <div className="space-y-4">
                        {comboConfigs.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-secondary/10 rounded-3xl text-center space-y-2">
                                <p className="text-secondary text-sm font-medium">No combos configured for this batch.</p>
                                <p className="text-[10px] text-zinc-400">User will receive 25 regular orders.</p>
                            </div>
                        ) : comboConfigs.map((config, idx) => (
                            <div key={idx} className="flex gap-4 items-end bg-secondary/5 p-4 rounded-2xl border border-secondary/5">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-secondary tracking-widest">Grab Index (1-25)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="25" 
                                        value={config.grabIndex} 
                                        onChange={(e) => updateCombo(idx, "grabIndex", parseInt(e.target.value))}
                                        className="w-full bg-background border border-secondary/10 px-4 py-2.5 rounded-xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-secondary tracking-widest">Required Deposit ($)</label>
                                    <input 
                                        type="number" 
                                        value={config.requiredDeposit} 
                                        onChange={(e) => updateCombo(idx, "requiredDeposit", parseFloat(e.target.value))}
                                        className="w-full bg-background border border-secondary/10 px-4 py-2.5 rounded-xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <button onClick={() => removeCombo(idx)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            disabled={isUpdating}
                            onClick={handleApprove}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                            {isUpdating ? "Processing..." : "Approve & Configure Tasks"}
                        </button>
                        <button
                            disabled={isUpdating}
                            onClick={() => void handleCancel(selectedUser._id)}
                            className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black tracking-widest uppercase text-xs hover:bg-red-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                            Cancel Request
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-secondary/10 bg-secondary/5">
                        <th className="p-4 sm:p-6 font-bold text-secondary text-xs uppercase tracking-wider">User</th>
                        <th className="p-4 sm:p-6 font-bold text-secondary text-xs uppercase tracking-wider">Status</th>
                        <th className="p-4 sm:p-6 font-bold text-secondary text-xs uppercase tracking-wider">Balance</th>
                        <th className="p-4 sm:p-6 font-bold text-secondary text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((user: any) => (
                        <tr key={user._id} className="border-b border-secondary/5 hover:bg-secondary/5 transition-colors">
                            <td className="p-4 sm:p-6">
                                <div className="font-bold">{user.name}</div>
                                <div className="text-xs text-secondary">{user.email}</div>
                            </td>
                            <td className="p-4 sm:p-6">
                                <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold">PENDING APPROVAL</span>
                            </td>
                            <td className="p-4 sm:p-6 font-black">${user.balance.toFixed(2)}</td>
                            <td className="p-4 sm:p-6">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md active:scale-95 cursor-pointer"
                                    >
                                        Review & Approve
                                    </button>
                                    <button
                                        disabled={isUpdating}
                                        onClick={() => void handleCancel(user._id)}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <XCircle size={14} /> Cancel
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
