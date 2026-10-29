import { forwardRef, useRef } from "react";

export default forwardRef(function FileInput(
  { className = "", ...props },
  ref
) {
  const input = ref ? ref : useRef();

  return (
    <input
      type="file"
      className={"block w-full text-sm text-slate-500" + className}
      {...props}
      accept={props.imagetype && "image/*"}
      ref={input}
    />
  );
});
