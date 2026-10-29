import { useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { IconButton } from "@mui/material";
import PreviewIcon from "@mui/icons-material/Preview";
import DownloadIcon from "@mui/icons-material/Download";

export default function YourComponent({ currentThreadId, currentThread }) {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (currentThreadId === null || !currentThread?.generated) return null;

  // Extract images array (base64 strings)
  const images = currentThread.generated.map(
    (imgData) => `data:image/png;base64,${imgData.b64_json}`
  );

  return (
    <PhotoProvider
      visible={visible}
      onVisibleChange={setVisible}
      currentIndex={currentIndex}
      onIndexChange={setCurrentIndex}
      maskOpacity={0.7}
    >
      <div className="flex flex-row flex-wrap  w-full  gap-2 content-start p-4 pt-0">
        {images.map((imageData, index) => (
          <div
            key={"generated-" + imageData}
            className="flex flex-col p-2 bg-white shadow-md text-gray-800 flex items-center justify-center rounded"
          >
            <div className="flex flex-row gap-2 justify-between text-xs">
              {/* Preview button triggers opening the lightbox on this image */}
              <IconButton
                onClick={() => {
                  setCurrentIndex(index);
                  setVisible(true);
                }}
              >
                <PreviewIcon />
              </IconButton>

              {/* Your download button - implement download logic separately */}
              <IconButton
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = imageData;
                  link.download = `image-${index}.png`;
                  link.click();
                }}
              >
                <DownloadIcon />
              </IconButton>
            </div>

            {/* Image thumbnail wrapped in PhotoView */}
            <PhotoView src={imageData}>
              <img
                src={imageData}
                alt={`generated-${index}`}
                className="w-[150px] rounded cursor-pointer object-cover mt-2"
              />
            </PhotoView>
          </div>
        ))}
      </div>
    </PhotoProvider>
  );
}
