import React, { useState } from "react";

export const SourceList = ({ sources }) => {
  const [openGroups, setOpenGroups] = useState({});

  // Group sources by filename + page
  const grouped = sources.reduce((acc, source) => {
    const filename = source.metadata?.source || "Unknown";
    const page = source.metadata?.page ?? "N/A";
    const key = `${filename} (Page ${page})`;

    if (!acc[key]) acc[key] = [];
    acc[key].push(source);
    return acc;
  }, {});

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([groupKey, groupSources]) => (
        <div key={groupKey} className="border rounded-md">
          <button
            className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 font-medium"
            onClick={() => toggleGroup(groupKey)}
          >
            {groupKey}
          </button>
          {openGroups[groupKey] && (
            <div className="p-3 space-y-2">
              {groupSources.map((src, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded p-2 text-sm whitespace-pre-wrap"
                >
                  {src.content}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
