import { Head } from "@inertiajs/react";
import React, { Suspense, useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Loader from "@/Components/Loader";
import {
  faPlus,
  faAngleLeft,
  faAngleRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import ImagePreview from "@/Components/ImagePreview";
import { toast } from "react-toastify";
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
const InputError = React.lazy(() => import("@/Components/InputError"));
const PrimaryButton = React.lazy(() => import("@/Components/PrimaryButton"));
const ImageUploader = React.lazy(() => import("@/Components/ImageUploader"));
const Image = React.lazy(() => import("@/Components/Image"));

export default function Banner({ auth }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const chatMessagesRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState("gpt-image-1");
  const [noOfOutput, setOutputNumber] = useState(3);
  const endRef = useRef(null);
  const inputTitle =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.title || "";
  const inputText1 =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.text1 || "";
  const inputText2 =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.text2 || "";
  const inputText3 =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.text3 || "";
  const uploadBackgroundImages =
    threads.find((thread) => thread.id === currentThreadId)?.imagesDraft
      ?.backgroundImage || null;
  const uploadSampleImages =
    threads.find((thread) => thread.id === currentThreadId)?.imagesDraft
      ?.sampleImage || null;

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleScroll = () => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    setShowScrollButton(!nearBottom);
  };

  const startNewThread = () => {
    const newThread = {
      id: Date.now(),
      errors: [],
      messages: [],
      draft: {
        title: "",
        text1: "",
        text2: "",
        text3: "",
      },
      imagesDraft: {
        backgroundImage: null,
        sampleImage: null,
      },
    };
    setThreads((prevThreads) => [...prevThreads, newThread]);
    setCurrentThreadId(newThread.id);
  };

  const selectThread = (threadId) => {
    setCurrentThreadId(threadId);
  };

  const handleInputsChange = (event) => {
    const { name, value } = event.target;
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

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageChanges = (event) => {
    const { name, files } = event.target;
    if (files && files[0]) {
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                imagesDraft: {
                  ...thread.imagesDraft,
                  [name]: files[0],
                },
              }
            : thread
        )
      );
    }
  };

  const onSubmit = async () => {
    if (
      !inputTitle === "" ||
      inputText1 === "" ||
      inputText2 === "" ||
      inputText3 === ""
    ) {
      toast.warning("please provide required informations.");
      return;
    }

    setIsLoading(true);
    try {
      const selectedType = IMAGE_EDIT_MODELS.find(
        (obj) => obj.id === selectedModel
      )?.type;

      let prompt = `
            Using second image as a sample image, Edit and Generate 3 images with banner texts using the first image.
            Each image must include the following 3 banner texts clearly visible:
            1."${inputText1}".
            2."${inputText2}".
            3."${inputText3}".
            Ensure the style is consistent across images but with variation in layout or background. The banners should be easy to read and aesthetically placed.
              ${inputTitle}`;
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
            images: [uploadBackgroundImages, uploadSampleImages],
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
    } catch (e) {
      setIsLoading(false);
    }
  };

  const currentThread = threads.find((thread) => thread.id === currentThreadId);

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

  return (
    <Suspense fallback={<Loader />}>
      <AuthenticatedLayout
        user={auth.user}
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Banner
          </h2>
        }
      >
        <Head title="Banner" />
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
                const abbreviatedContent = (
                  thread.messages[0]?.draft?.title || ""
                ).slice(0, 30);

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

        <div className="flex-1 flex flex-col overflow-hidden ">
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
              <h2 className="mb-4 font-bold text-lg">
                Thread {currentThreadId}
              </h2>
            )}
          </div>
          <div
            className="flex-1 px-4 py-2 overflow-y-auto space-y-4 bg-gray-50 w-full pr-[60px]"
            onScroll={handleScroll}
            ref={chatMessagesRef}
          >
            {currentThreadId !== null && (
              <>
                {currentThreadId !== null && (
                  <div className="mx-auto mt-2">
                    <div className="grid md:grid-2 gap-5">
                      {threads
                        .find((thread) => thread.id === currentThreadId)
                        ?.messages?.filter(
                          (message) => message.role === "assistant"
                        )
                        .map((message, key) => {
                          return (
                            <div className="mt-2 p-2 rounded-md bg-gray-200 flex-1 w-8/12 self-end ml-auto">
                              <Image
                                className="mt-2"
                                key={key}
                                imageSrc={message.images[0]}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
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
                      value="Title:"
                    />
                    <div className="flex flex-col flex-grow">
                      <TextInput
                        id="title"
                        type="text"
                        name="title"
                        value={inputTitle}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        onChange={handleInputsChange}
                      />
                    </div>
                    {threads.find((thread) => thread.id === currentThreadId)
                      ?.errors?.title && (
                      <InputError
                        className="mt-1"
                        message={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).errors?.title.message
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="w-full mb-4 flex items-start space-x-4">
                  <InputLabel
                    htmlFor="backgroundImage"
                    className="p-2 whitespace-nowrap"
                    value="Upload Background Image"
                  />
                  <div className="flex-1">
                    <ImageUploader
                      imagetype="true"
                      inputId="backgroundImage"
                      inputName="backgroundImage"
                      imageSrc={uploadBackgroundImages}
                      handleImageChanges={(event) => {
                        handleImageChanges(event);
                      }}
                      imageStyle={{
                        size: "m-0 w-48 mx-auto",
                        imageContainer: "flex items-center",
                      }}
                    />
                    {threads.find((thread) => thread.id === currentThreadId)
                      ?.errors?.backgroundImage && (
                      <InputError
                        className="mt-2"
                        message={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).errors.backgroundImage.message
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="w-full mb-4 flex items-start space-x-4">
                  <InputLabel
                    htmlFor="sampleImage"
                    className="p-2 whitespace-nowrap"
                    value="Upload Sample Image"
                  />
                  <div className="container mx-auto">
                    <ImageUploader
                      imagetype="true"
                      inputId="sampleImage"
                      inputName="sampleImage"
                      imageSrc={uploadSampleImages}
                      handleImageChanges={(event) => {
                        handleImageChanges(event);
                      }}
                      imageStyle={{
                        size: "m-0 w-48 mx-auto",
                        imageContainer: "flex items-center",
                      }}
                    />
                    {threads.find((thread) => thread.id === currentThreadId)
                      ?.errors?.sampleImage && (
                      <InputError
                        className="mt-2"
                        message={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).errors.sampleImage.message
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <InputLabel
                    htmlFor="text1"
                    className="pr-2 whitespace-nowrap"
                    value="Text 1:"
                  />
                  <div className="w-full md-4">
                    <TextInput
                      id="text1"
                      type="text"
                      name="text1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={inputText1}
                      onChange={handleInputsChange}
                    />
                    {threads.find((thread) => thread.id === currentThreadId)
                      ?.errors?.text1 && (
                      <InputError
                        className="mt-1"
                        message={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).errors?.text1.message
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <InputLabel
                    htmlFor="text2"
                    className="pr-2 whitespace-nowrap"
                    value="Text 2:"
                  />
                  <div className="w-full md-4">
                    <TextInput
                      id="text2"
                      type="text"
                      name="text2"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={inputText2}
                      onChange={handleInputsChange}
                    />
                    {threads.find((thread) => thread.id === currentThreadId)
                      ?.errors?.text2 && (
                      <InputError
                        className="mt-1"
                        message={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).errors?.text2.message
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <InputLabel
                    htmlFor="text3"
                    className="pr-2 whitespace-nowrap"
                    value="Text 3:"
                  />
                  <div className="w-full md-4">
                    <TextInput
                      id="text3"
                      type="text"
                      name="text3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={inputText3}
                      onChange={handleInputsChange}
                    />
                    {threads.find((thread) => thread.id === currentThreadId)
                      .errors?.text3 && (
                      <InputError
                        className="mt-1"
                        message={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).errors?.text3.message
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <PrimaryButton
                    onClick={onSubmit}
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading && <CircularProgress />}
                    Generate
                  </PrimaryButton>
                </div>

                {currentThread?.generated && (
                  <>
                    <div className="p-4 flex flex-row">
                      <Button onClick={handleDownloadImages}>
                        Download all
                      </Button>
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
