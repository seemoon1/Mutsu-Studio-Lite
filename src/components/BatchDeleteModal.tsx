"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Lock } from "lucide-react";

export const BatchDeleteModal = ({ isOpen, onClose, count, onConfirm }: any) => {
    const [code, setCode] = useState("");
    const [phrase, setPhrase] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        setLoading(true);

        if (phrase !== "我确定删除这些对话") {
            setError("确认语输入错误！请严格输入：我确定删除这些对话");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                body: JSON.stringify({ code: code })
            });

            if (res.ok) {
                onConfirm();
                onClose();
            } else {
                setError("Access Code 错误！");
            }
        } catch (e) {
            setError("验证服务连接失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-t-4 border-red-600">

                        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                            <div className="p-3 bg-red-100 rounded-full text-red-600 mb-3">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-xl font-black text-red-700">NUCLEAR LAUNCH DETECTED</h2>
                            <p className="text-sm text-red-600/80 mt-1">
                                即将永久销毁 <span className="font-bold underline">{count}</span> 个平行世界。
                                <br />此操作 **绝对无法撤销**。
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                    <Lock size={12} /> Security Access Code
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    placeholder="请输入 .env.local 中的密码"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                                    Confirmation Phrase
                                </label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    placeholder="输入：我确定删除这些对话"
                                    value={phrase}
                                    onChange={e => setPhrase(e.target.value)}
                                    onPaste={e => e.preventDefault()} 
                                />
                            </div>

                            {error && <div className="text-xs text-red-500 font-bold text-center animate-pulse">{error}</div>}

                            <div className="flex gap-2 pt-2">
                                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50">
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? "VERIFYING..." : <><Trash2 size={16} /> CONFIRM DELETE</>}
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};