import { Head } from "@inertiajs/react";
import React, { useState, Suspense, useEffect, useRef } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Loader from "@/Components/Loader";
import { toast } from "react-toastify";
import {
  faPlus,
  faPaperPlane,
  faSpinner,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import CustomInputChat from "@/Components/CustomInputChat";
import { CHAT_MODELS } from "@/Components/Common/constant";
const AuthenticatedLayout = React.lazy(() =>
  import("@/Layouts/AuthenticatedLayout")
);
const CodeResponseMessage = React.lazy(() =>
  import("@/Components/CodedResponseMessage")
);
const InputLabel = React.lazy(() => import("@/Components/InputLabel"));
const TextInput = React.lazy(() => import("@/Components/TextInput"));
const InputError = React.lazy(() => import("@/Components/InputError"));

const Option = (props) => {
  const { auth } = props;
  const { user } = auth;
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const chatMessagesRef = useRef(null);
  const textareaRef = useRef(null);
  const endRef = useRef(null);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, [name]: value } : thread
      )
    );
  };

  useEffect(() => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  }, [threads.length, currentThreadId]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threads]);

  const startNewThread = () => {
    const newThread = { id: Date.now(), messages: [], errors: {} };
    setCurrentThreadId(newThread.id);
    setThreads((prevThreads) => [...prevThreads, newThread]);
  };

  const handleModelChange = (value) => {
    setSelectedModel(value);
  };

  const selectThread = (threadId) => {
    setCurrentThreadId(threadId);
  };

  const chatMessage =
    threads.find((thread) => thread.id === currentThreadId)?.chatMessage || "";
  const title =
    threads.find((thread) => thread.id === currentThreadId)?.title || "";
  const currentThread = threads.find((thread) => thread.id === currentThreadId);

  const sendMessage = async () => {
    if (chatMessage === "" || title === "") {
      toast.warning("Please enter chat message and title.");
      return;
    }
    setIsLoading(true);

    const newThreads = threads.map((thread) => {
      if (thread.id === currentThreadId) {
        thread.messages.push({
          role: "user",
          content: chatMessage,
        });
        thread.chatMessage = "";
      }
      return thread;
    });

    const formMessages = newThreads.find(
      (thread) => thread.id === currentThreadId
    ).messages;

    try {
      const selectedType = CHAT_MODELS.find(
        (obj) => obj.id === selectedModel
      )?.type;
      const optionMessages = [
        {
          role: "system",
          content: `
            You are an expert assistant.
            Always respond in numbered options.
            Format like:
            Option 1: [text here]
            Option 2: [text here]
            Option 3: [text here]
            Do NOT write anything outside the options list.
          `,
        },
        ...formMessages,
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
        body: JSON.stringify({
          messages: optionMessages,
          model: selectedModel,
          type: selectedType,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        // console.error(await response.text());
        toast.error("Something went wrong.");
        setIsLoading(false);
        addErrorToThread(newThreads);
        return;
      }
      const nextThreads = newThreads.map((thread) => {
        if (thread.id === currentThreadId) {
          thread.messages.push({ role: "assistant", content: "" });
        }
        return thread;
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        updateLastAssistantMessage(nextThreads, assistantText);
      }
    } catch (e) {
      console.error(e);
      addErrorToThread(newThreads);
      setIsLoading(false);
    }
  };

  const addErrorToThread = (newThreads) => {
    const nextThreads = newThreads.map((thread) => {
      if (thread.id === currentThreadId) {
        thread.messages.push({
          role: "assistant",
          content: "⚠️ An error occurred while retriving the response.",
        });
      }
      return thread;
    });
    setThreads([...nextThreads]);
  };

  const updateLastAssistantMessage = (nextThreads, assistantText) => {
    const finalThreads = nextThreads.map((thread) => {
      if (thread.id === currentThreadId) {
        const nextMessages = thread.messages;
        const assistantIndex = nextMessages
          .map((m) => m.role)
          .lastIndexOf("assistant");

        if (assistantIndex === -1) {
          nextMessages.push({ role: "assistant", content: "" });
        }

        const indexToUpdate =
          assistantIndex === -1 ? nextMessages.length - 1 : assistantIndex;

        thread.messages[indexToUpdate].content = assistantText;
      }
      return thread;
    });
    setThreads([...finalThreads]);
  };

  function detectCode(message) {
    const codeSnippetRegex = /```[\s\S]*?```/g;
    return codeSnippetRegex.test(message);
  }
  const codeResponse = (message) => {
    const botMessage = message
      .split(/(```[\s\S]*?```)/g)
      .map((content) =>
        detectCode(content) ? handleGenerateSnip(content) : content
      );
    return botMessage;
  };

  const handleScroll = () => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    setShowScrollButton(!nearBottom);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Suspense fallback={<Loader />}>
      <AuthenticatedLayout
        user={user}
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Option
          </h2>
        }
      >
        <Head title="Option" />
        {showSidebar && (
          <div className="overflow-y-auto w-64 p-4 border-r">
            <button
              onClick={startNewThread}
              className="mb-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            {threads
              .slice(0)
              .reverse()
              .map((thread) => {
                const { messages, id } = thread;
                const botMessage = messages[0]?.content;
                const abbreviatedContent =
                  botMessage?.length > 30
                    ? `${botMessage.slice(0, 30)}...`
                    : botMessage;

                return (
                  <div
                    key={id}
                    onClick={() => selectThread(id)}
                    className={`mb-2 cursor-pointer border-b border-gray-200 ${
                      currentThreadId === id ? "bg-gray-200" : ""
                    }`}
                  >
                    <p className="font-bold">Thread {id}</p>
                    <p className="text-gray-500 truncate">
                      {abbreviatedContent}
                    </p>
                  </div>
                );
              })}
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-none flex flex-col gap-0 bg-gray-100 w-full z-10 p-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-[50px] y-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              <FontAwesomeIcon
                icon={showSidebar ? faAngleLeft : faAngleRight}
              />
            </button>

            {currentThread && (
              <>
                <h2 className="mb-4 font-bold text-lg">
                  Thread {currentThreadId}
                </h2>
                <div className="flex mb-4">
                  <InputLabel
                    htmlFor="title"
                    className="pt-2 pr-2 whitespace-nowrap"
                    value="Title"
                  />
                  <div className="w-full mb-2">
                    <TextInput
                      type="text"
                      className="mt-1 block rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full"
                      name="title"
                      value={title}
                      onChange={handleChange}
                    />
                    {currentThread.errors?.title && (
                      <InputError
                        className="text-red-500 text-sm mt-1 ml-8"
                        message={currentThread.errors.title.message}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-4 bg-gray-50 w-full pr-[60px]"
            ref={chatMessagesRef}
            onScroll={handleScroll}
          >
            {currentThread &&
              currentThread.messages.map((chatMessage, index) => {
                const { content, role } = chatMessage;
                const transformedContent = detectCode(content)
                  ? codeResponse(content)
                  : content;

                return (
                  <div
                    key={index}
                    className={`my-2 p-2 ${
                      role === "user" ? "self-end" : "flex self-start"
                    }`}
                  >
                    {role === "assistant" && (
                      <div className="flex items-center space-x-2">
                        <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                        <div className="p-2 rounded-md bg-gray-200">
                          {Array.isArray(transformedContent) ? (
                            <CodeResponseMessage content={content} />
                          ) : (
                            <pre className="whitespace-pre-wrap">
                              {transformedContent}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                    {role === "user" && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white">
                          To
                        </div>
                        <div className="p-2 rounded-md border border-gray-300">
                          <div>{content}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            <div ref={endRef} />
          </div>

          {currentThreadId && (
            <div className=" flex-none  border-t p-4">
              <div className="flex items-center">
                {showScrollButton && !isLoading && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 backdrop-blur-sm opacity-75">
                    <button
                      onClick={scrollToBottom}
                      className="  py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
                    >
                      ↓
                    </button>
                  </div>
                )}
                <CustomInputChat
                  ref={textareaRef}
                  chatText={chatMessage}
                  onChange={handleChange}
                  name="chatMessage"
                  handleInputKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  onSendMessage={sendMessage}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  handleModelChange={handleModelChange}
                />
              </div>
            </div>
          )}
        </div>
      </AuthenticatedLayout>
    </Suspense>
  );
};
export default Option;
