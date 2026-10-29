import { Head } from "@inertiajs/react";
import React, { useRef, useState, lazy, Suspense } from "react";
import ImagePreview from "@/Components/ImagePreview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/Components/Loader";
import { Button, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { downloadImagesAsZip } from "@/Components/Common/common";
import ImageModelSelector from "@/Components/ImageModelSelector";
import axios from "axios";
import { IMAGE_EDIT_MODELS } from "@/Components/Common/constant";
import ImageNumberSelector from "@/Components/ImageNumberSelector";
const AuthenticatedLayout = lazy(() => import("@/Layouts/AuthenticatedLayout"));
const InputLabel = lazy(() => import("@/Components/InputLabel"));
const TextInput = lazy(() => import("@/Components/TextInput"));
const ImageUploader = lazy(() => import("@/Components/ImageUploader"));
const PrimaryButton = lazy(() => import("@/Components/PrimaryButton"));
const InputError = lazy(() => import("@/Components/InputError"));

export default function CgModeling({ auth }) {
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState("gpt-image-1");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [noOfOutput, setOutputNumber] = useState(3);
  const scrollableRef = useRef(null);
  const endRef = useRef(null);
  const fileData =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.image ||
    null;
  const textData =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.title || "";

  const startNewThread = () => {
    const newThread = {
      id: Date.now(),
      draft: { title: "", image: null, errorFile: false },
      title: "",
      titleAdded: false,
      errors: [],
      generatedImages: null,
    };
    setThreads((prevThreads) => [...prevThreads, newThread]);
    setCurrentThreadId(newThread.id);
  };

  const selectThread = (threadId) => {
    setCurrentThreadId(threadId);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollableRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    setShowScrollButton(!nearBottom);
  };

  const handleDownloadImages = async () => {
    if (
      currentThread.generated &&
      currentThread.generated.length > 0 &&
      !isDownloading
    ) {
      try {
        setIsDownloading(true);
        const downloadImageData = currentThread.generated.map(
          (imgData) => imgData.b64_json
        );
        await downloadImagesAsZip(downloadImageData);
        setIsDownloading(false);
      } catch (e) {
        setIsDownloading(false);
      }
    }
  };

  const handleTitleChange = (e) => {
    const { name, value } = e.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              draft: {
                ...thread.draft,
                [name]: value,
              },
            }
          : thread
      )
    );
  };

  const handleGenerateImage = () => {
    if (isLoading) {
      return;
    }

    if (!textData || textData === "") {
      toast.warning("please provide title.");
      return;
    }
    try {
      const selectedType = IMAGE_EDIT_MODELS.find(
        (obj) => obj.id === selectedModel
      )?.type;
      setIsLoading(true);
      let prompt = "" + textData;
      if (selectedType === "gemini") {
        prompt +=
          " Generate " +
          noOfOutput +
          " different output images with variations.";
      }

      axios
        .post(
          route("openai.editImage"),
          {
            prompt: prompt,
            images: [fileData],
            n: noOfOutput,
            type: selectedType,
            model: selectedModel,
          },
          {
            timeout: 0,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        )
        .then(async (response) => {
          setThreads((threads) =>
            threads.map((thread) => {
              if (thread.id === currentThreadId) {
                thread.generated = response.data?.data;
              }
              return thread;
            })
          );

          setIsLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setIsLoading(false);
        });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const acceptedTypes = ["image/jpeg", "image/png", "image/gif"];
    const file = e.target.files[0];
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              draft: {
                ...thread.draft,
                image: file ? file : null,
                errorFile:
                  file && !acceptedTypes.includes(file.type) ? true : false,
              },
            }
          : thread
      )
    );
  };

  const currentThread = threads.find((thread) => thread.id === currentThreadId);

  return (
    <Suspense fallback={<Loader />}>
      <AuthenticatedLayout
        user={auth.user}
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            CgModeling
          </h2>
        }
      >
        <Head title="CgModeling" />

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
                const abbreviatedContent =
                  thread.title.length > 30
                    ? `${thread.title.slice(0, 30)}...`
                    : thread.title;

                return (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread.id)}
                    className={`mb-2 cursor-pointer border-b border-gray-200 ${
                      currentThreadId === thread.id ? "bg-gray-200" : ""
                    }`}
                  >
                    <p className="font-bold">Thread {thread.id}</p>
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
            {currentThreadId !== null && (
              <h2 className="mb-4 font-bold text-lg">
                Thread {currentThreadId}
              </h2>
            )}
          </div>

          <div
            className="flex-1 px-4 py-2 overflow-y-auto space-y-4 bg-gray-50 w-full pr-[60px]"
            ref={scrollableRef}
            onScroll={handleScroll}
          >
            {currentThreadId !== null && (
              <>
                <div className="flex flex-col mb-4 gap-2">
                  <div className="flex flex-row gap-4">
                    <ImageModelSelector
                      selectedModel={selectedModel}
                      onChange={(val) => setSelectedModel(val)}
                    />
                    <ImageNumberSelector
                      value={noOfOutput}
                      onChange={(val) => setOutputNumber(val)}
                    />
                  </div>
                  <div className="flex items-center">
                    <InputLabel
                      htmlFor="title"
                      className="pr-2 whitespace-nowrap"
                      value="Title"
                    />
                    <TextInput
                      id="title"
                      type="text"
                      name="title"
                      value={textData}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      onChange={handleTitleChange}
                    />
                  </div>
                  {threads.find((thread) => thread.id === currentThreadId)
                    ?.errors?.title && (
                    <InputError
                      className="text-red-500 text-sm mt-1 ml-8"
                      message={
                        threads.find((thread) => thread.id === currentThreadId)
                          .errors.title.message
                      }
                    />
                  )}
                </div>
                <div className="flex flex-col mb-4">
                  <div className="flex items-center">
                    <ImageUploader
                      imagetype="true"
                      inputName="uploadedImage"
                      labelValue="Upload Image"
                      inputId="sample-image"
                      imageSrc={fileData}
                      handleImageChanges={(e) => {
                        handleImageChange(e);
                      }}
                      fileInputRef={fileInputRef}
                      imageStyle={{
                        size: "pt-2 m-0 w-48 h-auto",
                        imgContainer: "flex items-center",
                      }}
                    />
                  </div>
                  {threads.find((thread) => thread.id === currentThreadId)
                    ?.errors?.uploadedImage && (
                    <InputError
                      className={`text-red-500 text-sm ${
                        !fileData ? "mt-[-22px]" : "mt-[-14px]"
                      }`}
                      message={
                        threads.find((thread) => thread.id === currentThreadId)
                          .errors.uploadedImage.message
                      }
                    />
                  )}
                </div>
                <div className="flex items-center">
                  <PrimaryButton onClick={handleGenerateImage} type="submit">
                    {isLoading ? <CircularProgress /> : "Generate"}
                  </PrimaryButton>
                </div>
              </>
            )}
            {currentThread?.generated && (
              <>
                <div className="p-4 flex flex-row">
                  <Button onClick={handleDownloadImages}>Download all</Button>
                  {isDownloading && <CircularProgress />}
                </div>
              </>
            )}
            {currentThreadId !== null && (
              <ImagePreview
                currentThreadId={currentThreadId}
                currentThread={currentThread}
              />
            )}
            <div ref={endRef} />
          </div>
          {currentThreadId && (
            <div className=" flex-none  border-t p-4">
              <div className="flex items-center">
                {showScrollButton && !isLoading && (
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 backdrop-blur-sm opacity-75">
                    <button
                      onClick={scrollToBottom}
                      className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AuthenticatedLayout>
    </Suspense>
  );
}
