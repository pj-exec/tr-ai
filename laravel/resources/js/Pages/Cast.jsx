import { Head } from "@inertiajs/react";
import React, { useState, Suspense, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/Components/Loader";
import ImagePreview from "@/Components/ImagePreview";
import { toast } from "react-toastify";
import axios from "axios";
import { Button, CircularProgress } from "@mui/material";
import { downloadImagesAsZip } from "@/Components/Common/common";
import ImageModelSelector from "@/Components/ImageModelSelector";
import { IMAGE_EDIT_MODELS } from "@/Components/Common/constant";
import ImageNumberSelector from "@/Components/ImageNumberSelector";
const AuthenticatedLayout = React.lazy(() =>
  import("@/Layouts/AuthenticatedLayout")
);
const InputLabel = React.lazy(() => import("@/Components/InputLabel"));
const TextInput = React.lazy(() => import("@/Components/TextInput"));
const PrimaryButton = React.lazy(() => import("@/Components/PrimaryButton"));
const DangerButton = React.lazy(() => import("@/Components/DangerButton"));
const ImageCard = React.lazy(() => import("@/Components/ImageCard"));
const ApplicationLogo = React.lazy(() =>
  import("@/Components/ApplicationLogo")
);

export default function Cast({ auth }) {
  const [threads, setThreads] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const scrollableRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-image-1");
  const [noOfOutput, setOutputNumber] = useState(3);
  const endRef = useRef(null);
  const textData =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.title || "";

  const startNewThread = () => {
    const newThread = { id: Date.now(), error: [], messages: [] };
    setThreads((prevThreads) => [...prevThreads, newThread]);
    setCurrentThreadId(newThread.id);
    setUploadedImages([]);
  };

  const selectThread = (threadId) => {
    setCurrentThreadId(threadId);
    renderCurrentUserThread(threadId);
  };

  const handleScroll = () => {
    const el = scrollableRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    setShowScrollButton(!nearBottom);
  };

  const renderCurrentUserThread = (threadId) => {
    const latestUserMessage = threads
      .find((thread) => thread.id === threadId)
      ?.messages.filter((message) => message.role === "user")
      .slice(-1)[0];

    setUploadedImages(latestUserMessage?.content?.images);
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setUploadedImages(files);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageDelete = (index) => {
    setUploadedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleGenerateImage = async () => {
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
      let prompt = "Using input images as a sample image." + textData;
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
            images: uploadedImages,
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

  const currentThread = threads.find((thread) => thread.id === currentThreadId);

  return (
    <Suspense fallback={<Loader />}>
      <AuthenticatedLayout
        user={auth.user}
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Cast
          </h2>
        }
      >
        <Head title="Cast" />

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
                  thread.messages[0]?.content.title.length > 30
                    ? `${thread.messages[0]?.content.title.slice(0, 30)}...`
                    : thread.messages[0]?.content.title;
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
            {threads.length !== 0 && (
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
            {threads.length !== 0 && (
              <>
                <div className="flex flex-col  gap-2">
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
                    <div className="flex flex-col flex-grow">
                      <TextInput
                        id="title"
                        type="text"
                        name="title"
                        value={textData}
                        onChange={handleTitleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex mb-4">
                  <label htmlFor="sample-image" className="block relative">
                    <div className="flex items-center">
                      <span className="my-auto pr-2 whitespace-nowrap block font-medium text-sm text-gray-700">
                        + Add sample image
                      </span>
                      <div className="file mr-3 py-2 px-4  rounded-full border-0 text-sm font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100">
                        Choose File
                      </div>
                      {uploadedImages && uploadedImages.length > 0 ? (
                        <span className="text-sm text-slate-500">
                          {uploadedImages.length}{" "}
                          {uploadedImages.length > 1 ? "files" : "file"}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">
                          No file chosen
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2">
                      <input
                        type="file"
                        id="sample-image"
                        className="opacity-0 absolute inset-0 col-start-1 hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          handleImageChange(e);
                        }}
                      />
                    </div>
                  </label>
                </div>

                {uploadedImages && uploadedImages.length > 0 && (
                  <div className="container mx-auto mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map((imageSrc, index) => {
                        let imageUrl = null;

                        if (imageSrc instanceof Blob) {
                          imageUrl = URL.createObjectURL(imageSrc);
                        } else {
                          console.warn(
                            "imageSrc is not a valid Blob or File:",
                            imageSrc
                          );
                        }
                        return (
                          <ImageCard key={index} image={imageUrl}>
                            <DangerButton
                              type="button"
                              className="mt-4 w-full"
                              onClick={() => handleImageDelete(index)}
                            >
                              Delete
                            </DangerButton>
                          </ImageCard>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <PrimaryButton onClick={handleGenerateImage}>
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
                <ImagePreview
                  currentThreadId={currentThreadId}
                  currentThread={currentThread}
                />
              </>
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
