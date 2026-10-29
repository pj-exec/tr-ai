import React from "react";
import { IMAGE_EDIT_MODELS } from "./Common/constant";

export default function ImageModelSelector({ selectedModel, onChange }) {
  return (
    <div className="flex flex-row items-center w-full max-w-sm gap-2 ">
      <label className="font-medium text-sm text-gray-700">Model:</label>
      <select
        id="model"
        name="model"
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
      >
        {IMAGE_EDIT_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}
