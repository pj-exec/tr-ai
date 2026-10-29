import React from "react";
import { IMAGE_GENERATE_NUMBER } from "./Common/constant";

const ImageNumberSelector = (props) => {
  const { value, onChange } = props;

  return (
    <div className="flex items-center w-full max-w-md mb-2 gap-2">
      <label className="font-medium text-sm text-gray-700">
        Number of Output:
      </label>
      <select
        id="numberOption"
        name="numberOption"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-1/2 rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
      >
        {IMAGE_GENERATE_NUMBER.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ImageNumberSelector;
