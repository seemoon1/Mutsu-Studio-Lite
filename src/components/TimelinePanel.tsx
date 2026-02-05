"use client";
import { useState, useEffect } from "react";
import { Lock, Check, Clock, Calendar, Bookmark, Hash, X } from "lucide-react";

const TimeNode = ({ type, icon: Icon, value, field, label, isEditing, localData, setLocalData }: any) => (
  <div className="relative pl-6 pb-4 last:pb-0">
    <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 to-purple-200 last:hidden"></div>
    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${type === 'major' ? 'bg-purple-600' : type === 'medium' ? 'bg-purple-400' : 'bg-purple-300'}`}>
      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
    </div>
    <div className="flex flex-col gap-1">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${type === 'major' ? 'text-purple-700' : type === 'medium' ? 'text-purple-600' : 'text-purple-500'}`}>
        <span className="flex items-center gap-1"><Icon size={10} /> {label}</span>
      </span>

      {isEditing ? (
        <input
          value={localData[field] || ""}
          onChange={(e) => setLocalData({ ...localData, [field]: e.target.value })}
          className="text-xs border-b border-purple-300 bg-purple-50/50 outline-none focus:border-purple-600 px-1 py-0.5 text-gray-700 w-full font-medium"
          autoFocus={false} 
        />
      ) : (
        <div className="text-xs text-gray-800 font-medium break-words leading-relaxed">
          {value || "..."}
        </div>
      )}
    </div>
  </div>
);

export const TimelinePanel = ({ timelineData, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState({ major: "", medium: "", minor: "" });

  useEffect(() => {
    if (timelineData && !isEditing) {
      setLocalData(timelineData);
    }
  }, [timelineData, isEditing]);

  const handleSave = () => {
    if (confirm("⚠️ 确定要更新时间锚点吗？")) {
      onUpdate(localData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (timelineData) setLocalData(timelineData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-purple-100 rounded-xl shadow-sm overflow-hidden mb-4">
      <div className="bg-purple-50/50 px-3 py-2 border-b border-purple-100 flex justify-between items-center">
        <div className="text-[10px] font-bold text-purple-800 flex items-center gap-1.5">
          <Clock size={12} /> CHRONOS TIMELINE
        </div>
        <div className="flex gap-1">
          {isEditing && (
            <button onClick={handleCancel} className="p-1 rounded text-gray-400 hover:bg-gray-200 transition-colors"><X size={12} /></button>
          )}
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`p-1 rounded transition-colors ${isEditing ? 'text-white bg-purple-500 hover:bg-purple-600 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}
          >
            {isEditing ? <Check size={12} /> : <Lock size={12} />}
          </button>
        </div>
      </div>

      <div className="p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <TimeNode
          type="major" icon={Calendar} label="Era"
          field="major" value={localData.major}
          isEditing={isEditing} localData={localData} setLocalData={setLocalData}
        />
        <TimeNode
          type="medium" icon={Bookmark} label="Period"
          field="medium" value={localData.medium}
          isEditing={isEditing} localData={localData} setLocalData={setLocalData}
        />
        <TimeNode
          type="minor" icon={Hash} label="Event"
          field="minor" value={localData.minor}
          isEditing={isEditing} localData={localData} setLocalData={setLocalData}
        />
      </div>
    </div>
  );
};