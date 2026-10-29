import React from "react";
import { CHAT_MODELS } from "./Common/constant";

export default function ModelSelector({ selectedModel, onChange }) {
  return (
    <div className="flex items-start w-full max-w-sm mb-2 ">
      <select
        id="model"
        name="model"
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
      >
        {CHAT_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}
