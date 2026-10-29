import { Head } from "@inertiajs/react";
import React, { useState, Suspense, useEffect, useRef } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "@/Components/Dropdown";
import Loader from "@/Components/Loader";
import {
  faPlus,
  faPaperPlane,
  faSpinner,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import CustomAudioPlayer from "@/Components/CustomAudioPlayer";
import { toast } from "react-toastify";
import { VOICE_MODELS } from "@/Components/Common/constant";
import axios from "axios";
const AuthenticatedLayout = React.lazy(() =>
  import("@/Layouts/AuthenticatedLayout")
);
const InputLabel = React.lazy(() => import("@/Components/InputLabel"));
const TextInput = React.lazy(() => import("@/Components/TextInput"));
const InputError = React.lazy(() => import("@/Components/InputError"));

const options = [
  { label: "select", value: "" },
  { label: "Man", value: "onyx" },
  { label: "Women", value: "shimmer" },
];

const Voice = (props) => {
  const { auth } = props;
  const { user } = auth;
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini-tts");
  const chatMessagesRef = useRef(null);
  const textareaRef = useRef(null);
  const endRef = useRef(null);
  const title =
    threads.find((thread) => thread.id === currentThreadId)?.title || "";

  const chatMessage =
    threads.find((thread) => thread.id === currentThreadId)?.chatMessage || "";

  const selectedOption =
    threads.find((thread) => thread.id === currentThreadId)?.selectedOption ||
    "";

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
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [threads]);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  const handleScroll = () => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    setShowScrollButton(!nearBottom);
  };

  const handleSelectChange = (threadId, selectedValue) => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            selectedOption: selectedValue,
          };
        }
        return thread;
      })
    );
  };

  const valueSelected = (selectedValue) => {
    handleSelectChange(currentThreadId, selectedValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, [name]: value } : thread
      )
    );
  };

  const startNewThread = () => {
    const newThread = { id: Date.now(), messages: [] };
    setThreads((prevThreads) => [...prevThreads, newThread]);
    setCurrentThreadId(newThread.id);
  };

  const selectThread = (threadId) => {
    setCurrentThreadId(threadId);
  };

  const handleCreateAudio = async () => {
    if (
      chatMessage === "" ||
      // title === "" ||
      selectedOption === "" ||
      isLoading
    ) {
      toast.warning("please select voice type and message.");
      return;
    }
    setIsLoading(true);
    const timestamp = new Date();
    const newThreads = threads.map((thread) => {
      if (thread.id === currentThreadId) {
        thread.messages.push({
          role: "user",
          msg: chatMessage,
          created: timestamp,
          content: thread,
        });
        thread.chatMessage = "";
      }
      return thread;
    });
    setThreads(newThreads);
    try {
      const selectedType = VOICE_MODELS.find(
        (obj) => obj.id === selectedModel
      )?.type;
      axios
        .post(
          route("openai.voice"),
          {
            title: title || "",
            message: chatMessage,
            voice: selectedOption,
            type: selectedType,
            model: selectedModel,
          },
          { responseType: "blob" }
        )
        .then(async (response) => {
          const audioType = selectedType === "gpt" ? "audio/mpeg" : "audio/wav";
          const blob = new Blob([response.data], { type: audioType });
          const url = URL.createObjectURL(blob);

          setThreads((threads) =>
            threads.map((thread) => {
              if (thread.id === currentThreadId) {
                thread.messages.push({
                  role: "assistant",
                  content: url,
                });
              }
              return thread;
            })
          );

          setIsLoading(false);
        })
        .catch((error) => {
          console.error(error);
          addErrorToThread(newThreads);
          setIsLoading(false);
        });
    } catch (e) {
      console.error(e);
      addErrorToThread(newThreads);
      setIsLoading(false);
    }
  };
  const addErrorToThread = (newThreads) => {
    try {
      const nextThreads = newThreads.map((thread) => {
        if (thread.id === currentThreadId) {
          thread.messages.push({
            role: "assistant",
            content: "error",
          });
        }
        return thread;
      });
      setThreads([...nextThreads]);
    } catch (e) {
      toast.error("Something went wrong.");
    }
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentThread = threads.find((thread) => thread.id === currentThreadId);

  return (
    <Suspense fallback={<Loader />}>
      <AuthenticatedLayout
        user={user}
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Voice
          </h2>
        }
      >
        <Head title="Voice" />
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
                const { id, messages } = thread;
                const abbreviatedContent =
                  messages[0]?.content?.title?.length > 30
                    ? `${messages[0]?.content?.title?.slice(0, 30)}...`
                    : messages[0]?.content?.title;

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
              onClick={toggleSidebar}
              className="w-[50px] y-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              <FontAwesomeIcon
                icon={showSidebar ? faAngleLeft : faAngleRight}
              />
            </button>
            {currentThreadId !== null && (
              <>
                <h2 className="mb-4 font-bold text-lg">
                  Thread {currentThreadId}
                </h2>
                <div className="relative mt-2 flex flex-col">
                  <div className="flex flex-row gap-5">
                    <div className="flex">
                      <InputLabel
                        className="text-gray-600 pt-2 pr-2"
                        value="Voice Type: "
                      />
                      <Dropdown
                        threadId={currentThreadId}
                        selectedOption={selectedOption}
                        handleSelectChange={(selectedValue) => {
                          valueSelected(selectedValue);
                        }}
                      >
                        <Dropdown.Select
                          id="selectedValue"
                          options={options}
                          value={selectedOption}
                          onChange={(selectedValue) => {
                            valueSelected(selectedValue);
                          }}
                        />
                      </Dropdown>
                    </div>
                    <div className="flex flex-row gap-4">
                      <label className="flex items-center text-gray-600 whitespace-nowrap">
                        Model Type:
                      </label>
                      <select
                        id="model"
                        name="model"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="block w-full text-gray-500 rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {VOICE_MODELS.map((model) => (
                          <option key={"voice-" + model.id} value={model.id}>
                            {model.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentThread?.errors?.selectedValue && (
                      <InputError
                        className="text-red-500 text-sm mt-1"
                        message={currentThread.errors.selectedValue.message}
                      />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex mt-4">
                      <InputLabel
                        htmlFor="title"
                        className="text-gray-600 pt-2 pr-2"
                        value="Instruction:"
                      />
                      <div>
                        <TextInput
                          id="title"
                          type="text"
                          className="w-full sm:w-64 lg:w-96"
                          name="title"
                          value={title}
                          onChange={handleChange}
                        />
                        {currentThread?.errors?.title && (
                          <InputError
                            className="text-red-500 text-sm mt-1 ml-8"
                            message={currentThread.errors.title.message}
                          />
                        )}
                      </div>
                    </div>
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
            {currentThreadId !== null &&
              currentThread.messages.map((chatMessage, index) => {
                const { content, role, msg } = chatMessage;
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
                        <div className="p-2 rounded-md ">
                          {content === "error" ? (
                            <p className="text-[#ff0000] ">
                              {
                                "⚠️ An error occurred while retriving the response."
                              }
                            </p>
                          ) : (
                            <CustomAudioPlayer url={content} />
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
                          <div>{msg}</div>
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
              <div className="flex items-center gap-2">
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

                <textarea
                  ref={textareaRef}
                  className="flex-grow p-1 rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  name="chatMessage"
                  value={chatMessage}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateAudio();
                    }
                  }}
                  style={{
                    resize: "none",
                    height: "100px",
                    maxHeight: "200px",
                  }}
                />

                <button
                  onClick={handleCreateAudio}
                  className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
                >
                  {isLoading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </AuthenticatedLayout>
    </Suspense>
  );
};
export default Voice;
