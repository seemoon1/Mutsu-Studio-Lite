"use client";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Edit2, Save } from "lucide-react";

export const WorldInfoModal = ({ isOpen, onClose, title, content, setContent, onSave }: any) => (
   <AnimatePresence>
      {isOpen && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-2xl w-[500px] border p-5 flex flex-col gap-4">
               <div className="flex justify-between items-center"><div className="font-bold flex items-center gap-2 text-gray-700"><BookOpen size={16} />{title}</div><button onClick={onClose}><X /></button></div>
               <textarea className="w-full h-48 border rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-400" placeholder="在此输入设定..." value={content} onChange={e => setContent(e.target.value)}></textarea>
               <div className="flex justify-end"><button onClick={onSave} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 shadow-md flex items-center gap-2"><Save size={12} /> SAVE</button></div>
            </motion.div>
         </motion.div>
      )}
   </AnimatePresence>
);

export const EditModal = ({ isOpen, onClose, content, setContent, onConfirm }: any) => (
   <AnimatePresence>
      {isOpen && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-full overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-4 border-b flex justify-between items-center bg-gray-50"><div className="font-bold text-gray-700 flex items-center gap-2"><Edit2 size={16} /> 编辑消息</div><button onClick={onClose}><X size={20} /></button></div>
               <div className="p-4 flex-1 overflow-auto"><textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-64 p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm" /></div>
               <div className="p-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">取消</button><button onClick={onConfirm} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 shadow-md">确认重试</button></div>
            </motion.div>
         </motion.div>
      )}
   </AnimatePresence>
);

export const SuggestionModal = ({ isOpen, onClose, content, onConfirm }: any) => (
   <AnimatePresence>
      {isOpen && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-xl shadow-2xl w-[500px] border overflow-hidden">
               <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <span className="font-bold text-emerald-800 text-sm">采纳剧情建议 / Adopt Suggestion</span>
               </div>

               <div className="p-6">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Preview content:</div>
                  <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 leading-relaxed font-medium">
                     {content}
                  </div>
                  <div className="mt-4 text-xs text-gray-400">
                     * 点击确认将直接以你的身份发送此内容。
                  </div>
               </div>

               <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-bold">取消 / Cancel</button>
                  <button onClick={onConfirm} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-md flex items-center gap-2">
                     确认发送 / Send
                  </button>
               </div>
            </motion.div>
         </motion.div>
      )}
   </AnimatePresence>
);