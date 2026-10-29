import { Head } from "@inertiajs/react";
import React, { useEffect, useState, Suspense } from "react";
import TextWithEdits from "../Components/TextWithEdits";
import Loader from "@/Components/Loader";
import { toast } from "react-toastify";
const AuthenticatedLayout = React.lazy(() =>
  import("@/Layouts/AuthenticatedLayout")
);
const ButtonCopyToClipboard = React.lazy(() =>
  import("@/Components/ButtonCopyToClipboard")
);

const Proofread = (props) => {
  const { auth } = props;
  const { user } = auth;
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMode, seResultMode] = useState(false);

  useEffect(() => {}, [answer]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message) {
      toast.warning("メッセージがありません");
      return;
    }

    setAnswer("");
    seResultMode(false);

    if (loading) return;
    setLoading(true);

    try {
      const formMessages = [
        {
          role: "system",
          content:
            "You are a professional proofreader. Fix grammar, spelling, punctuation, and clarity issues in any text provided. Rewrite naturally while preserving meaning. Respond only with the corrected version.",
        },
        {
          role: "user",
          content: message,
        },
      ];
      const controller = new AbortController();
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");

      const response = await fetch(route("openai.chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({ messages: formMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // console.error(await response.text());
        toast.error("Something went wrong.");
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          seResultMode(true);
          setLoading(false);
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setAnswer(assistantText);
      }
    } catch (error) {
      toast.error("Something went wrong.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <Suspense fallback={<Loader />}>
      <AuthenticatedLayout
        user={user}
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Proofread
          </h2>
        }
      >
        <Head title="Proofread" />
        <div className="flex flex-1 relative overflow-hidden flex-col">
          <div className="flex flex-row pt-2 ">
            <div className="flex-[2]">
              {resultMode ? (
                <button
                  type="button"
                  className="h-8 w-12 mx-2 my-2 items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
                  onClick={() => seResultMode(false)}
                >
                  Edit
                </button>
              ) : (
                <div name="spacer" className="h-8 my-2" />
              )}
            </div>
            <div className="flex-[2] ml-6">
              {resultMode ? (
                <ButtonCopyToClipboard textToCopy={answer} />
              ) : (
                <div name="spacer" className="h-8 my-2" />
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-row gap-8 w-full overflow-y-auto p-2 mb-4">
            {/* left container */}
            <div className="flex flex-[2] ">
              <div className="flex flex-1 flex-col w-full mx-0 bg-white  shadow-sm sm:rounded-lg">
                <div className="flex flex-col h-full text-gray-900">
                  {resultMode ? (
                    <div className="w-full h-full p-3 mx-2 bg-white shadow-sm sm:rounded-lg">
                      <div className="text-gray-900">
                        {message && answer && TextWithEdits(answer, message)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-hidden">
                      <textarea
                        className="py-3 resize-none  overflow-auto h-full px-4 block w-full border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 sm:p-4 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                        placeholder="Input here..."
                        value={message}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* right container */}
            <div className="flex-[2] ">
              <div className="p-3 mx-2 h-full bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="text-gray-5/6">
                  {message && answer && TextWithEdits(message, answer)}
                </div>
              </div>
            </div>
          </div>

          {/* middle section */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div name="spacer" className="h-8 my-2" />
            {loading ? (
              <div className="text-center">
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="h-10 px-1 items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
                onClick={handleSubmit}
              >
                →
              </button>
            )}
          </div>
        </div>
      </AuthenticatedLayout>
    </Suspense>
  );
};
export default Proofread;
