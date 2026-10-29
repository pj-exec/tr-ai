import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-json";
import "prismjs/components/prism-batch";
import "prismjs/components/prism-powershell";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-css";
import "prismjs/components/prism-git";
import "prismjs/components/prism-go";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-regex";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-dart";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-dot";

export default function CodeSnippet({ value, customCodeStyle }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const textTemp = document.createElement("textarea");
    textTemp.name = value.code;
    textTemp.value = value.code;
    document.body.appendChild(textTemp);
    textTemp.select();
    document.execCommand("copy");
    document.body.removeChild(textTemp);
    setCopied(true);
  };

  useEffect(() => {
    Prism.highlightAll();
  }, []);
  return (
    <div>
      {value && value.code && (
        <div>
          <div className="flex items-center relative text-white bg-gray-500 px-3 py-2 text-xs font-sans justify-between rounded-t-md">
            <span>{value.language}</span>
            <button className="flex ml-auto gap-1" onClick={copyCode}>
              <div className="flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                <span>{copied ? "Copied!" : "Copy code"}</span>
              </div>
            </button>
          </div>
          {value && (
            <pre
              style={customCodeStyle}
              className={`language-${value?.language}`}
            >
              <code>
                {value.code
                  ? value.code
                  : "Error fetching code snippet. Please try again"}
              </code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
