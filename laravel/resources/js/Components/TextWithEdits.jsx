import { diffChars } from "diff";
export default function TextWithEdits(originalText, editedText) {
  const diffs = diffChars(originalText, editedText);
  let result = "";

  diffs.forEach((part) => {
    if (part.added) {
      result += `<mark>${part.value}</mark>`;
    } else if (!part.removed) {
      result += part.value;
    }
  });

  let result_with_br = "";
  result.split(/\n/).forEach((part) => {
    result_with_br += part + "<br />";
  });

  return <div dangerouslySetInnerHTML={{ __html: result_with_br }} />;
}
