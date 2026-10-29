import CodeSnippet from "@/Components/CodeSnippet";

export default function CodeResponseMessage({ content }) {
  const codeSnippetStyle = {
    margin: "0",
    padding: "10px",
    overflow: "auto",
    borderRadius: "0 0 .5rem .5rem",
  };
  let message;
  try {
    message = JSON.parse(content);
  } catch (e) {
    message = content;
  }

  return (
    <div>
      {message &&
        message.length > 0 &&
        message.map((item, idx) =>
          typeof item !== "string" ? (
            <CodeSnippet
              key={"snipppet" + idx}
              value={item}
              customCodeStyle={codeSnippetStyle}
            />
          ) : (
            <pre key={"message-snippet-" + idx} className="whitespace-pre-wrap">
              {item}
            </pre>
          )
        )}
    </div>
  );
}
