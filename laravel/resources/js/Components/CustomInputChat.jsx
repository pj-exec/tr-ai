import React, { forwardRef } from "react";
import { faPaperPlane, faSpinner } from "@fortawesome/free-solid-svg-icons";
import ModelSelector from "./ModelSelector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CustomInputChat = forwardRef((props, ref) => {
  const {
    chatText,
    onChange,
    handleInputKeyDown,
    onSendMessage,
    isLoading = false,
    selectedModel,
    handleModelChange,
    name = "chatText",
  } = props;

  return (
    <div className="flex flex-col flex-1 ">
      <ModelSelector
        selectedModel={selectedModel}
        onChange={handleModelChange}
      />
      <div className="flex flex-row flex-1 items-center justify-center">
        <textarea
          ref={ref}
          name={name}
          value={chatText}
          onChange={onChange}
          className="w-[50px] flex-grow mr-2 p-1 rounded border-gray-300 focus:border-blue-500 "
          onKeyDown={handleInputKeyDown}
          style={{
            resize: "none",
            height: "100px",
            maxHeight: "200px",
          }}
        />
        <button
          onClick={onSendMessage}
          className="h-[50px] py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
        >
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
        </button>
      </div>
    </div>
  );
});

export default CustomInputChat;
